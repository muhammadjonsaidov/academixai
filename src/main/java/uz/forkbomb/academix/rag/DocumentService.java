package uz.forkbomb.academix.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
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
import java.io.InputStream;
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
    private static final long MAX_FILE_BYTES = 30L * 1024 * 1024; // 30 MB

    @Transactional
    public TeacherDocument processUpload(MultipartFile file, Long teacherId,
                                          String tag, String subject, Long courseId) throws IOException {
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new IllegalArgumentException("File too large. Max 30 MB allowed.");
        }

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        String fileType = detectType(fileName);

        User teacher = userRepository.getReferenceById(teacherId);

        TeacherDocument doc = documentRepository.save(TeacherDocument.builder()
                .teacher(teacher)
                .fileName(fileName)
                .fileType(fileType)
                .tag(tag != null ? tag : "lesson_plan")
                .subject(subject)
                .courseId(courseId)
                .rawText(null)
                .chunkCount(0)
                .build());

        int chunkIndex = 0;
        chunkIndex = processStreaming(file, fileType, doc.getId(), teacherId, chunkIndex);

        doc.setChunkCount(chunkIndex);
        documentRepository.save(doc);
        log.info("Processed document '{}' → {} chunks for teacher {}", fileName, chunkIndex, teacherId);
        return doc;
    }

    private int processStreaming(MultipartFile file, String fileType,
                                  Long docId, Long teacherId, int startIndex) throws IOException {
        int idx = startIndex;
        if ("pdf".equals(fileType)) {
            try (InputStream is = file.getInputStream();
                 PDDocument pdf = Loader.loadPDF(new RandomAccessReadBuffer(is))) {
                PDFTextStripper stripper = new PDFTextStripper();
                int totalPages = pdf.getNumberOfPages();
                for (int page = 1; page <= totalPages; page++) {
                    stripper.setStartPage(page);
                    stripper.setEndPage(page);
                    String pageText = stripper.getText(pdf);
                    idx = embedChunks(pageText, docId, teacherId, idx);
                }
            }
        } else {
            String text = new String(file.getBytes(), StandardCharsets.UTF_8);
            idx = embedChunks(text, docId, teacherId, idx);
        }
        return idx;
    }

    private int embedChunks(String text, Long docId, Long teacherId, int startIndex) {
        if (text == null || text.isBlank()) return startIndex;
        String cleaned = text.replaceAll("\\s+", " ").strip();
        int idx = startIndex;
        int start = 0;
        while (start < cleaned.length()) {
            int end = Math.min(start + CHUNK_SIZE, cleaned.length());
            if (end < cleaned.length()) {
                int dot = cleaned.lastIndexOf('.', end);
                int nl = cleaned.lastIndexOf('\n', end);
                int boundary = Math.max(dot, nl);
                if (boundary > start + CHUNK_SIZE / 2) end = boundary + 1;
            }
            String chunk = cleaned.substring(start, end).strip();
            if (!chunk.isBlank()) {
                float[] embedding = embeddingService.embed(chunk);
                String vecStr = embeddingService.toVectorSql(embedding);
                jdbcTemplate.update(
                        "INSERT INTO document_chunks (document_id, teacher_id, content, chunk_index, embedding) VALUES (?, ?, ?, ?, ?::vector)",
                        docId, teacherId, chunk, idx, vecStr);
                idx++;
            }
            int next = end - CHUNK_OVERLAP;
            start = next <= 0 || next <= start ? end : next;
        }
        return idx;
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

    private String detectType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf")) return "pdf";
        return "txt";
    }
}
