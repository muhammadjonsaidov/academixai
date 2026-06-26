package uz.forkbomb.academix.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.dto.request.ExamGradeRequest;
import uz.forkbomb.academix.dto.request.ExamGenerateRequest;
import uz.forkbomb.academix.model.ExamResult;
import uz.forkbomb.academix.model.Lesson;
import uz.forkbomb.academix.model.User;
import uz.forkbomb.academix.repository.ExamResultRepository;
import uz.forkbomb.academix.repository.LessonRepository;
import uz.forkbomb.academix.repository.UserRepository;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamService {

    private final AIService aiService;
    private final ExamResultRepository examResultRepository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final ObjectMapper objectMapper;

    public String generateQuestions(ExamGenerateRequest request) {
        return aiService.generateExamQuestions(request.getTopic(), request.getSubject(), request.getCount());
    }

    public Map<String, Object> gradeAndSave(ExamGradeRequest request, Long studentId) {
        String gradeJson = aiService.gradeExam(request.getQuestionsJson(),
                objectMapper.valueToTree(request.getAnswers()).toString());

        try {
            Map<String, Object> result = objectMapper.readValue(gradeJson, Map.class);
            int score = (int) result.getOrDefault("score", 0);
            String feedback = (String) result.getOrDefault("feedbackUz", "");

            User student = userRepository.findById(studentId).orElseThrow();
            Lesson lesson = request.getLessonId() != null
                    ? lessonRepository.findById(request.getLessonId()).orElse(null)
                    : null;

            examResultRepository.save(ExamResult.builder()
                    .student(student)
                    .lesson(lesson)
                    .score(score)
                    .feedbackUz(feedback)
                    .answersJson(request.getQuestionsJson())
                    .build());

            return result;
        } catch (Exception e) {
            log.error("Failed to parse grade response: {}", gradeJson);
            return Map.of("score", 0, "feedbackUz", "Baholashda xatolik yuz berdi. Qayta urinib ko'ring.");
        }
    }

    public List<ExamResult> getStudentResults(Long studentId) {
        return examResultRepository.findByStudentId(studentId);
    }

    public List<ExamResult> getLessonResults(Long lessonId) {
        return examResultRepository.findByLessonId(lessonId);
    }
}
