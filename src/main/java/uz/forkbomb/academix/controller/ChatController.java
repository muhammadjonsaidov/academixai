package uz.forkbomb.academix.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.dto.request.ChatRequest;
import uz.forkbomb.academix.dto.response.ChatResponse;
import uz.forkbomb.academix.repository.UserRepository;
import uz.forkbomb.academix.service.ChatService;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "AI Chat", description = "Ustoz Amir — AI tutor in Uzbek (Gemini 3.1 Flash Lite)")
@SecurityRequirement(name = "Bearer")
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Send message to Ustoz Amir AI", description = "AI responds in Uzbek. Optional: lessonContext for topic-aware answers.")
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow().getId();

        return ResponseEntity.ok(chatService.chat(request, userId));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getChatHistory(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow().getId();
        return ResponseEntity.ok(chatService.getHistory(userId));
    }

    @GetMapping("/history/lesson/{lessonId}")
    public ResponseEntity<?> getLessonChatHistory(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow().getId();
        return ResponseEntity.ok(chatService.getLessonHistory(userId, lessonId));
    }
}
