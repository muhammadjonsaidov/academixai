package uz.forkbomb.academix.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import uz.forkbomb.academix.model.enums.Role;

@Data
public class RegisterRequest {

    @NotBlank(message = "Ism bo'sh bo'lmasligi kerak")
    @Size(min = 2, max = 100, message = "Ism 2-100 belgi orasida bo'lsin")
    @Pattern(regexp = "^[\\p{L} .'-]+$", message = "Ism faqat harflardan iborat bo'lsin")
    private String fullName;

    @NotBlank(message = "Email bo'sh bo'lmasligi kerak")
    @Email(message = "Email formati noto'g'ri")
    @Size(max = 254, message = "Email juda uzun")
    private String email;

    @NotBlank(message = "Parol bo'sh bo'lmasligi kerak")
    @Size(min = 8, max = 72, message = "Parol 8-72 belgi orasida bo'lsin")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
        message = "Parol kamida 1 katta harf, 1 kichik harf va 1 raqam o'z ichiga olsin"
    )
    private String password;

    private Role role = Role.STUDENT;
}
