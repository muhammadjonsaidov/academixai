package uz.forkbomb.academix.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data @Builder
public class CourseResponse {
    private Long id;
    private String titleUz;
    private String titleEn;
    private String subject;
    private Integer gradeLevel;
    private String descriptionUz;
    private String coverEmoji;
    private String teacherName;
    private Long lessonCount;
    private Long studentCount;
    private List<LessonSummaryResponse> lessons;
}
