package uz.forkbomb.academix.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateCourseRequest {

    @NotBlank(message = "Kurs nomi bo'sh bo'lmasligi kerak")
    @Size(min = 3, max = 200, message = "Kurs nomi 3-200 belgi orasida bo'lsin")
    private String titleUz;

    @Size(max = 200)
    private String titleEn;

    @NotBlank(message = "Fan nomi bo'sh bo'lmasligi kerak")
    @Size(min = 2, max = 100, message = "Fan nomi 2-100 belgi orasida bo'lsin")
    private String subject;

    @Min(value = 1, message = "Sinf darajasi 1 dan kam bo'lmasin")
    @Max(value = 12, message = "Sinf darajasi 12 dan oshmasin")
    private Integer gradeLevel;

    @Size(max = 2000, message = "Tavsif 2000 belgidan oshmasin")
    private String descriptionUz;

    private String coverEmoji = "📚";
}
