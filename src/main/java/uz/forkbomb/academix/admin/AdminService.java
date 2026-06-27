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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class AdminService {

    private final Map<Long, String> atRiskCache = new ConcurrentHashMap<>();

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

        // Return cached AI analysis; refresh in background
        String cachedRisk = atRiskCache.get(schoolId);
        if (!students.isEmpty()) {
            final String studentsJsonFinal = studentsJson;
            final Long schoolIdFinal = schoolId;
            Thread.ofVirtual().start(() -> {
                try {
                    String fresh = aiService.analyzeAtRiskStudents(studentsJsonFinal);
                    if (fresh != null) atRiskCache.put(schoolIdFinal, fresh);
                } catch (Exception ignored) {}
            });
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("teacherCount", (long) teachers.size());
        result.put("studentCount", students.size());
        result.put("avgScore", avgScore != null ? avgScore : 0.0);
        result.put("totalAbsences", totalAbsences);
        result.put("atRiskAnalysis", cachedRisk);
        return result;
    }

    public Map<String, Object> getAttendanceStats(Long schoolId) {
        long total = attendanceRepository.countTotalBySchoolId(schoolId);
        long present = attendanceRepository.countPresentBySchoolId(schoolId);
        long missed = total - present;

        List<Map<String, Object>> topAbsent = attendanceRepository
                .topAbsentStudentsBySchoolId(schoolId).stream().limit(15)
                .map(r -> { Map<String, Object> m = new LinkedHashMap<>();
                    m.put("name", r[0]); m.put("studentId", r[1]); m.put("missed", r[2]); return m; })
                .toList();

        List<Map<String, Object>> topCourses = attendanceRepository
                .topAbsentCoursesBySchoolId(schoolId).stream().limit(10)
                .map(r -> { Map<String, Object> m = new LinkedHashMap<>();
                    m.put("course", r[0]); m.put("courseId", r[1]); m.put("missed", r[2]); return m; })
                .toList();

        List<Map<String, Object>> recent = attendanceRepository
                .findMissedBySchoolId(schoolId).stream().limit(50)
                .map(a -> { Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", a.getId());
                    m.put("studentName", a.getStudent().getFullName());
                    m.put("studentEmail", a.getStudent().getEmail());
                    m.put("courseName", a.getCourse() != null ? a.getCourse().getTitleUz() : "");
                    m.put("date", a.getDate().toString());
                    m.put("present", false);
                    return m; })
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", total);
        result.put("present", present);
        result.put("missed", missed);
        result.put("attendanceRate", total > 0 ? Math.round(100.0 * present / total * 10) / 10.0 : 0.0);
        result.put("topAbsentStudents", topAbsent);
        result.put("topAbsentCourses", topCourses);
        result.put("recentMissed", recent);
        return result;
    }

    public List<Map<String, Object>> getSchoolAttendance(Long schoolId) {
        return attendanceRepository.findBySchoolId(schoolId).stream()
                .limit(200)
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", a.getId());
                    m.put("studentName", a.getStudent().getFullName());
                    m.put("studentEmail", a.getStudent().getEmail());
                    m.put("courseName", a.getCourse() != null ? a.getCourse().getTitleUz() : "");
                    m.put("date", a.getDate().toString());
                    m.put("present", a.getPresent());
                    return m;
                }).toList();
    }
}
