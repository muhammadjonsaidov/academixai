package uz.forkbomb.academix.shared.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import uz.forkbomb.academix.shared.model.enums.Role;
import uz.forkbomb.academix.shared.model.enums.SubscriptionTier;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_tier", nullable = false)
    private SubscriptionTier subscriptionTier = SubscriptionTier.FREE;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "school_id")
    private Long schoolId;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @Builder.Default
    @Column(name = "email_notif")
    private Boolean emailNotif = true;

    @Builder.Default
    @Column(name = "push_notif")
    private Boolean pushNotif = true;

    @Builder.Default
    @Column(name = "weekly_report")
    private Boolean weeklyReport = true;

    @Builder.Default
    @Column(name = "ai_tips")
    private Boolean aiTips = true;
}
