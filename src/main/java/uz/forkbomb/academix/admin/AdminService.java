package uz.forkbomb.academix.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.shared.ai.AIService;
import uz.forkbomb.academix.shared.exception.DuplicateResourceException;
import uz.forkbomb.academix.shared.exception.ResourceNotFoundException;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.model.enums.Role;
import uz.forkbomb.academix.shared.model.enums.SubscriptionTier;
import uz.forkbomb.academix.shared.repository.*;

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
        // FIX: duplicate email check
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }
        return userRepository.save(User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode("AcademiX2026!"))
                .role(Role.TEACHER)
                .subscriptionTier(SubscriptionTier.SCHOOL)
                .schoolId(schoolId)
                .build());
    }

    public User addStudent(String fullName, String email, Long schoolId) {
        // FIX: duplicate email check
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }
        return userRepository.save(User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode("AcademiX2026!"))
                .role(Role.STUDENT)
                .subscriptionTier(SubscriptionTier.FREE)
                .schoolId(schoolId)
                .build());
    }

    public Map<String, Object> linkParentToStudent(Long studentId, String parentEmail, Long schoolId) {
        User student = userRepository.findById(studentId)
                .filter(s -> s.getRole() == Role.STUDENT && schoolId.equals(s.getSchoolId()))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found in school"));
        User parent = userRepository.findByEmail(parentEmail)
                .filter(p -> p.getRole() == Role.PARENT)
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found with email: " + parentEmail));
        student.setParentId(parent.getId());
        userRepository.save(student);
        return Map.of(
                "studentId", student.getId(),
                "studentName", student.getFullName(),
                "parentId", parent.getId(),
                "parentName", parent.getFullName()
        );
    }

    public Map<String, Object> getSchoolAnalytics(Long schoolId) {
        List<User> teachers = userRepository.findByRoleAndSchoolId(Role.TEACHER, schoolId);
        List<User> students = userRepository.findByRoleAndSchoolId(Role.STUDENT, schoolId);
        Double avgScore = examResultRepository.avgScoreBySchoolId(schoolId);
        long totalAbsences = attendanceRepository.countAbsencesBySchoolId(schoolId);

        // FIX: N+1 → single query, map in memory
        Map<Long, Long> absencesPerStudent = attendanceRepository
                .countAbsencesPerStudentBySchoolId(schoolId).stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));

        String studentsJson = students.stream()
                .map(s -> String.format("{\"name\":\"%s\",\"absences\":%d}",
                        s.getFullName(),
                        absencesPerStudent.getOrDefault(s.getId(), 0L)))
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
