package uz.forkbomb.academix.shared.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "lessons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "title_uz", nullable = false)
    private String titleUz;

    @Column(name = "content_uz", columnDefinition = "TEXT")
    private String contentUz;

    @Column(name = "phet_url")
    private String phetUrl;

    @Column(name = "video_url")
    private String videoUrl;

    @Builder.Default
    @Column(name = "order_num")
    private Integer orderNum = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
