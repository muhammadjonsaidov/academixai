package uz.forkbomb.academix.shared.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "progress_snapshots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProgressSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "snapshot_type")
    private String snapshotType; // weekly, monthly

    @Column(name = "avg_score", columnDefinition = "numeric(5,2)")
    private Double avgScore;

    @Builder.Default
    @Column(name = "chat_count")
    private Integer chatCount = 0;

    @Column(name = "top_subject")
    private String topSubject;

    @Column(name = "weak_subject")
    private String weakSubject;

    @Column(name = "engagement_score", columnDefinition = "numeric(5,2)")
    private Double engagementScore;

    @Column(name = "sentiment_avg", columnDefinition = "numeric(4,3)")
    private Double sentimentAvg;

    @Column(name = "ai_narrative", columnDefinition = "TEXT")
    private String aiNarrative;

    @CreationTimestamp
    @Column(name = "snapshot_date", updatable = false)
    private LocalDateTime snapshotDate;
}
