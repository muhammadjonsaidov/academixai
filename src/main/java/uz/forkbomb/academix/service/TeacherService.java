package uz.forkbomb.academix.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.model.Attendance;
import uz.forkbomb.academix.model.Course;
import uz.forkbomb.academix.model.ExamResult;
import uz.forkbomb.academix.model.User;
import uz.forkbomb.academix.repository.*;

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
    private final AIService aiService;

    public List<User> getCourseStudents(Long courseId) {
        return enrollmentRepository.findByCourseId(courseId)
                .stream().map(e -> e.getStudent()).toList();
    }

    public List<ExamResult> getCourseResults(Long courseId) {
        return examResultRepository.findByLessonId(courseId);
    }

    public void markAttendance(Long courseId, Long studentId, LocalDate date, boolean present) {
        User student = userRepository.findById(studentId).orElseThrow();
        Course course = courseRepository.findById(courseId).orElseThrow();

        Attendance att = Attendance.builder()
                .student(student)
                .course(course)
                .date(date)
                .present(present)
                .build();
        attendanceRepository.save(att);
    }

    public Map<String, Object> getCourseAnalytics(Long courseId) {
        long studentCount = enrollmentRepository.countByCourseId(courseId);
        Double avgScore = examResultRepository.avgScoreByCourseId(courseId);

        List<ExamResult> results = examResultRepository.findByLessonId(courseId);
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
