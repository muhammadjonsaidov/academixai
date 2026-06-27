package uz.forkbomb.academix.homework;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.forkbomb.academix.shared.ai.AIService;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.util.*;

@RestController
@RequestMapping("/api/student/homework")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Homework")
@SecurityRequirement(name = "Bearer")
public class HomeworkController {

    private final HomeworkSubmissionRepository repo;
    private final UserRepository userRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper;

    @PostMapping(value = "/submit", consumes = "multipart/form-data")
    @Transactional
    public ResponseEntity<Map<String, Object>> submit(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "subject", defaultValue = "Matematika") String subject,
            @AuthenticationPrincipal UserDetails ud) throws Exception {

        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Fayl bo'sh"));
        if (file.getSize() > 10 * 1024 * 1024) return ResponseEntity.badRequest().body(Map.of("message", "Fayl 10MB dan kichik bo'lishi kerak"));
        String mime = file.getContentType();
        if (mime == null || !mime.startsWith("image/")) return ResponseEntity.badRequest().body(Map.of("message", "Faqat rasm fayllari qabul qilinadi"));

        User student = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        byte[] bytes = file.getBytes();
        String base64 = "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);

        String aiJson = aiService.analyzeHomework(bytes, mime);
        String cleaned = aiJson.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

        Map<String, Object> parsed;
        try {
            parsed = objectMapper.readValue(cleaned, Map.class);
        } catch (Exception e) {
            log.error("Failed to parse AI homework response: {}", cleaned);
            parsed = new LinkedHashMap<>();
            parsed.put("ocrText", "");
            parsed.put("isCorrect", false);
            parsed.put("score", 0);
            parsed.put("method", "");
            parsed.put("errors", List.of());
            parsed.put("feedback", "Tahlil qilishda xato. Qayta urinib ko'ring.");
            parsed.put("resubmitRequired", true);
            parsed.put("resubmitReason", "AI javobi noto'g'ri formatda");
        }

        Boolean resubmit = (Boolean) parsed.getOrDefault("resubmitRequired", false);
        Integer score = parsed.get("score") instanceof Number n ? n.intValue() : 0;
        String status = resubmit ? "resubmit" : (score != null && score >= 60 ? "passed" : "failed");

        HomeworkSubmission sub = HomeworkSubmission.builder()
                .student(student)
                .subject(subject)
                .imageData(base64)
                .ocrText((String) parsed.getOrDefault("ocrText", ""))
                .aiFeedback(aiJson)
                .score(score)
                .resubmitRequired(resubmit)
                .status(status)
                .build();
        repo.save(sub);

        Map<String, Object> result = new LinkedHashMap<>(parsed);
        result.put("id", sub.getId());
        result.put("status", status);
        result.put("subject", subject);
        result.put("createdAt", sub.getCreatedAt().toString());
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(@AuthenticationPrincipal UserDetails ud) {
        User student = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        List<Map<String, Object>> result = repo.findByStudentId(student.getId()).stream()
                .map(h -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", h.getId());
                    m.put("subject", h.getSubject());
                    m.put("score", h.getScore());
                    m.put("status", h.getStatus());
                    m.put("resubmitRequired", h.getResubmitRequired());
                    m.put("ocrText", h.getOcrText());
                    m.put("aiFeedback", h.getAiFeedback());
                    m.put("imageData", h.getImageData());
                    m.put("createdAt", h.getCreatedAt().toString());
                    return m;
                }).toList();
        return ResponseEntity.ok(result);
    }
}
