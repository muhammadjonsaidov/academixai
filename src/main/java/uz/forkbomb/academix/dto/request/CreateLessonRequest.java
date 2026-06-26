package uz.forkbomb.academix.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

@Data
public class CreateLessonRequest {

    @NotBlank(message = "Dars nomi bo'sh bo'lmasligi kerak")
    @Size(min = 3, max = 200, message = "Dars nomi 3-200 belgi orasida bo'lsin")
    private String titleUz;

    @Size(max = 10000, message = "Dars matni 10000 belgidan oshmasin")
    private String contentUz;

    @URL(message = "PhET URL formati noto'g'ri")
    @Size(max = 500)
    private String phetUrl;

    @URL(message = "Video URL formati noto'g'ri")
    @Size(max = 500)
    private String videoUrl;

    @Min(0) @Max(500)
    private Integer orderNum = 0;
}
