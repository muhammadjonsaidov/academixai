package uz.forkbomb.academix.announcement;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Announcement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long schoolId;
    private Long authorId;
    private String title;
    @Column(columnDefinition = "TEXT")
    private String body;
    private String target = "ALL";
    @CreationTimestamp
    private LocalDateTime createdAt;
}
