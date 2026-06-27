package uz.forkbomb.academix.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.chat.dto.ChatHistoryResponse;
import uz.forkbomb.academix.chat.dto.ChatRequest;
import uz.forkbomb.academix.chat.dto.ChatResponse;
import uz.forkbomb.academix.rag.RAGService;
import uz.forkbomb.academix.rag.SentimentService;
import uz.forkbomb.academix.shared.ai.AIService;
import uz.forkbomb.academix.shared.exception.ResourceNotFoundException;
import uz.forkbomb.academix.shared.model.ChatMessage;
import uz.forkbomb.academix.shared.model.Lesson;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.repository.*;
import uz.forkbomb.academix.shared.security.InputSanitizer;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final InputSanitizer sanitizer;
    private final AIService aiService;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final RAGService ragService;
    private final SentimentService sentimentService;
    private final JdbcTemplate jdbcTemplate;

    private static final String SYSTEM_BASE = """
            Siz AcademiX AI — O'zbekistonning ilk sun'iy intellekt o'qituvchisisiz.
            Ismingiz: Ustoz Amir.
            Barcha savollarga faqat O'ZBEK TILIDA, sodda va tushunarli tarzda javob bering.
            Maktab o'quvchisiga mos tilda gapiring (7-11 sinf darajasi).
            Javob 3-6 jumladan oshmasin — qisqa va aniq bo'lsin.
            Faqat ta'lim va fan bilan bog'liq savollarga javob bering.
            Har doim rag'batlantiruvchi va ijobiy munosabatda bo'ling.
            """;

    public ChatResponse chat(ChatRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Lesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = lessonRepository.findById(request.getLessonId()).orElse(null);
        }

        String safeMessage = sanitizer.sanitizeChat(request.getMessage());
        String lessonContext = sanitizer.sanitizeText(request.getLessonContext());
        if (lessonContext == null && lesson != null) {
            lessonContext = lesson.getTitleUz();
        }

        // Find teacher IDs via enrollments
        List<Long> teacherIds = getTeacherIdsForStudent(userId);

        // RAG retrieval
        RAGService.RAGResult rag = teacherIds.isEmpty()
                ? new RAGService.RAGResult("", List.of(), false)
                : ragService.retrieveForAllTeachers(safeMessage, teacherIds);

        String aiReply = buildAndCallPrompt(safeMessage, lessonContext, rag);

        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .user(user)
                .message(safeMessage)
                .response(aiReply)
                .lesson(lesson)
                .createdAt(LocalDateTime.now())
                .build());

        // Async sentiment analysis
        sentimentService.analyzeAndSave(safeMessage, userId, saved.getId());

        List<ChatResponse.Source> sources = rag.sources().stream()
                .map(s -> new ChatResponse.Source(s.fileName(), s.snippet()))
                .toList();

        return ChatResponse.builder()
                .reply(aiReply)
                .timestamp(saved.getCreatedAt())
                .messageId(saved.getId())
                .sources(sources)
                .usedKnowledgeBase(rag.hasRelevantContent())
                .build();
    }

    public List<ChatHistoryResponse> getHistory(Long userId) {
        return chatMessageRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toHistoryResponse).toList();
    }

    public List<ChatHistoryResponse> getLessonHistory(Long userId, Long lessonId) {
        return chatMessageRepository.findByUserIdAndLessonIdOrderByCreatedAtAsc(userId, lessonId).stream()
                .map(this::toHistoryResponse).toList();
    }

    private String buildAndCallPrompt(String message, String lessonContext, RAGService.RAGResult rag) {
        StringBuilder systemPrompt = new StringBuilder(SYSTEM_BASE);
        if (rag.hasRelevantContent()) {
            systemPrompt.append("\nQuyida o'qituvchining materiallaridan olingan tegishli ma'lumotlar mavjud. Shu ma'lumotlarga asoslanib javob bering:\n\n")
                    .append(rag.context());
        }

        String userMsg = (lessonContext != null && !lessonContext.isBlank())
                ? "Mavzu: " + lessonContext + "\n\nSavol: " + message
                : message;

        return aiService.chatWithSystem(systemPrompt.toString(), userMsg);
    }

    private List<Long> getTeacherIdsForStudent(Long studentId) {
        try {
            return jdbcTemplate.queryForList(
                    "SELECT DISTINCT c.teacher_id FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.student_id = ? AND c.teacher_id IS NOT NULL",
                    Long.class, studentId);
        } catch (Exception e) {
            return List.of();
        }
    }

    private ChatHistoryResponse toHistoryResponse(ChatMessage m) {
        return ChatHistoryResponse.builder()
                .id(m.getId())
                .message(m.getMessage())
                .response(m.getResponse())
                .lessonId(m.getLesson() != null ? m.getLesson().getId() : null)
                .lessonTitle(m.getLesson() != null ? m.getLesson().getTitleUz() : null)
                .createdAt(m.getCreatedAt())
                .build();
    }
}
