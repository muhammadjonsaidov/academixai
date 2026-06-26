package uz.forkbomb.academix.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    private Integer score;

    @Column(name = "feedback_uz", columnDefinition = "TEXT")
    private String feedbackUz;

    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson;

    @Column(name = "taken_at")
    private LocalDateTime takenAt = LocalDateTime.now();
}
