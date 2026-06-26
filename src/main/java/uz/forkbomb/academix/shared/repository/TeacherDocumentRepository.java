package uz.forkbomb.academix.shared.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.forkbomb.academix.shared.model.TeacherDocument;

import java.util.List;

public interface TeacherDocumentRepository extends JpaRepository<TeacherDocument, Long> {
    List<TeacherDocument> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);
    void deleteByIdAndTeacherId(Long id, Long teacherId);
}
