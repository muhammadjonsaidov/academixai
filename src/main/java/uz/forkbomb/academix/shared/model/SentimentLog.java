package uz.forkbomb.academix.shared.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

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

    @Column(name = "sentiment_score", columnDefinition = "numeric(4,3)")
    private Double sentimentScore; // -1.0 (frustrated) to 1.0 (confident)

    @Column(name = "sentiment_label")
    private String sentimentLabel; // frustrated, anxious, curious, confident, neutral

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
