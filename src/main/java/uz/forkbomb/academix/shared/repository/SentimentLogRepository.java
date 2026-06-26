package uz.forkbomb.academix.shared.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.forkbomb.academix.shared.model.SentimentLog;

import java.time.LocalDateTime;
import java.util.List;

public interface SentimentLogRepository extends JpaRepository<SentimentLog, Long> {
    List<SentimentLog> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    @Query("SELECT AVG(s.sentimentScore) FROM SentimentLog s WHERE s.studentId = :studentId AND s.createdAt >= :since")
    Double avgSentimentSince(@Param("studentId") Long studentId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(s) FROM SentimentLog s WHERE s.studentId = :studentId AND s.sentimentLabel = :label AND s.createdAt >= :since")
    long countByLabelSince(@Param("studentId") Long studentId, @Param("label") String label, @Param("since") LocalDateTime since);
}
