package uz.forkbomb.academix.shared.exception;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String msg(String code, Locale locale, Object... args) {
        return messageSource.getMessage(code, args, code, locale);
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message, "error", message));
    }

    // ── Handlers ──────────────────────────────────────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException e, Locale locale) {
        return error(HttpStatus.NOT_FOUND, msg("error.notFound", locale, e.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, String>> handleForbidden(ForbiddenException e, Locale locale) {
        return error(HttpStatus.FORBIDDEN, msg("error.forbidden", locale));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, String>> handleDuplicate(DuplicateResourceException e, Locale locale) {
        return error(HttpStatus.CONFLICT, msg("error.duplicate", locale));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e, Locale locale) {
        return error(HttpStatus.BAD_REQUEST, msg("error.validation", locale, e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException e, Locale locale) {
        return error(HttpStatus.BAD_REQUEST, msg("error.validation", locale, e.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException e, Locale locale) {
        return error(HttpStatus.UNAUTHORIZED, msg("error.badCredentials", locale));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e, Locale locale) {
        String details = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        String vmsg = msg("error.validation", locale, details);
        return ResponseEntity.badRequest().body(Map.of(
                "message", vmsg, "error", vmsg));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception e, Locale locale) {
        log.error("Unhandled exception: {}", e.getMessage(), e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, msg("error.internal", locale));
    }
}
