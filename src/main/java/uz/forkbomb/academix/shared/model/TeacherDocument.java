package uz.forkbomb.academix.shared.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "teacher_documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeacherDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type")
    private String fileType; // pdf, txt

    private String tag; // lesson_plan, exam_prep, homework, extra

    private String subject;

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "chunk_count")
    private Integer chunkCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
