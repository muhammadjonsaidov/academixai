package uz.forkbomb.academix.teacher;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.forkbomb.academix.course.CourseService;
import uz.forkbomb.academix.course.dto.CreateLessonRequest;
import uz.forkbomb.academix.course.dto.LessonResponse;
import uz.forkbomb.academix.shared.ai.AIService;
import uz.forkbomb.academix.shared.exception.ForbiddenException;
import uz.forkbomb.academix.shared.exception.ResourceNotFoundException;
import uz.forkbomb.academix.shared.model.*;
import uz.forkbomb.academix.shared.repository.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Transactional(readOnly = true)
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

    @Transactional
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
    @Transactional
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

    public List<Map<String, Object>> getAllStudents(Long teacherId) {
        List<Course> courses = courseRepository.findByTeacherId(teacherId);
        // Collect unique students + course count from already-loaded enrollments
        Map<Long, uz.forkbomb.academix.shared.model.User> studentMap = new LinkedHashMap<>();
        Map<Long, Long> courseCountMap = new HashMap<>();
        for (Course c : courses) {
            for (Enrollment e : enrollmentRepository.findByCourseId(c.getId())) {
                uz.forkbomb.academix.shared.model.User u = e.getStudent();
                studentMap.put(u.getId(), u);
                courseCountMap.merge(u.getId(), 1L, Long::sum);
            }
        }
        if (studentMap.isEmpty()) return List.of();
        // Batch avg scores — 1 query instead of N
        Map<Long, Double> avgScoreMap = examResultRepository
                .avgScoresByStudentIds(new java.util.ArrayList<>(studentMap.keySet()))
                .stream().collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> row[1] != null ? ((Number) row[1]).doubleValue() : 0.0));
        return studentMap.values().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            m.put("avgScore", avgScoreMap.getOrDefault(u.getId(), 0.0));
            m.put("courseCount", courseCountMap.getOrDefault(u.getId(), 0L));
            return m;
        }).toList();
    }

    public List<Map<String, Object>> getCourseAttendance(Long courseId, Long teacherId, LocalDate date) {
        getOwnedCourse(courseId, teacherId);
        List<Attendance> records = date != null
                ? attendanceRepository.findByCourseIdAndDate(courseId, date)
                : attendanceRepository.findByCourseId(courseId);
        return records.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("studentId", a.getStudent().getId());
            m.put("studentName", a.getStudent().getFullName());
            m.put("date", a.getDate().toString());
            m.put("present", a.getPresent());
            return m;
        }).toList();
    }

    public List<Map<String, Object>> getAllExamResults(Long teacherId) {
        List<Course> courses = courseRepository.findByTeacherId(teacherId);
        return courses.stream()
                .flatMap(c -> examResultRepository.findByCourseId(c.getId()).stream()
                        .map(r -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("id", r.getId());
                            m.put("studentName", r.getStudent().getFullName());
                            m.put("lessonTitle", r.getLesson() != null ? r.getLesson().getTitleUz() : "");
                            m.put("courseName", c.getTitleUz());
                            m.put("score", r.getScore());
                            m.put("feedbackUz", r.getFeedbackUz());
                            m.put("takenAt", r.getTakenAt() != null ? r.getTakenAt().toString() : "");
                            return m;
                        }))
                .toList();
    }

    public String teacherAiChat(String message, Long teacherId) {
        List<Course> courses = courseRepository.findByTeacherId(teacherId);
        String courseContext = courses.stream()
                .map(c -> c.getTitleUz() + " (" + c.getSubject() + ", " + c.getGradeLevel() + "-sinf)")
                .collect(Collectors.joining(", "));
        return aiService.teacherAiAssist(message, courseContext);
    }
}
