package uz.forkbomb.academix.student;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.shared.exception.ResourceNotFoundException;
import uz.forkbomb.academix.shared.model.*;
import uz.forkbomb.academix.shared.repository.*;
import uz.forkbomb.academix.shared.repository.NotificationRepository;

import java.util.*;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Tag(name = "Student", description = "Student profile, notes, dashboard stats")
@SecurityRequirement(name = "Bearer")
public class StudentController {

    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ExamResultRepository examResultRepository;
    private final LessonRepository lessonRepository;
    private final NotificationRepository notificationRepository;

    private User getCurrentUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername()).orElseThrow();
    }

    @GetMapping("/notes")
    public ResponseEntity<?> getNotes(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        List<Note> notes = noteRepository.findByStudentId(u.getId());
        List<Map<String, Object>> result = notes.stream().map(n -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", n.getId());
            m.put("content", n.getContent());
            m.put("lessonId", n.getLesson() != null ? n.getLesson().getId() : null);
            m.put("lessonTitle", n.getLesson() != null ? n.getLesson().getTitleUz() : null);
            m.put("createdAt", n.getCreatedAt().toString());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/notes")
    public ResponseEntity<?> createNote(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        String content = (String) body.get("content");
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("content is required");
        }
        Long lessonId = body.get("lessonId") != null
            ? Long.valueOf(body.get("lessonId").toString()) : null;
        Lesson lesson = lessonId != null
            ? lessonRepository.findById(lessonId).orElse(null) : null;

        Note note = noteRepository.save(Note.builder()
            .student(u)
            .lesson(lesson)
            .content(content.strip())
            .build());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", note.getId());
        res.put("content", note.getContent());
        res.put("lessonId", lessonId);
        res.put("lessonTitle", lesson != null ? lesson.getTitleUz() : null);
        res.put("createdAt", note.getCreatedAt().toString());
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<?> deleteNote(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        Note note = noteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Note", id));
        if (!note.getStudent().getId().equals(u.getId())) {
            throw new uz.forkbomb.academix.shared.exception.ForbiddenException("Bu eslatma sizga tegishli emas");
        }
        noteRepository.delete(note);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        Long sid = u.getId();

        // FIX: use count queries — no loading all rows into memory
        long enrolledCount = enrollmentRepository.countByStudentId(sid);
        long chatCount = chatMessageRepository.countByUserId(sid);

        List<ExamResult> results = examResultRepository.findByStudentId(sid);
        double avgScore = results.stream()
            .mapToInt(r -> r.getScore() != null ? r.getScore() : 0)
            .average().orElse(0.0);

        List<Map<String, Object>> recentExams = results.stream()
            .sorted((a, b) -> b.getTakenAt().compareTo(a.getTakenAt()))
            .limit(5)
            .map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", r.getId());
                m.put("score", r.getScore());
                m.put("lessonTitle", r.getLesson() != null ? r.getLesson().getTitleUz() : "Dars");
                m.put("courseName", r.getLesson() != null && r.getLesson().getCourse() != null
                    ? r.getLesson().getCourse().getTitleUz() : "");
                m.put("takenAt", r.getTakenAt().toString());
                return m;
            }).toList();

        return ResponseEntity.ok(Map.of(
            "enrolledCount", enrolledCount,
            "avgScore", (long) Math.round(avgScore),
            "chatCount", chatCount,
            "recentExams", recentExams
        ));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(u.getId())) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok(Map.of("message", "OK"));
    }
}
