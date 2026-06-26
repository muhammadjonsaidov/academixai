package uz.forkbomb.academix.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class LessonSummaryResponse {
    private Long id;
    private String titleUz;
    private Integer orderNum;
    private boolean hasPhet;
    private boolean hasVideo;
}
