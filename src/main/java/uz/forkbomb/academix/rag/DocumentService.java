package uz.forkbomb.academix.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.forkbomb.academix.shared.model.TeacherDocument;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.repository.TeacherDocumentRepository;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final TeacherDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final EmbeddingService embeddingService;
    private final JdbcTemplate jdbcTemplate;

    private static final int CHUNK_SIZE = 600;
    private static final int CHUNK_OVERLAP = 100;

    @Transactional
    public TeacherDocument processUpload(MultipartFile file, Long teacherId,
                                          String tag, String subject, Long courseId) throws IOException {
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        String fileType = detectType(fileName);
        String rawText = extractText(file, fileType);

        User teacher = userRepository.getReferenceById(teacherId);

        TeacherDocument doc = documentRepository.save(TeacherDocument.builder()
                .teacher(teacher)
                .fileName(fileName)
                .fileType(fileType)
                .tag(tag != null ? tag : "lesson_plan")
                .subject(subject)
                .courseId(courseId)
                .rawText(rawText)
                .chunkCount(0)
                .build());

        List<String> chunks = chunk(rawText);
        for (int i = 0; i < chunks.size(); i++) {
            String content = chunks.get(i);
            float[] embedding = embeddingService.embed(content);
            String vecStr = embeddingService.toVectorSql(embedding);
            jdbcTemplate.update(
                    "INSERT INTO document_chunks (document_id, teacher_id, content, chunk_index, embedding) VALUES (?, ?, ?, ?, ?::vector)",
                    doc.getId(), teacherId, content, i, vecStr);
        }

        doc.setChunkCount(chunks.size());
        documentRepository.save(doc);
        log.info("Processed document '{}' → {} chunks for teacher {}", fileName, chunks.size(), teacherId);
        return doc;
    }

    @Transactional
    public void deleteDocument(Long docId, Long teacherId) {
        documentRepository.findById(docId).ifPresent(doc -> {
            if (doc.getTeacher().getId().equals(teacherId)) {
                jdbcTemplate.update("DELETE FROM document_chunks WHERE document_id = ?", docId);
                documentRepository.delete(doc);
            }
        });
    }

    public List<TeacherDocument> listDocuments(Long teacherId) {
        return documentRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
    }

    private String extractText(MultipartFile file, String fileType) throws IOException {
        return switch (fileType) {
            case "pdf" -> {
                try (PDDocument pdf = Loader.loadPDF(file.getBytes())) {
                    yield new PDFTextStripper().getText(pdf);
                }
            }
            default -> new String(file.getBytes(), StandardCharsets.UTF_8);
        };
    }

    private String detectType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf")) return "pdf";
        return "txt";
    }

    private List<String> chunk(String text) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) return chunks;
        String cleaned = text.replaceAll("\\s+", " ").strip();
        int start = 0;
        while (start < cleaned.length()) {
            int end = Math.min(start + CHUNK_SIZE, cleaned.length());
            // try to break on sentence boundary
            if (end < cleaned.length()) {
                int dot = cleaned.lastIndexOf('.', end);
                int nl = cleaned.lastIndexOf('\n', end);
                int boundary = Math.max(dot, nl);
                if (boundary > start + CHUNK_SIZE / 2) end = boundary + 1;
            }
            String chunk = cleaned.substring(start, end).strip();
            if (!chunk.isBlank()) chunks.add(chunk);
            start = end - CHUNK_OVERLAP;
            if (start <= 0) start = end;
        }
        return chunks;
    }
}
