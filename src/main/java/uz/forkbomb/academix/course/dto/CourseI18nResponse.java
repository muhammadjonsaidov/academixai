package uz.forkbomb.academix.course.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * Locale-filtered course DTO — returns title/description as plain strings
 * in the language matching the request's Accept-Language header.
 */
@Data
@Builder
public class CourseI18nResponse {

    private Long id;
    private String title;
    private String description;
    private String subject;
    private Integer gradeLevel;
    private String coverEmoji;
    private String teacherName;
    private Long lessonCount;
    private Long studentCount;
    private List<LessonSummaryResponse> lessons;

    public static String resolve(Map<String, String> i18n, String legacyUz, String lang) {
        if (i18n != null && !i18n.isEmpty()) {
            String value = i18n.get(lang);
            if (value != null && !value.isBlank()) return value;
            // fallback chain: uz → en → first available
            for (String fb : new String[]{"uz", "en", "ru"}) {
                String v = i18n.get(fb);
                if (v != null && !v.isBlank()) return v;
            }
        }
        return legacyUz != null ? legacyUz : "";
    }
}
