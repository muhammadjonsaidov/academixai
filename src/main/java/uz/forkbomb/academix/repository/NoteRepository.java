package uz.forkbomb.academix.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.forkbomb.academix.model.Note;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByStudentIdAndLessonId(Long studentId, Long lessonId);
    List<Note> findByStudentId(Long studentId);
}
