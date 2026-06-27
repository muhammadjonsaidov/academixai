package uz.forkbomb.academix.shared.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final ChatModel chatModel;
    private final ClaudeCliService claudeCli;

    @Value("${academix.ai.provider:gemini}")
    private String provider;

    // ── Provider routing ──────────────────────────────────────────────────────

    public String chatWithSystem(String system, String user) {
        return route(system, user);
    }

    private String route(String system, String user) {
        return switch (provider) {
            case "claude-cli" -> {
                String r = claudeCli.ask(system, user);
                yield r != null ? r : gemini(system, user);
            }
            case "claude-api" -> {
                log.warn("claude-api not configured, falling back to gemini");
                yield gemini(system, user);
            }
            default -> gemini(system, user);
        };
    }

    private String routeJson(String system, String user) {
        return switch (provider) {
            case "claude-cli" -> {
                String r = claudeCli.askJson(system, user);
                yield r != null ? r : gemini(system, user);
            }
            default -> gemini(system, user);
        };
    }

    private String gemini(String system, String user) {
        return ChatClient.builder(chatModel)
                .build()
                .prompt()
                .system(system)
                .user(user)
                .call()
                .content();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    private static final String STUDENT_SYSTEM = """
            Siz AcademiX AI — O'zbekistonning ilk sun'iy intellekt o'qituvchisisiz.
            Ismingiz: Ustoz Amir.
            Barcha savollarga faqat O'ZBEK TILIDA, sodda va tushunarli tarzda javob bering.
            Maktab o'quvchisiga mos tilda gapiring (7-11 sinf darajasi).
            Javob 3-5 jumladan oshmasin — qisqa va aniq bo'lsin.
            Faqat ta'lim va fan bilan bog'liq savollarga javob bering.
            Har doim rag'batlantiruvchi va ijobiy munosabatda bo'ling.
            Agar savol noto'g'ri yo'nalishda bo'lsa, muloyimlik bilan to'g'ri mavzuga yo'naltiring.
            """;

    public String chat(String userMessage, String lessonContext) {
        String user = (lessonContext != null && !lessonContext.isBlank())
                ? "Mavzu: " + lessonContext + "\n\nO'quvchi savoli: " + userMessage
                : userMessage;
        return route(STUDENT_SYSTEM, user);
    }

    public String generateExamQuestions(String topic, String subject, int count) {
        String system = "Siz ta'lim mutaxassisiiz. Faqat so'ralgan JSON formatda javob bering.";
        String user = String.format("""
                %s fani bo'yicha "%s" mavzusida %d ta test savol yarating.
                Har bir savolda 4 ta javob varianti bo'lsin (A, B, C, D).
                FAQAT quyidagi JSON formatda qaytaring, boshqa hech narsa yozmasang:
                {"questions":[{"id":1,"text":"...?","options":["A) ...","B) ...","C) ...","D) ..."],"correctAnswer":"A","explanation":"..."}]}
                Savollar o'quvchi darajasida tushunarli va qiziqarli bo'lsin.
                """, subject, topic, count);
        return routeJson(system, user);
    }

    public String gradeExam(String questionsJson, String answersJson) {
        String system = "Siz ta'lim mutaxassisiiz. Faqat so'ralgan JSON formatda javob bering.";
        String user = String.format("""
                Quyidagi test natijalarini baholang va O'ZBEK TILIDA fikr bildiring.
                Savollar va to'g'ri javoblar: %s
                O'quvchi javoblari: %s
                FAQAT quyidagi JSON formatda qaytaring:
                {"score":80,"feedbackUz":"...","breakdown":[{"questionId":1,"correct":true,"explanation":"..."}]}
                Score 0-100 oralig'ida bo'lsin. Feedback rag'batlantiruvchi va aniq bo'lsin.
                """, questionsJson, answersJson);
        return routeJson(system, user);
    }

    public String generateLessonDraft(String topic, String subject, int gradeLevel) {
        String system = "Siz tajribali o'zbek o'qituvchisiiz. O'zbek tilida professional dars matni yozing.";
        String user = String.format("""
                %s fani, %d-sinf uchun "%s" mavzusida dars mazmuni yarating.
                O'zbek tilida yozing. Quyidagi tuzilmada bo'lsin:
                1. Kirish (qiziqarli fakt yoki savol)
                2. Asosiy tushuncha (oddiy tilda)
                3. Misol
                4. Xulosa
                5. Uyga vazifa (1 ta misol)
                Jami 300-500 so'z.
                """, subject, gradeLevel, topic);
        return route(system, user);
    }

    public String analyzeWeakTopics(String examResultsJson) {
        String system = "Siz ta'lim analitikiiz. JSON formatda aniq javob bering.";
        String user = String.format("""
                Quyidagi sinf test natijalarini tahlil qiling: %s
                O'zbek tilida quyidagi ma'lumotlarni bering:
                1. Eng zaif mavzu  2. Eng yaxshi mavzu  3. O'qituvchi uchun tavsiya
                FAQAT JSON formatda:
                {"weakestTopic":"...","strongestTopic":"...","recommendation":"...","avgScore":75}
                """, examResultsJson);
        return routeJson(system, user);
    }

    public String teacherAiAssist(String message, String courseContext) {
        try {
            String system = """
                    Siz AcademiXAI — o'qituvchilarga yordam beruvchi AI yordamchisisiz.
                    Dars rejalashtirish, o'quvchilarni baholash, savollar yaratish va tahlil qilishda yordam bering.
                    O'ZBEK TILIDA javob bering. Javob aniq, amaliy va qisqa bo'lsin.
                    """;
            return route(system, "Mening kurslarim: " + courseContext + "\n\nSavol: " + message);
        } catch (Exception e) {
            log.error("Teacher AI chat failed: {}", e.getMessage());
            return "Kechirasiz, hozirda javob bera olmadim. Keyinroq urinib ko'ring.";
        }
    }

    public String analyzeAtRiskStudents(String studentsJson) {
        String system = "Siz maktab psixologi va analitikisiz. JSON formatda javob bering.";
        String user = String.format("""
                Quyidagi o'quvchilar ma'lumotlarini tahlil qiling (baholar va davomad): %s
                Xavf ostidagi o'quvchilarni aniqlang va O'ZBEK tilida tavsiya bering.
                FAQAT JSON formatda:
                {"atRiskStudents":[{"name":"...","reason":"...","recommendation":"..."}],"overallHealthPercent":78}
                """, studentsJson);
        return routeJson(system, user);
    }
}
