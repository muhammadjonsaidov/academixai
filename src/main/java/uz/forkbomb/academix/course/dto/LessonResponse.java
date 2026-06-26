package uz.forkbomb.academix.course.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class LessonResponse {
    private Long id;
    private Long courseId;
    private String courseTitleUz;
    private String titleUz;
    private String contentUz;
    private String phetUrl;
    private String videoUrl;
    private Integer orderNum;
}
