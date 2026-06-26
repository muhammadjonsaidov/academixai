package uz.forkbomb.academix.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.dto.request.LoginRequest;
import uz.forkbomb.academix.dto.request.RegisterRequest;
import uz.forkbomb.academix.dto.response.AuthResponse;
import uz.forkbomb.academix.model.User;
import uz.forkbomb.academix.model.enums.SubscriptionTier;
import uz.forkbomb.academix.repository.UserRepository;
import uz.forkbomb.academix.security.JwtService;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .subscriptionTier(SubscriptionTier.FREE)
                .build();

        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return buildResponse(user, token);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return buildResponse(user, token);
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
