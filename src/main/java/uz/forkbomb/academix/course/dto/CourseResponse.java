package uz.forkbomb.academix.course.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

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
    /** Populated from JSONB column; null for legacy rows until V3 migration runs. */
    private Map<String, String> titleI18n;
    private Map<String, String> descriptionI18n;
}
