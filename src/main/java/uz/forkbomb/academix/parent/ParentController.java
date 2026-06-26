package uz.forkbomb.academix.parent;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.rag.ParentInsightService;
import uz.forkbomb.academix.rag.ProgressService;
import uz.forkbomb.academix.shared.model.*;
import uz.forkbomb.academix.shared.repository.*;

import java.util.*;

@RestController
@RequestMapping("/api/parent")
@RequiredArgsConstructor
@Tag(name = "Parent", description = "Monitor children progress")
@SecurityRequirement(name = "Bearer")
public class ParentController {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ExamResultRepository examResultRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ParentInsightService insightService;
    private final ProgressService progressService;
    private final ProgressSnapshotRepository snapshotRepository;

    @GetMapping("/children")
    public ResponseEntity<?> getChildrenInfo(@AuthenticationPrincipal UserDetails ud) {
        User parent = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        List<User> children = userRepository.findByParentId(parent.getId());

        if (children.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasChildren", false, "children", List.of()));
        }

        List<Map<String, Object>> childrenData = children.stream().map(child -> {
            Long cid = child.getId();

            List<ExamResult> results = examResultRepository.findByStudentId(cid);
            double avgScore = results.stream()
                .mapToInt(r -> r.getScore() != null ? r.getScore() : 0)
                .average().orElse(0.0);
            long chatCount = chatMessageRepository.countByUserId(cid);

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

            List<Map<String, Object>> sentimentTrend = insightService.getSentimentTrend(cid);
            List<ProgressSnapshot> snapshots = snapshotRepository.findByStudentIdOrderBySnapshotDateDesc(cid);

            Map<String, Object> childMap = new LinkedHashMap<>();
            childMap.put("id", child.getId());
            childMap.put("fullName", child.getFullName());
            childMap.put("email", child.getEmail());
            childMap.put("avgScore", (long) Math.round(avgScore));
            childMap.put("chatCount", chatCount);
            childMap.put("recentExams", recentExams);
            childMap.put("enrolledCourses", courses);
            childMap.put("sentimentTrend", sentimentTrend);
            childMap.put("latestNarrative", snapshots.isEmpty() ? null : snapshots.get(0).getAiNarrative());
            return childMap;
        }).toList();

        return ResponseEntity.ok(Map.of(
            "hasChildren", true,
            "children", childrenData
        ));
    }

    @PostMapping("/ask")
    public ResponseEntity<?> askAboutChild(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        User parent = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        List<User> children = userRepository.findByParentId(parent.getId());
        if (children.isEmpty()) {
            return ResponseEntity.ok(Map.of("answer", "Siz bilan bog'liq farzand topilmadi."));
        }
        String question = body.getOrDefault("question", "");
        if (question.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "question required"));
        }
        // Default: first child
        Long childId = children.get(0).getId();
        String answer = insightService.askAboutChild(question, childId);
        return ResponseEntity.ok(Map.of("answer", answer, "childName", children.get(0).getFullName()));
    }

    @GetMapping("/children/{childId}/sentiment")
    public ResponseEntity<?> getSentiment(@PathVariable Long childId,
                                           @AuthenticationPrincipal UserDetails ud) {
        User parent = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        List<User> children = userRepository.findByParentId(parent.getId());
        boolean isOwn = children.stream().anyMatch(c -> c.getId().equals(childId));
        if (!isOwn) return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        return ResponseEntity.ok(insightService.getSentimentTrend(childId));
    }

    @PostMapping("/children/{childId}/report")
    public ResponseEntity<?> generateReport(@PathVariable Long childId,
                                             @AuthenticationPrincipal UserDetails ud) {
        User parent = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        List<User> children = userRepository.findByParentId(parent.getId());
        boolean isOwn = children.stream().anyMatch(c -> c.getId().equals(childId));
        if (!isOwn) return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));

        User child = userRepository.findById(childId).orElseThrow();
        ProgressSnapshot snap = progressService.buildAndSaveSnapshot(child, "weekly");
        return ResponseEntity.ok(Map.of("narrative", snap.getAiNarrative(), "avgScore", snap.getAvgScore()));
    }
}
