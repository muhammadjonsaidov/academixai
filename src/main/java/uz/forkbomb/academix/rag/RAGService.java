package uz.forkbomb.academix.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RAGService {

    private final EmbeddingService embeddingService;
    private final JdbcTemplate jdbcTemplate;

    private static final double MIN_SIMILARITY = 0.45;
    private static final int TOP_K = 4;

    public record RAGResult(String context, List<Source> sources, boolean hasRelevantContent) {}
    public record Source(String fileName, String snippet, double similarity) {}

    public RAGResult retrieve(String query, Long teacherId) {
        float[] queryVec = embeddingService.embed(query);
        String vecStr = embeddingService.toVectorSql(queryVec);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT dc.content, d.file_name,
                       1 - (dc.embedding <=> ?::vector) AS similarity
                FROM document_chunks dc
                JOIN teacher_documents d ON d.id = dc.document_id
                WHERE dc.teacher_id = ?
                ORDER BY dc.embedding <=> ?::vector
                LIMIT ?
                """,
                vecStr, teacherId, vecStr, TOP_K
        );

        List<Source> sources = new ArrayList<>();
        List<String> contextParts = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            double sim = ((Number) row.get("similarity")).doubleValue();
            if (sim < MIN_SIMILARITY) continue;
            String content = (String) row.get("content");
            String fileName = (String) row.get("file_name");
            sources.add(new Source(fileName, content.substring(0, Math.min(120, content.length())), sim));
            contextParts.add(content);
        }

        if (contextParts.isEmpty()) {
            return new RAGResult("", List.of(), false);
        }

        String context = String.join("\n\n---\n\n", contextParts);
        return new RAGResult(context, sources, true);
    }

    public RAGResult retrieveForAllTeachers(String query, List<Long> teacherIds) {
        if (teacherIds == null || teacherIds.isEmpty()) return new RAGResult("", List.of(), false);
        float[] queryVec = embeddingService.embed(query);
        String vecStr = embeddingService.toVectorSql(queryVec);
        String inClause = String.join(",", Collections.nCopies(teacherIds.size(), "?"));

        List<Object> params = new ArrayList<>();
        params.add(vecStr);
        params.addAll(teacherIds);
        params.add(vecStr);
        params.add(TOP_K);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT dc.content, d.file_name, 1 - (dc.embedding <=> ?::vector) AS similarity " +
                "FROM document_chunks dc JOIN teacher_documents d ON d.id = dc.document_id " +
                "WHERE dc.teacher_id IN (" + inClause + ") " +
                "ORDER BY dc.embedding <=> ?::vector LIMIT ?",
                params.toArray()
        );

        List<Source> sources = new ArrayList<>();
        List<String> contextParts = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            double sim = ((Number) row.get("similarity")).doubleValue();
            if (sim < MIN_SIMILARITY) continue;
            String content = (String) row.get("content");
            sources.add(new Source((String) row.get("file_name"),
                    content.substring(0, Math.min(120, content.length())), sim));
            contextParts.add(content);
        }
        return new RAGResult(String.join("\n\n---\n\n", contextParts), sources, !sources.isEmpty());
    }
}
