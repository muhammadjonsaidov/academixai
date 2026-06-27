package uz.forkbomb.academix.admin;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "School Admin", description = "Manage teachers, students, AI analytics for school")
@SecurityRequirement(name = "Bearer")
public class AdminController {

    private final AdminService adminService;

    private Long getSchoolId(UserDetails userDetails) {
        return adminService.resolveSchoolId(userDetails.getUsername());
    }

    private static Map<String, Object> safeUser(uz.forkbomb.academix.shared.model.User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("fullName", u.getFullName());
        m.put("email", u.getEmail());
        m.put("role", u.getRole().name());
        m.put("schoolId", u.getSchoolId());
        m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
        return m;
    }

    @GetMapping("/teachers")
    public ResponseEntity<List<Map<String, Object>>> getTeachers(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.getTeachers(getSchoolId(userDetails)).stream().map(AdminController::safeUser).toList());
    }

    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> getStudents(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.getStudents(getSchoolId(userDetails)).stream().map(AdminController::safeUser).toList());
    }

    @PostMapping("/teachers")
    public ResponseEntity<Map<String, Object>> addTeacher(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(safeUser(adminService.addTeacher(
                body.get("fullName"), body.get("email"), body.get("password"), getSchoolId(userDetails))));
    }

    @PostMapping("/students")
    public ResponseEntity<Map<String, Object>> addStudent(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(safeUser(adminService.addStudent(
                body.get("fullName"), body.get("email"), body.get("password"), getSchoolId(userDetails))));
    }

    @GetMapping("/parents")
    public ResponseEntity<List<Map<String, Object>>> getParents(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.getParents(getSchoolId(userDetails)).stream().map(AdminController::safeUser).toList());
    }

    @PostMapping("/parents")
    public ResponseEntity<Map<String, Object>> addParent(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(safeUser(adminService.addParent(
                body.get("fullName"), body.get("email"), getSchoolId(userDetails))));
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

    @GetMapping("/attendance")
    public ResponseEntity<List<Map<String, Object>>> getAttendance(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long schoolId = getSchoolId(userDetails);
        return ResponseEntity.ok(adminService.getSchoolAttendance(schoolId));
    }

    @GetMapping("/attendance/stats")
    public ResponseEntity<Map<String, Object>> getAttendanceStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long schoolId = getSchoolId(userDetails);
        return ResponseEntity.ok(adminService.getAttendanceStats(schoolId));
    }
}
