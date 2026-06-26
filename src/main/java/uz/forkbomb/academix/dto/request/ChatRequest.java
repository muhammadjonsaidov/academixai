package uz.forkbomb.academix.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatRequest {

    @NotBlank(message = "Xabar bo'sh bo'lmasligi kerak")
    @Size(min = 1, max = 1000, message = "Xabar 1-1000 belgi orasida bo'lsin")
    private String message;

    @Size(max = 200, message = "Dars konteksti 200 belgidan oshmasin")
    private String lessonContext;

    @Positive(message = "Dars ID musbat son bo'lishi kerak")
    private Long lessonId;
}
