package uz.forkbomb.academix.model;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(name = "order_num")
    private Integer orderNum = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
