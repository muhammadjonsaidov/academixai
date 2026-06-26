package uz.forkbomb.academix.chat.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class ChatHistoryResponse {
    private Long id;
    private String message;
    private String response;
    private Long lessonId;
    private String lessonTitle;
    private LocalDateTime createdAt;
}
