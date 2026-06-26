package uz.forkbomb.academix.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class ChatResponse {
    private String reply;
    private LocalDateTime timestamp;
    private Long messageId;
}
