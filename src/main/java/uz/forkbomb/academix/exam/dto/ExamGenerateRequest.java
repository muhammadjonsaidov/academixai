package uz.forkbomb.academix.exam.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ExamGenerateRequest {

    @NotBlank(message = "Mavzu bo'sh bo'lmasligi kerak")
    @Size(min = 2, max = 200, message = "Mavzu 2-200 belgi orasida bo'lsin")
    private String topic;

    @NotBlank(message = "Fan nomi bo'sh bo'lmasligi kerak")
    @Size(min = 2, max = 100)
    private String subject;

    @Min(value = 1, message = "Kamida 1 ta savol bo'lsin")
    @Max(value = 20, message = "Ko'pi bilan 20 ta savol yaratiladi")
    private int count = 5;

    @Positive
    private Long lessonId;
}
