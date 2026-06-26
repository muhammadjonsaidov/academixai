package uz.forkbomb.academix.dto.request;

import lombok.Data;

import java.util.Map;

@Data
public class ExamGradeRequest {
    private String questionsJson;
    private Map<String, String> answers;
    private Long lessonId;
}
