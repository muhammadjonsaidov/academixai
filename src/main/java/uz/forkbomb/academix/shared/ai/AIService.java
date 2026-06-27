package uz.forkbomb.academix.shared.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.content.Media;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;

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

    public String analyzeHomework(byte[] imageBytes, String mimeType) {
        String system = """
                Siz tajribali matematika o'qituvchisiiz. O'quvchi uy ishini rasmda yuboryapti.
                Rasmni diqqat bilan o'qib, FAQAT quyidagi JSON formatda javob bering. Boshqa hech narsa yozma.
                {
                  "ocrText": "rasmdan o'qilgan to'liq yozuv",
                  "formulaUsed": "ishlatilgan formula yoki teorema (masalan: a²+b²=c²)",
                  "method": "qo'llanilgan yechish usuli (qisqa, O'zbek tilida)",
                  "correctSteps": ["to'g'ri bajarilgan 1-qadam", "to'g'ri bajarilgan 2-qadam"],
                  "incorrectSteps": ["xato qilingan qadam va izoh"],
                  "finalAnswer": "o'quvchi yozgan yakuniy javob",
                  "expectedAnswer": "to'g'ri javob (agar xato bo'lsa)",
                  "isCorrect": true,
                  "score": 85,
                  "errors": ["aniq xato 1", "aniq xato 2"],
                  "feedback": "o'quvchiga rag'batlantiruvchi, aniq maslahat O'zbek tilida (2-3 jumla)",
                  "resubmitRequired": false,
                  "resubmitReason": ""
                }
                Qoidalar:
                - score: 0-100 (to'liq to'g'ri=100, kichik xato=70-90, katta xato=30-60, umuman xato=0-30)
                - resubmitRequired: FAQAT yozuv o'qib bo'lmasa yoki rasm sifatsiz bo'lsa true
                - formulaUsed: agar formula ishlatilmasa "—" yoz
                - correctSteps bo'sh bo'lishi mumkin agar hech narsa to'g'ri emas bo'lsa
                - feedback faqat O'zbek tilida, rag'batlantiruvchi tonda
                """;
        try {
            Media media = new Media(MimeType.valueOf(mimeType), new ByteArrayResource(imageBytes));
            return ChatClient.builder(chatModel).build()
                    .prompt()
                    .system(system)
                    .user(u -> u.text("Ushbu rasmda o'quvchining matematika uy ishi bor. Tahlil qiling va JSON formatda javob bering.").media(media))
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Homework analysis failed: {}", e.getMessage());
            return "{\"ocrText\":\"\",\"isCorrect\":false,\"score\":0,\"method\":\"\",\"errors\":[],\"feedback\":\"Tahlil qilishda xato yuz berdi. Qayta urinib ko'ring.\",\"resubmitRequired\":true,\"resubmitReason\":\"Texnik xato\"}";
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
