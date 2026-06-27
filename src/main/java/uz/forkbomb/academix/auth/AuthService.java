package uz.forkbomb.academix.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.auth.dto.AuthResponse;
import uz.forkbomb.academix.auth.dto.LoginRequest;
import uz.forkbomb.academix.auth.dto.RegisterRequest;
import uz.forkbomb.academix.rag.NotificationService;
import uz.forkbomb.academix.shared.exception.DuplicateResourceException;
import uz.forkbomb.academix.shared.exception.ResourceNotFoundException;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.model.enums.Role;
import uz.forkbomb.academix.shared.model.enums.SubscriptionTier;
import uz.forkbomb.academix.shared.repository.UserRepository;
import uz.forkbomb.academix.shared.security.JwtService;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final StringRedisTemplate redis;
    private final NotificationService notificationService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private static final String RESET_PREFIX = "pwd_reset:";

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getRole() != Role.SCHOOL_ADMIN) {
            throw new IllegalArgumentException("Self-registration is only available for school administrators. Contact your school admin for an account.");
        }
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .subscriptionTier(SubscriptionTier.FREE)
                .build();

        user = userRepository.save(user);
        user.setSchoolId(user.getId());
        user = userRepository.save(user);
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return buildResponse(user, token);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getEmail()));

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return buildResponse(user, token);
    }

    public void forgotPassword(String rawEmail) {
        String email = rawEmail.trim().toLowerCase();
        if (!userRepository.existsByEmail(email)) return; // silent — no email enumeration
        String token = UUID.randomUUID().toString();
        redis.opsForValue().set(RESET_PREFIX + token, email, Duration.ofMinutes(15));
        String link = frontendUrl + "/auth/reset?token=" + token;
        notificationService.sendEmail(email,
                "AcademiXAI — Parolni tiklash",
                "Assalomu alaykum!\n\nParolni tiklash uchun quyidagi havolani bosing:\n" + link +
                "\n\nHavola 15 daqiqa amal qiladi.\n\nAgar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring.");
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        String key = RESET_PREFIX + token;
        String email = redis.opsForValue().get(key);
        if (email == null) {
            throw new IllegalArgumentException("Havola yaroqsiz yoki muddati o'tgan. Qaytadan so'rov yuboring.");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        redis.delete(key);
    }

    private AuthResponse buildResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .userId(user.getId())
                .subscriptionTier(user.getSubscriptionTier().name())
                .build();
    }
}
