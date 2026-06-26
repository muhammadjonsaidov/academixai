package uz.forkbomb.academix.exam;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.exam.dto.ExamGradeRequest;
import uz.forkbomb.academix.exam.dto.ExamGenerateRequest;
import uz.forkbomb.academix.shared.ai.AIService;
import uz.forkbomb.academix.shared.exception.ResourceNotFoundException;
import uz.forkbomb.academix.shared.model.ExamResult;
import uz.forkbomb.academix.shared.model.Lesson;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.repository.ExamResultRepository;
import uz.forkbomb.academix.shared.repository.LessonRepository;
import uz.forkbomb.academix.shared.repository.UserRepository;

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

    @SuppressWarnings("unchecked")
    public Map<String, Object> gradeAndSave(ExamGradeRequest request, Long studentId) {
        String gradeJson = aiService.gradeExam(request.getQuestionsJson(),
                objectMapper.valueToTree(request.getAnswers()).toString());

        Map<String, Object> result;
        try {
            result = objectMapper.readValue(gradeJson, Map.class);
        } catch (Exception e) {
            log.error("Failed to parse grade response: {}", gradeJson, e);
            throw new IllegalStateException("AI baholash natijasini qayta ishlashda xatolik. Qayta urinib ko'ring.");
        }

        int score = (int) result.getOrDefault("score", 0);
        String feedback = (String) result.getOrDefault("feedbackUz", "");

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
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
    }

    public List<ExamResult> getStudentResults(Long studentId) {
        return examResultRepository.findByStudentId(studentId);
    }
}
