package uz.forkbomb.academix.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.model.User;
import uz.forkbomb.academix.model.enums.Role;
import uz.forkbomb.academix.model.enums.SubscriptionTier;
import uz.forkbomb.academix.repository.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ExamResultRepository examResultRepository;
    private final AttendanceRepository attendanceRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AIService aiService;

    public List<User> getTeachers(Long schoolId) {
        return userRepository.findByRoleAndSchoolId(Role.TEACHER, schoolId);
    }

    public List<User> getStudents(Long schoolId) {
        return userRepository.findByRoleAndSchoolId(Role.STUDENT, schoolId);
    }

    public User addTeacher(String fullName, String email, Long schoolId) {
        User teacher = User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode("AcademiX2026!"))
                .role(Role.TEACHER)
                .subscriptionTier(SubscriptionTier.SCHOOL)
                .schoolId(schoolId)
                .build();
        return userRepository.save(teacher);
    }

    public User addStudent(String fullName, String email, Long schoolId) {
        User student = User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode("AcademiX2026!"))
                .role(Role.STUDENT)
                .subscriptionTier(SubscriptionTier.FREE)
                .schoolId(schoolId)
                .build();
        return userRepository.save(student);
    }

    public Map<String, Object> getSchoolAnalytics(Long schoolId) {
        List<User> teachers = userRepository.findByRoleAndSchoolId(Role.TEACHER, schoolId);
        List<User> students = userRepository.findByRoleAndSchoolId(Role.STUDENT, schoolId);
        Double avgScore = examResultRepository.avgScoreBySchoolId(schoolId);
        long totalAbsences = attendanceRepository.countAbsencesBySchoolId(schoolId);

        String studentsJson = students.stream()
                .map(s -> String.format("{\"name\":\"%s\",\"absences\":%d}",
                        s.getFullName(),
                        attendanceRepository.countAbsencesByStudentId(s.getId())))
                .collect(Collectors.joining(",", "[", "]"));

        String atRiskJson = students.isEmpty() ? "{\"atRiskStudents\":[]}"
                : aiService.analyzeAtRiskStudents(studentsJson);

        return Map.of(
                "teacherCount", teachers.size(),
                "studentCount", students.size(),
                "avgScore", avgScore != null ? avgScore : 0.0,
                "totalAbsences", totalAbsences,
                "atRiskAnalysis", atRiskJson
        );
    }
}
