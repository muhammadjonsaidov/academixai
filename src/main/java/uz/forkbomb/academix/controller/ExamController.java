package uz.forkbomb.academix.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.dto.request.ExamGenerateRequest;
import uz.forkbomb.academix.dto.request.ExamGradeRequest;
import uz.forkbomb.academix.repository.UserRepository;
import uz.forkbomb.academix.service.ExamService;

import java.util.Map;

@RestController
@RequestMapping("/api/exam")
@RequiredArgsConstructor
@Tag(name = "AI Exam", description = "AI generates and grades exams in Uzbek")
@SecurityRequirement(name = "Bearer")
public class ExamController {

    private final ExamService examService;
    private final UserRepository userRepository;

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generate(
            @Valid @RequestBody ExamGenerateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String questionsJson = examService.generateQuestions(request);
        return ResponseEntity.ok(Map.of("questionsJson", questionsJson));
    }

    @PostMapping("/grade")
    public ResponseEntity<Map<String, Object>> grade(
            @RequestBody ExamGradeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long studentId = userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
        return ResponseEntity.ok(examService.gradeAndSave(request, studentId));
    }

    @GetMapping("/results")
    public ResponseEntity<?> myResults(@AuthenticationPrincipal UserDetails userDetails) {
        Long studentId = userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
        return ResponseEntity.ok(
            examService.getStudentResults(studentId).stream().map(r -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id", r.getId());
                m.put("score", r.getScore());
                m.put("feedbackUz", r.getFeedbackUz());
                m.put("takenAt", r.getTakenAt() != null ? r.getTakenAt().toString() : null);
                m.put("lessonId", r.getLesson() != null ? r.getLesson().getId() : null);
                m.put("lessonTitle", r.getLesson() != null ? r.getLesson().getTitleUz() : null);
                m.put("courseId", r.getLesson() != null && r.getLesson().getCourse() != null
                    ? r.getLesson().getCourse().getId() : null);
                m.put("courseName", r.getLesson() != null && r.getLesson().getCourse() != null
                    ? r.getLesson().getCourse().getTitleUz() : null);
                return m;
            }).toList()
        );
    }
}
