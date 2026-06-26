package uz.forkbomb.academix.teacher;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.course.CourseService;
import uz.forkbomb.academix.course.dto.CreateLessonRequest;
import uz.forkbomb.academix.course.dto.LessonResponse;
import uz.forkbomb.academix.shared.ai.AIService;
import uz.forkbomb.academix.shared.exception.ForbiddenException;
import uz.forkbomb.academix.shared.exception.ResourceNotFoundException;
import uz.forkbomb.academix.shared.model.*;
import uz.forkbomb.academix.shared.repository.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ExamResultRepository examResultRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final AIService aiService;
    private final CourseService courseService;

    // FIX: ownership check on all teacher operations
    private Course getOwnedCourse(Long courseId, Long teacherId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        if (!course.getTeacher().getId().equals(teacherId)) {
            throw new ForbiddenException("Bu kurs sizga tegishli emas");
        }
        return course;
    }

    public LessonResponse addLesson(Long courseId, CreateLessonRequest request, Long teacherId) {
        getOwnedCourse(courseId, teacherId);
        return courseService.addLesson(courseId, request);
    }

    public List<User> getCourseStudents(Long courseId, Long teacherId) {
        getOwnedCourse(courseId, teacherId);
        return enrollmentRepository.findByCourseId(courseId)
                .stream().map(Enrollment::getStudent).toList();
    }

    // FIX: was findByLessonId(courseId) — wrong! now uses correct findByCourseId
    public List<ExamResult> getCourseResults(Long courseId, Long teacherId) {
        getOwnedCourse(courseId, teacherId);
        return examResultRepository.findByCourseId(courseId);
    }

    // FIX: upsert — no duplicate attendance rows
    public void markAttendance(Long courseId, Long studentId, Long teacherId, LocalDate date, boolean present) {
        getOwnedCourse(courseId, teacherId);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        Course course = courseRepository.findById(courseId).orElseThrow();

        Attendance att = attendanceRepository
                .findByStudentIdAndCourseIdAndDate(studentId, courseId, date)
                .orElse(Attendance.builder().student(student).course(course).date(date).build());
        att.setPresent(present);
        attendanceRepository.save(att);
    }

    public Map<String, Object> getCourseAnalytics(Long courseId, Long teacherId) {
        getOwnedCourse(courseId, teacherId);
        long studentCount = enrollmentRepository.countByCourseId(courseId);
        Double avgScore = examResultRepository.avgScoreByCourseId(courseId);

        List<ExamResult> results = examResultRepository.findByCourseId(courseId);
        String resultsJson = results.stream()
                .map(r -> String.format("{\"student\":\"%s\",\"score\":%d}",
                        r.getStudent().getFullName(), r.getScore()))
                .collect(Collectors.joining(",", "[", "]"));

        String aiInsight = results.isEmpty() ? "Hali test natijalari yo'q."
                : aiService.analyzeWeakTopics(resultsJson);

        return Map.of(
                "studentCount", studentCount,
                "avgScore", avgScore != null ? avgScore : 0.0,
                "aiInsight", aiInsight
        );
    }

    public String generateLessonDraft(String topic, String subject, int gradeLevel) {
        return aiService.generateLessonDraft(topic, subject, gradeLevel);
    }
}
