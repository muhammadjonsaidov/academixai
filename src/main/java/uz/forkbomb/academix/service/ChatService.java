package uz.forkbomb.academix.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.dto.request.ChatRequest;
import uz.forkbomb.academix.dto.response.ChatResponse;
import uz.forkbomb.academix.model.ChatMessage;
import uz.forkbomb.academix.model.Lesson;
import uz.forkbomb.academix.model.User;
import uz.forkbomb.academix.repository.ChatMessageRepository;
import uz.forkbomb.academix.repository.LessonRepository;
import uz.forkbomb.academix.repository.UserRepository;
import uz.forkbomb.academix.security.InputSanitizer;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final InputSanitizer sanitizer;

    private final AIService aiService;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;

    public ChatResponse chat(ChatRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Lesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = lessonRepository.findById(request.getLessonId()).orElse(null);
        }

        String safeMessage = sanitizer.sanitizeChat(request.getMessage());
        String lessonContext = sanitizer.sanitizeText(request.getLessonContext());
        if (lessonContext == null && lesson != null) {
            lessonContext = lesson.getTitleUz();
        }

        String aiReply = aiService.chat(safeMessage, lessonContext);

        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .user(user)
                .message(request.getMessage())
                .response(aiReply)
                .lesson(lesson)
                .createdAt(LocalDateTime.now())
                .build());

        return ChatResponse.builder()
                .reply(aiReply)
                .timestamp(saved.getCreatedAt())
                .messageId(saved.getId())
                .build();
    }

    public List<ChatMessage> getHistory(Long userId) {
        return chatMessageRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<ChatMessage> getLessonHistory(Long userId, Long lessonId) {
        return chatMessageRepository.findByUserIdAndLessonIdOrderByCreatedAtAsc(userId, lessonId);
    }
}
