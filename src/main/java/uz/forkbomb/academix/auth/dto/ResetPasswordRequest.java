package uz.forkbomb.academix.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank
    private String token;

    @NotBlank
    @Size(min = 8, max = 72, message = "Parol 8-72 belgi orasida bo'lsin")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
        message = "Parol kamida 1 katta harf, 1 kichik harf va 1 raqam o'z ichiga olsin"
    )
    private String newPassword;
}
