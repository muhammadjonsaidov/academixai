package uz.forkbomb.academix.chat;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.chat.dto.ChatHistoryResponse;
import uz.forkbomb.academix.chat.dto.ChatRequest;
import uz.forkbomb.academix.chat.dto.ChatResponse;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "AI Chat", description = "Ustoz Amir — AI tutor in Uzbek")
@SecurityRequirement(name = "Bearer")
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Send message to Ustoz Amir AI")
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
        return ResponseEntity.ok(chatService.chat(request, userId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatHistoryResponse>> getChatHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
        return ResponseEntity.ok(chatService.getHistory(userId));
    }

    @GetMapping("/history/lesson/{lessonId}")
    public ResponseEntity<List<ChatHistoryResponse>> getLessonChatHistory(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
        return ResponseEntity.ok(chatService.getLessonHistory(userId, lessonId));
    }
}
