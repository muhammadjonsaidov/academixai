package uz.forkbomb.academix.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.forkbomb.academix.shared.ai.AIService;
import uz.forkbomb.academix.shared.exception.DuplicateResourceException;
import uz.forkbomb.academix.shared.exception.ResourceNotFoundException;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.model.enums.Role;
import uz.forkbomb.academix.shared.model.enums.SubscriptionTier;
import uz.forkbomb.academix.shared.repository.*;
import uz.forkbomb.academix.rag.NotificationService;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Transactional(readOnly = true)
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
    private final NotificationService notificationService;

    @Transactional
    public Long resolveSchoolId(String email) {
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + email));
        if (admin.getSchoolId() == null) {
            admin.setSchoolId(admin.getId());
            userRepository.save(admin);
        }
        return admin.getSchoolId();
    }

    public List<User> getTeachers(Long schoolId) {
        return userRepository.findByRoleAndSchoolId(Role.TEACHER, schoolId);
    }

    public List<User> getStudents(Long schoolId) {
        return userRepository.findByRoleAndSchoolId(Role.STUDENT, schoolId);
    }

    public List<User> getParents(Long schoolId) {
        return userRepository.findByRoleAndSchoolId(Role.PARENT, schoolId);
    }

    @Transactional
    public User addTeacher(String fullName, String email, String password, Long schoolId) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }
        String pw = (password != null && !password.isBlank()) ? password : generateTempPassword();
        User saved = userRepository.save(User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(pw))
                .role(Role.TEACHER)
                .subscriptionTier(SubscriptionTier.SCHOOL)
                .schoolId(schoolId)
                .build());
        notificationService.create(saved.getId(), "alert",
                "AcademiXAI platformasiga xush kelibsiz!",
                "Hisobingiz yaratildi. Email: " + email + ". Parolingiz: " + pw);
        notificationService.sendEmail(email,
                "AcademiXAI — Hisobingiz tayyor",
                "Salom " + fullName + ",\n\nSiz AcademiXAI platformasiga o'qituvchi sifatida qo'shildingiz.\n\n" +
                "Email: " + email + "\nParol: " + pw + "\n\n" +
                "Platformaga kirish: https://academixai.uz\n\nHurmat bilan,\nAcademiXAI jamoasi");
        return saved;
    }

    @Transactional
    public User addStudent(String fullName, String email, String password, Long schoolId) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }
        String pw = (password != null && !password.isBlank()) ? password : generateTempPassword();
        User saved = userRepository.save(User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(pw))
                .role(Role.STUDENT)
                .subscriptionTier(SubscriptionTier.FREE)
                .schoolId(schoolId)
                .build());
        notificationService.create(saved.getId(), "alert",
                "AcademiXAI platformasiga xush kelibsiz!",
                "Hisobingiz yaratildi. Email: " + email + ". Parolingiz: " + pw);
        notificationService.sendEmail(email,
                "AcademiXAI — Hisobingiz tayyor",
                "Salom " + fullName + ",\n\nSiz AcademiXAI platformasiga o'quvchi sifatida qo'shildingiz.\n\n" +
                "Email: " + email + "\nParol: " + pw + "\n\n" +
                "Platformaga kirish: https://academixai.uz\n\nHurmat bilan,\nAcademiXAI jamoasi");
        return saved;
    }

    @Transactional
    public User addParent(String fullName, String email, Long schoolId) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }
        String pw = generateTempPassword();
        User saved = userRepository.save(User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(pw))
                .role(Role.PARENT)
                .subscriptionTier(SubscriptionTier.FREE)
                .schoolId(schoolId)
                .build());
        notificationService.create(saved.getId(), "alert",
                "AcademiXAI platformasiga xush kelibsiz!",
                "Hisobingiz yaratildi. Email: " + email + ". Parolingiz: " + pw);
        notificationService.sendEmail(email,
                "AcademiXAI — Hisobingiz tayyor",
                "Salom " + fullName + ",\n\nSiz AcademiXAI platformasiga ota-ona sifatida qo'shildingiz.\n\n" +
                "Email: " + email + "\nParol: " + pw + "\n\n" +
                "Platformaga kirish: https://academixai.uz\n\nHurmat bilan,\nAcademiXAI jamoasi");
        return saved;
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder(12);
        java.util.Random r = new java.util.Random();
        for (int i = 0; i < 12; i++) sb.append(chars.charAt(r.nextInt(chars.length())));
        return sb.toString();
    }

    @Transactional
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
