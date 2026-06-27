package uz.forkbomb.academix.announcement;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.admin.AdminService;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
@Tag(name = "Announcements")
@SecurityRequirement(name = "Bearer")
public class AnnouncementController {

    private final AnnouncementRepository repo;
    private final AdminService adminService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Announcement>> list(@AuthenticationPrincipal UserDetails ud) {
        Long schoolId = adminService.resolveSchoolId(ud.getUsername());
        return ResponseEntity.ok(repo.findBySchoolIdOrderByCreatedAtDesc(schoolId));
    }

    @PostMapping
    public ResponseEntity<Announcement> create(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody Map<String, String> body) {
        Long schoolId = adminService.resolveSchoolId(ud.getUsername());
        User user = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        Announcement a = Announcement.builder()
                .schoolId(schoolId)
                .authorId(user.getId())
                .title(body.get("title"))
                .body(body.get("body"))
                .target(body.getOrDefault("target", "ALL"))
                .build();
        return ResponseEntity.ok(repo.save(a));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        Long schoolId = adminService.resolveSchoolId(ud.getUsername());
        repo.findById(id).filter(a -> a.getSchoolId().equals(schoolId))
                .ifPresent(repo::delete);
        return ResponseEntity.noContent().build();
    }
}
