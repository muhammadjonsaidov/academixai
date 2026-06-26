package uz.forkbomb.academix.shared.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sentiment_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SentimentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "chat_message_id")
    private Long chatMessageId;

    @Column(name = "sentiment_score")
    private Double sentimentScore; // -1.0 (frustrated) to 1.0 (confident)

    @Column(name = "sentiment_label")
    private String sentimentLabel; // frustrated, anxious, curious, confident, neutral

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
