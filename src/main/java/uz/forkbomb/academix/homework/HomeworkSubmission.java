package uz.forkbomb.academix.homework;

import jakarta.persistence.*;
import lombok.*;
import uz.forkbomb.academix.shared.model.User;

import java.time.OffsetDateTime;

@Entity
@Table(name = "homework_submissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HomeworkSubmission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private String subject;

    @Column(name = "image_data", columnDefinition = "TEXT", nullable = false)
    private String imageData;

    @Column(name = "ocr_text", columnDefinition = "TEXT")
    private String ocrText;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    private Integer score;

    @Builder.Default
    @Column(name = "resubmit_required", nullable = false)
    private Boolean resubmitRequired = false;

    @Builder.Default
    @Column(nullable = false)
    private String status = "pending";

    @Builder.Default
    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
