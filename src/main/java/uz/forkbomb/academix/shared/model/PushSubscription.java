package uz.forkbomb.academix.shared.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "push_subscriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String endpoint;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String p256dh;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String auth;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
