package uz.forkbomb.academix.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.shared.model.SentimentLog;
import uz.forkbomb.academix.shared.repository.SentimentLogRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class SentimentService {

    private final ChatModel chatModel;
    private final SentimentLogRepository sentimentLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Async
    public void analyzeAndSave(String message, Long studentId, Long chatMessageId) {
        try {
            String prompt = String.format("""
                    Quyidagi o'quvchi xabarini tahlil qiling va kayfiyatini aniqlang.
                    Xabar: "%s"
                    FAQAT JSON formatda qaytaring:
                    {"score": 0.5, "label": "curious"}
                    score: -1.0 (juda xafa/charchagan) dan 1.0 (ishonchli/xursand) gacha
                    label: frustrated | anxious | neutral | curious | confident
                    """, message.replace("\"", "'"));

            String response = ChatClient.builder(chatModel).build()
                    .prompt()
                    .system("Siz psixologik tahlil qiluvchi AI tizimiisz. Faqat JSON qaytaring.")
                    .user(prompt)
                    .call()
                    .content();

            String json = extractJson(response);
            JsonNode node = objectMapper.readTree(json);
            double score = node.get("score").asDouble(0.0);
            String label = node.get("label").asText("neutral");

            sentimentLogRepository.save(SentimentLog.builder()
                    .studentId(studentId)
                    .chatMessageId(chatMessageId)
                    .sentimentScore(score)
                    .sentimentLabel(label)
                    .build());
        } catch (Exception e) {
            log.warn("Sentiment analysis failed for student {}: {}", studentId, e.getMessage());
        }
    }

    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) return text.substring(start, end + 1);
        return "{\"score\":0.0,\"label\":\"neutral\"}";
    }
}
