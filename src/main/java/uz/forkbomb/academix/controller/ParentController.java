package uz.forkbomb.academix.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.model.*;
import uz.forkbomb.academix.repository.*;

import java.util.*;

@RestController
@RequestMapping("/api/parent")
@RequiredArgsConstructor
@Tag(name = "Parent", description = "Monitor child progress")
@SecurityRequirement(name = "Bearer")
public class ParentController {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ExamResultRepository examResultRepository;
    private final ChatMessageRepository chatMessageRepository;

    @GetMapping("/child")
    public ResponseEntity<?> getChildInfo(@AuthenticationPrincipal UserDetails ud) {
        User parent = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        List<User> children = userRepository.findByParentId(parent.getId());

        if (children.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasChild", false));
        }

        User child = children.get(0);
        Long cid = child.getId();

        List<ExamResult> results = examResultRepository.findByStudentId(cid);
        double avgScore = results.stream()
            .mapToInt(r -> r.getScore() != null ? r.getScore() : 0)
            .average().orElse(0.0);
        long chatCount = chatMessageRepository.findByUserIdOrderByCreatedAtDesc(cid).size();

        List<Map<String, Object>> recentExams = results.stream()
            .sorted((a, b) -> b.getTakenAt().compareTo(a.getTakenAt()))
            .limit(5)
            .map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", r.getId());
                m.put("score", r.getScore());
                m.put("feedbackUz", r.getFeedbackUz());
                m.put("lessonTitle", r.getLesson() != null ? r.getLesson().getTitleUz() : "Dars");
                m.put("courseName", r.getLesson() != null && r.getLesson().getCourse() != null
                    ? r.getLesson().getCourse().getTitleUz() : "");
                m.put("takenAt", r.getTakenAt().toString());
                return m;
            }).toList();

        List<Map<String, Object>> courses = enrollmentRepository.findByStudentId(cid).stream()
            .map(e -> {
                Course c = e.getCourse();
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", c.getId());
                m.put("title", c.getTitleUz());
                m.put("subject", c.getSubject());
                m.put("emoji", c.getCoverEmoji());
                return m;
            }).toList();

        return ResponseEntity.ok(Map.of(
            "hasChild", true,
            "child", Map.of(
                "id", child.getId(),
                "fullName", child.getFullName(),
                "email", child.getEmail()
            ),
            "avgScore", (long) Math.round(avgScore),
            "chatCount", chatCount,
            "recentExams", recentExams,
            "enrolledCourses", courses
        ));
    }
}
