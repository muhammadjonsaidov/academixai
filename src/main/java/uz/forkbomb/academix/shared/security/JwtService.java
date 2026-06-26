package uz.forkbomb.academix.shared.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expirationMs;

    private NimbusJwtEncoder encoder;
    private NimbusJwtDecoder decoder;

    @PostConstruct
    public void init() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        SecretKey key = new SecretKeySpec(keyBytes, "HmacSHA256");
        encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        decoder = NimbusJwtDecoder.withSecretKey(key).build();
    }

    public String generateToken(String email, String role, Long userId) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("academixai.uz")
                .issuedAt(now)
                .expiresAt(now.plusMillis(expirationMs))
                .subject(email)
                .claim("role", role)
                .claim("userId", userId)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public String extractEmail(String token) {
        return decoder.decode(token).getSubject();
    }

    public String extractRole(String token) {
        return decoder.decode(token).getClaimAsString("role");
    }

    public Long extractUserId(String token) {
        Object userId = decoder.decode(token).getClaim("userId");
        if (userId instanceof Long l) return l;
        if (userId instanceof Integer i) return i.longValue();
        return Long.parseLong(userId.toString());
    }

    public boolean isValid(String token) {
        try {
            decoder.decode(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
