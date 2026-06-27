package uz.forkbomb.academix.admin;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.shared.exception.ResourceNotFoundException;
import uz.forkbomb.academix.shared.model.SchoolClass;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.model.enums.Role;
import uz.forkbomb.academix.shared.repository.SchoolClassRepository;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/classes")
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Tag(name = "Classes", description = "School class management")
@SecurityRequirement(name = "Bearer")
public class ClassController {

    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;
    private final AdminService adminService;

    private Long schoolId(UserDetails ud) {
        return adminService.resolveSchoolId(ud.getUsername());
    }

    private Map<String, Object> toMap(SchoolClass c, List<User> students, User teacher) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("gradeLevel", c.getGradeLevel());
        m.put("schoolId", c.getSchoolId());
        m.put("homeroomTeacherId", c.getHomeroomTeacherId());
        m.put("homeroomTeacherName", teacher != null ? teacher.getFullName() : null);
        m.put("studentCount", students.size());
        m.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
        return m;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(@AuthenticationPrincipal UserDetails ud) {
        Long sid = schoolId(ud);
        return ResponseEntity.ok(classRepository.findBySchoolId(sid).stream().map(c -> {
            List<User> students = userRepository.findByClassId(c.getId());
            User teacher = c.getHomeroomTeacherId() != null
                    ? userRepository.findById(c.getHomeroomTeacherId()).orElse(null) : null;
            return toMap(c, students, teacher);
        }).toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> create(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        Long sid = schoolId(ud);
        String name = (String) body.get("name");
        Integer grade = body.get("gradeLevel") != null
                ? Integer.parseInt(body.get("gradeLevel").toString()) : null;
        Long teacherId = body.get("homeroomTeacherId") != null
                ? Long.parseLong(body.get("homeroomTeacherId").toString()) : null;

        SchoolClass sc = classRepository.save(SchoolClass.builder()
                .name(name).gradeLevel(grade).schoolId(sid).homeroomTeacherId(teacherId)
                .build());

        User teacher = teacherId != null ? userRepository.findById(teacherId).orElse(null) : null;
        return ResponseEntity.ok(toMap(sc, List.of(), teacher));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        Long sid = schoolId(ud);
        SchoolClass sc = classRepository.findById(id)
                .filter(c -> sid.equals(c.getSchoolId()))
                .orElseThrow(() -> new ResourceNotFoundException("SchoolClass", id));

        if (body.containsKey("name")) sc.setName((String) body.get("name"));
        if (body.containsKey("gradeLevel") && body.get("gradeLevel") != null)
            sc.setGradeLevel(Integer.parseInt(body.get("gradeLevel").toString()));
        if (body.containsKey("homeroomTeacherId"))
            sc.setHomeroomTeacherId(body.get("homeroomTeacherId") != null
                    ? Long.parseLong(body.get("homeroomTeacherId").toString()) : null);
        classRepository.save(sc);

        List<User> students = userRepository.findByClassId(id);
        User teacher = sc.getHomeroomTeacherId() != null
                ? userRepository.findById(sc.getHomeroomTeacherId()).orElse(null) : null;
        return ResponseEntity.ok(toMap(sc, students, teacher));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, String>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        Long sid = schoolId(ud);
        SchoolClass sc = classRepository.findById(id)
                .filter(c -> sid.equals(c.getSchoolId()))
                .orElseThrow(() -> new ResourceNotFoundException("SchoolClass", id));
        userRepository.findByClassId(id).forEach(u -> { u.setClassId(null); userRepository.save(u); });
        classRepository.delete(sc);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<List<Map<String, Object>>> getStudents(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        Long sid = schoolId(ud);
        classRepository.findById(id).filter(c -> sid.equals(c.getSchoolId()))
                .orElseThrow(() -> new ResourceNotFoundException("SchoolClass", id));
        return ResponseEntity.ok(userRepository.findByClassId(id).stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            return m;
        }).toList());
    }

    @PostMapping("/{id}/students/{studentId}")
    @Transactional
    public ResponseEntity<Map<String, String>> assignStudent(
            @PathVariable Long id,
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails ud) {
        Long sid = schoolId(ud);
        classRepository.findById(id).filter(c -> sid.equals(c.getSchoolId()))
                .orElseThrow(() -> new ResourceNotFoundException("SchoolClass", id));
        User student = userRepository.findById(studentId)
                .filter(u -> u.getRole() == Role.STUDENT && sid.equals(u.getSchoolId()))
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        student.setClassId(id);
        userRepository.save(student);
        return ResponseEntity.ok(Map.of("message", "Student assigned to class"));
    }

    @DeleteMapping("/{id}/students/{studentId}")
    @Transactional
    public ResponseEntity<Map<String, String>> removeStudent(
            @PathVariable Long id,
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails ud) {
        Long sid = schoolId(ud);
        classRepository.findById(id).filter(c -> sid.equals(c.getSchoolId()))
                .orElseThrow(() -> new ResourceNotFoundException("SchoolClass", id));
        userRepository.findById(studentId).ifPresent(u -> {
            if (id.equals(u.getClassId())) { u.setClassId(null); userRepository.save(u); }
        });
        return ResponseEntity.ok(Map.of("message", "Student removed from class"));
    }

    @PostMapping("/{id}/teacher/{teacherId}")
    @Transactional
    public ResponseEntity<Map<String, String>> assignTeacher(
            @PathVariable Long id,
            @PathVariable Long teacherId,
            @AuthenticationPrincipal UserDetails ud) {
        Long sid = schoolId(ud);
        SchoolClass sc = classRepository.findById(id).filter(c -> sid.equals(c.getSchoolId()))
                .orElseThrow(() -> new ResourceNotFoundException("SchoolClass", id));
        userRepository.findById(teacherId)
                .filter(u -> u.getRole() == Role.TEACHER && sid.equals(u.getSchoolId()))
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));
        sc.setHomeroomTeacherId(teacherId);
        classRepository.save(sc);
        return ResponseEntity.ok(Map.of("message", "Teacher assigned as homeroom teacher"));
    }
}
