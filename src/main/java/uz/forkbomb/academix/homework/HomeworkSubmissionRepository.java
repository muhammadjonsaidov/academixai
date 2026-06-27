package uz.forkbomb.academix.homework;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, Long> {

    @Query("SELECT h FROM HomeworkSubmission h WHERE h.student.id = :studentId ORDER BY h.createdAt DESC")
    List<HomeworkSubmission> findByStudentId(Long studentId);
}
