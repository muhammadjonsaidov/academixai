package uz.forkbomb.academix.rag;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.forkbomb.academix.shared.model.TeacherDocument;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher/documents")
@RequiredArgsConstructor
@Tag(name = "Teacher Documents", description = "RAG knowledge base management")
@SecurityRequirement(name = "Bearer")
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(@AuthenticationPrincipal UserDetails ud) {
        User teacher = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        List<Map<String, Object>> docs = documentService.listDocuments(teacher.getId()).stream()
                .map(this::toMap).toList();
        return ResponseEntity.ok(docs);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tag", defaultValue = "lesson_plan") String tag,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "courseId", required = false) Long courseId,
            @AuthenticationPrincipal UserDetails ud) {
        try {
            User teacher = userRepository.findByEmail(ud.getUsername()).orElseThrow();
            TeacherDocument doc = documentService.processUpload(file, teacher.getId(), tag, subject, courseId);
            return ResponseEntity.ok(toMap(doc));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id,
                                                       @AuthenticationPrincipal UserDetails ud) {
        User teacher = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        documentService.deleteDocument(id, teacher.getId());
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    private Map<String, Object> toMap(TeacherDocument d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("fileName", d.getFileName());
        m.put("fileType", d.getFileType());
        m.put("tag", d.getTag());
        m.put("subject", d.getSubject());
        m.put("chunkCount", d.getChunkCount());
        m.put("createdAt", d.getCreatedAt().toString());
        return m;
    }
}
