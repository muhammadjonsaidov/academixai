package uz.forkbomb.academix.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.forkbomb.academix.shared.ai.AIService;
import uz.forkbomb.academix.shared.model.ExamResult;
import uz.forkbomb.academix.shared.model.SentimentLog;
import uz.forkbomb.academix.shared.repository.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
@Slf4j
public class ParentInsightService {

    private final ExamResultRepository examResultRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SentimentLogRepository sentimentLogRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AIService aiService;

    public String askAboutChild(String parentQuestion, Long childId) {
        // Gather real data about the child
        List<ExamResult> results = examResultRepository.findByStudentId(childId);
        double avgScore = results.stream()
                .mapToInt(r -> r.getScore() != null ? r.getScore() : 0)
                .average().orElse(0.0);
        long chatCount = chatMessageRepository.countByUserId(childId);
        long courseCount = enrollmentRepository.countByStudentId(childId);

        List<SentimentLog> recentSentiment = sentimentLogRepository
                .findByStudentIdOrderByCreatedAtDesc(childId).stream().limit(10).toList();
        double avgSentiment = recentSentiment.stream()
                .mapToDouble(s -> s.getSentimentScore() != null ? s.getSentimentScore() : 0)
                .average().orElse(0.0);

        String sentimentDesc = avgSentiment > 0.3 ? "yaxshi kayfiyatda" :
                avgSentiment < -0.2 ? "bir oz charchagan yoki qiynalayotgan" : "normal holatda";

        String subjectBreakdown = results.stream()
                .filter(r -> r.getLesson() != null && r.getLesson().getCourse() != null)
                .collect(Collectors.groupingBy(r -> r.getLesson().getCourse().getSubject(),
                        Collectors.averagingInt(r -> r.getScore() != null ? r.getScore() : 0)))
                .entrySet().stream()
                .map(e -> e.getKey() + ": " + Math.round(e.getValue()) + "%")
                .collect(Collectors.joining(", "));

        String context = String.format("""
                O'quvchi haqida ma'lumot:
                - Jami imtihonlar: %d, O'rtacha ball: %.0f%%
                - AI bilan suhbatlar soni: %d
                - Yozilgan kurslar soni: %d
                - Fanlar bo'yicha natijalar: %s
                - Hozirgi kayfiyat holati: %s
                """, results.size(), avgScore, chatCount, courseCount,
                subjectBreakdown.isBlank() ? "imtihon topshirilmagan" : subjectBreakdown,
                sentimentDesc);

        try {
            return aiService.chatWithSystem(
                    "Siz AcademiXAI — ota-onalarga o'z farzandlarining ta'limi haqida ma'lumot beruvchi AI yordamchisiisz. " +
                    "Farzand haqidagi haqiqiy ma'lumotlar sizga beriladi. Shu asosda savolga O'ZBEK TILIDA javob bering. " +
                    "Javob 3-5 jumladan iborat bo'lsin, aniq va ota-ona uchun tushunarli bo'lsin.",
                    context + "\n\nOta-ona savoli: " + parentQuestion);
        } catch (Exception e) {
            log.error("Parent AI chat failed: {}", e.getMessage());
            return "Kechirasiz, hozirda javob bera olmadim. Keyinroq urinib ko'ring.";
        }
    }

    public List<Map<String, Object>> getSentimentTrend(Long childId) {
        return sentimentLogRepository.findByStudentIdOrderByCreatedAtDesc(childId)
                .stream().limit(20)
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("score", s.getSentimentScore());
                    m.put("label", s.getSentimentLabel());
                    m.put("createdAt", s.getCreatedAt().toString());
                    return m;
                }).toList();
    }
}
