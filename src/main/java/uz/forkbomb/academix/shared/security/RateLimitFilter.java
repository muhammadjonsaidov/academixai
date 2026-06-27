package uz.forkbomb.academix.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redis;

    private static final Map<String, Integer> LIMITS = Map.of(
            "/api/chat",                    15,
            "/api/exam/generate",           10,
            "/api/exam/grade",              10,
            "/api/auth/register",            5,
            "/api/auth/login",              10,
            "/api/auth/forgot-password",     3,
            "/api/auth/reset-password",      5
    );

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String path = req.getRequestURI();
        String ip = getClientIp(req);

        for (Map.Entry<String, Integer> entry : LIMITS.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                try {
                    String key = "rl:" + entry.getKey() + ":" + ip;
                    Long count = redis.opsForValue().increment(key);
                    if (count == 1) {
                        redis.expire(key, Duration.ofMinutes(1));
                    }
                    if (count > entry.getValue()) {
                        log.warn("Rate limit exceeded: ip={} path={}", ip, path);
                        res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                        res.getWriter().write("{\"error\":\"So'rovlar chegarasi oshdi. 1 daqiqadan so'ng qayta urinib ko'ring.\"}");
                        return;
                    }
                } catch (Exception e) {
                    log.warn("Rate limit check failed (Redis unavailable), allowing request: {}", e.getMessage());
                }
                break;
            }
        }

        chain.doFilter(req, res);
    }

    private String getClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
