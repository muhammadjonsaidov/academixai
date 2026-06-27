package uz.forkbomb.academix.user;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.forkbomb.academix.shared.model.PushSubscription;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.push.WebPushService;
import uz.forkbomb.academix.shared.repository.NotificationRepository;
import uz.forkbomb.academix.shared.repository.PushSubscriptionRepository;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User", description = "Shared profile endpoints for all roles")
@SecurityRequirement(name = "Bearer")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationRepository notificationRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final WebPushService webPushService;

    private User current(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + ud.getUsername()));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal UserDetails ud) {
        User u = current(ud);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("fullName", u.getFullName());
        m.put("email", u.getEmail());
        m.put("role", u.getRole().name());
        m.put("subscriptionTier", u.getSubscriptionTier().name());
        m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
        m.put("avatarUrl", u.getAvatarUrl());
        return ResponseEntity.ok(m);
    }

    @PostMapping(value = "/me/avatar", consumes = "multipart/form-data")
    @Transactional
    public ResponseEntity<Map<String, Object>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails ud) throws Exception {
        if (file.isEmpty()) return ResponseEntity.badRequest().build();
        if (file.getSize() > 3 * 1024 * 1024) return ResponseEntity.badRequest().body(Map.of("message", "Fayl hajmi 3MB dan oshmasligi kerak"));
        String mime = file.getContentType();
        if (mime == null || !mime.startsWith("image/")) return ResponseEntity.badRequest().body(Map.of("message", "Faqat rasm fayllari qabul qilinadi"));
        String base64 = java.util.Base64.getEncoder().encodeToString(file.getBytes());
        String dataUrl = "data:" + mime + ";base64," + base64;
        User u = current(ud);
        u.setAvatarUrl(dataUrl);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("avatarUrl", dataUrl));
    }

    @PutMapping("/me")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        User u = current(ud);
        String name = body.get("fullName");
        if (name != null && !name.isBlank()) {
            u.setFullName(name.strip());
            userRepository.save(u);
        }
        return ResponseEntity.ok(Map.of(
                "id", u.getId(),
                "fullName", u.getFullName(),
                "email", u.getEmail(),
                "role", u.getRole().name(),
                "subscriptionTier", u.getSubscriptionTier().name(),
                "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
        ));
    }

    @PutMapping("/me/password")
    @Transactional
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        User u = current(ud);
        String currentPw = body.get("currentPassword");
        String next = body.get("newPassword");
        if (currentPw == null || next == null || next.length() < 8) {
            throw new IllegalArgumentException("Invalid password data");
        }
        if (!passwordEncoder.matches(currentPw, u.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        u.setPassword(passwordEncoder.encode(next));
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @GetMapping("/me/preferences")
    public ResponseEntity<Map<String, Object>> getPreferences(@AuthenticationPrincipal UserDetails ud) {
        User u = current(ud);
        return ResponseEntity.ok(Map.of(
                "emailNotif", Boolean.TRUE.equals(u.getEmailNotif()),
                "pushNotif", Boolean.TRUE.equals(u.getPushNotif()),
                "weeklyReport", Boolean.TRUE.equals(u.getWeeklyReport()),
                "aiTips", Boolean.TRUE.equals(u.getAiTips())
        ));
    }

    @PutMapping("/me/preferences")
    @Transactional
    public ResponseEntity<Map<String, Object>> updatePreferences(
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal UserDetails ud) {
        User u = current(ud);
        if (body.containsKey("emailNotif"))   u.setEmailNotif(body.get("emailNotif"));
        if (body.containsKey("pushNotif"))    u.setPushNotif(body.get("pushNotif"));
        if (body.containsKey("weeklyReport")) u.setWeeklyReport(body.get("weeklyReport"));
        if (body.containsKey("aiTips"))       u.setAiTips(body.get("aiTips"));
        userRepository.save(u);
        return getPreferences(ud);
    }

    @GetMapping("/notifications")
    public ResponseEntity<Map<String, Object>> getNotifications(@AuthenticationPrincipal UserDetails ud) {
        User u = current(ud);
        List<Map<String, Object>> result = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(u.getId()).stream()
                .map(n -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", n.getId());
                    m.put("type", n.getType());
                    m.put("title", n.getTitle());
                    m.put("body", n.getBody());
                    m.put("isRead", n.getIsRead());
                    m.put("createdAt", n.getCreatedAt().toString());
                    return m;
                }).toList();
        long unread = notificationRepository.countByUserIdAndIsReadFalse(u.getId());
        return ResponseEntity.ok(Map.of("notifications", result, "unreadCount", unread));
    }

    @PutMapping("/notifications/{id}/read")
    @Transactional
    public ResponseEntity<Map<String, String>> markNotificationRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        User u = current(ud);
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(u.getId())) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    @GetMapping("/notifications/vapid-public-key")
    public ResponseEntity<Map<String, Object>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of(
                "publicKey", webPushService.getPublicKey(),
                "enabled", webPushService.isEnabled()
        ));
    }

    @PostMapping("/notifications/push-subscribe")
    @Transactional
    public ResponseEntity<Map<String, String>> pushSubscribe(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        User u = current(ud);
        String endpoint = (String) body.get("endpoint");
        @SuppressWarnings("unchecked")
        Map<String, String> keys = (Map<String, String>) body.get("keys");
        if (endpoint == null || keys == null) {
            throw new IllegalArgumentException("endpoint and keys required");
        }
        pushSubscriptionRepository.findByUserIdAndEndpoint(u.getId(), endpoint).ifPresentOrElse(
                existing -> { /* already stored */ },
                () -> pushSubscriptionRepository.save(PushSubscription.builder()
                        .userId(u.getId())
                        .endpoint(endpoint)
                        .p256dh(keys.get("p256dh"))
                        .auth(keys.get("auth"))
                        .build())
        );
        return ResponseEntity.ok(Map.of("message", "Subscribed"));
    }

    @DeleteMapping("/notifications/push-subscribe")
    @Transactional
    public ResponseEntity<Map<String, String>> pushUnsubscribe(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        User u = current(ud);
        String endpoint = body.get("endpoint");
        if (endpoint != null) {
            pushSubscriptionRepository.deleteByUserIdAndEndpoint(u.getId(), endpoint);
        }
        return ResponseEntity.ok(Map.of("message", "Unsubscribed"));
    }
}
