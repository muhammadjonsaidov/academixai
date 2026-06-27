package uz.forkbomb.academix.shared.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class ClaudeCliService {

    private static final int TIMEOUT_SECONDS = 90;

    public String ask(String systemPrompt, String userMessage) {
        String fullPrompt = "/caveman " + systemPrompt.strip()
                + "\n\nUser: " + userMessage.strip();
        return runClaude(fullPrompt);
    }

    public String askJson(String systemPrompt, String userMessage) {
        // For JSON outputs: suppress caveman style, enforce strict JSON
        String fullPrompt = systemPrompt.strip() + "\n\nUser: " + userMessage.strip()
                + "\n\nReturn ONLY valid JSON. No markdown. No explanation.";
        return runClaude(fullPrompt);
    }

    private String runClaude(String prompt) {
        try {
            ProcessBuilder pb = new ProcessBuilder("claude", "--print");
            pb.redirectErrorStream(true);
            Process proc = pb.start();

            try (OutputStream stdin = proc.getOutputStream()) {
                stdin.write(prompt.getBytes(StandardCharsets.UTF_8));
            }

            String response = new String(
                    proc.getInputStream().readAllBytes(),
                    StandardCharsets.UTF_8
            );

            boolean finished = proc.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                proc.destroyForcibly();
                log.warn("Claude CLI timed out after {}s", TIMEOUT_SECONDS);
                return null;
            }

            return response.strip();

        } catch (Exception e) {
            log.error("Claude CLI subprocess failed: {}", e.getMessage());
            return null;
        }
    }
}
