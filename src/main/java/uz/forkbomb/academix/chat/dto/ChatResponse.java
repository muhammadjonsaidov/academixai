package uz.forkbomb.academix.chat.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class ChatResponse {
    private String reply;
    private LocalDateTime timestamp;
    private Long messageId;
    private List<Source> sources;
    private Boolean usedKnowledgeBase;

    @Data @Builder
    public static class Source {
        private String fileName;
        private String snippet;

        public Source(String fileName, String snippet) {
            this.fileName = fileName;
            this.snippet = snippet;
        }
    }
}
