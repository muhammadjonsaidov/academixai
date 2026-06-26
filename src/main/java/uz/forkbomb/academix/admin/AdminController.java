package uz.forkbomb.academix.admin;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "School Admin", description = "Manage teachers, students, AI analytics for school")
@SecurityRequirement(name = "Bearer")
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    private Long getSchoolId(UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        if (admin.getSchoolId() == null) {
            throw new java.lang.IllegalStateException("Admin has no schoolId assigned");
        }
        return admin.getSchoolId();
    }

    @GetMapping("/teachers")
    public ResponseEntity<List<User>> getTeachers(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.getTeachers(getSchoolId(userDetails)));
    }

    @GetMapping("/students")
    public ResponseEntity<List<User>> getStudents(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.getStudents(getSchoolId(userDetails)));
    }

    @PostMapping("/teachers")
    public ResponseEntity<User> addTeacher(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.addTeacher(
                body.get("fullName"), body.get("email"), getSchoolId(userDetails)));
    }

    @PostMapping("/students")
    public ResponseEntity<User> addStudent(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.addStudent(
                body.get("fullName"), body.get("email"), getSchoolId(userDetails)));
    }

    @PostMapping("/students/{studentId}/link-parent")
    public ResponseEntity<?> linkParent(
            @PathVariable Long studentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.linkParentToStudent(
                studentId, body.get("parentEmail"), getSchoolId(userDetails)));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.getSchoolAnalytics(getSchoolId(userDetails)));
    }
}
