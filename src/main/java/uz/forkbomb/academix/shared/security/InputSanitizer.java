package uz.forkbomb.academix.shared.security;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class InputSanitizer {

    private static final Pattern SCRIPT_TAG = Pattern.compile("<script[^>]*>.*?</script>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern HTML_TAG    = Pattern.compile("<[^>]+>");
    private static final Pattern SQL_INJECT  = Pattern.compile("('|(--)|;|\\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC)\\b)", Pattern.CASE_INSENSITIVE);
    private static final Pattern PROMPT_INJ  = Pattern.compile("(ignore previous|forget instructions|system prompt|jailbreak|act as)", Pattern.CASE_INSENSITIVE);

    public String sanitizeChat(String input) {
        if (input == null) return null;
        String clean = SCRIPT_TAG.matcher(input).replaceAll("");
        clean = HTML_TAG.matcher(clean).replaceAll("");
        clean = PROMPT_INJ.matcher(clean).replaceAll("[FILTERED]");
        return clean.trim();
    }

    public String sanitizeText(String input) {
        if (input == null) return null;
        String clean = SCRIPT_TAG.matcher(input).replaceAll("");
        clean = HTML_TAG.matcher(clean).replaceAll("");
        clean = SQL_INJECT.matcher(clean).replaceAll("");
        return clean.trim();
    }

    public boolean containsSqlInjection(String input) {
        if (input == null) return false;
        return SQL_INJECT.matcher(input).find();
    }
}
