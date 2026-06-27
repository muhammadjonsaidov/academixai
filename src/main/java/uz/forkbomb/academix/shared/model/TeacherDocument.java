package uz.forkbomb.academix.shared.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

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

    @Builder.Default
    @Column(name = "chunk_count")
    private Integer chunkCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
