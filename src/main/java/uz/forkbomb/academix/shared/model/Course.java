package uz.forkbomb.academix.shared.model;

import jakarta.persistence.*;
import lombok.*;
import uz.forkbomb.academix.shared.config.JsonbConverter;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "courses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title_uz", nullable = false)
    private String titleUz;

    @Column(name = "title_en")
    private String titleEn;

    @Column(nullable = false)
    private String subject;

    @Column(name = "grade_level")
    private Integer gradeLevel;

    @Column(name = "description_uz", columnDefinition = "TEXT")
    private String descriptionUz;

    @Column(name = "cover_emoji")
    private String coverEmoji = "📚";

    /** JSONB: {"uz":"...","en":"...","ru":"..."} */
    @Convert(converter = JsonbConverter.class)
    @Column(name = "title_i18n", columnDefinition = "jsonb")
    private Map<String, String> titleI18n;

    @Convert(converter = JsonbConverter.class)
    @Column(name = "description_i18n", columnDefinition = "jsonb")
    private Map<String, String> descriptionI18n;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher;

    @Column(name = "school_id")
    private Long schoolId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
