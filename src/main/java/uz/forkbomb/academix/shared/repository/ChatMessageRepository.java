package uz.forkbomb.academix.shared.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.forkbomb.academix.shared.model.ChatMessage;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ChatMessage> findByUserIdAndLessonIdOrderByCreatedAtAsc(Long userId, Long lessonId);
    long countByUserId(Long userId);
}
