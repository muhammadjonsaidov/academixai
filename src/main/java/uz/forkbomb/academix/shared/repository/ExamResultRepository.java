package uz.forkbomb.academix.shared.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.forkbomb.academix.shared.model.ExamResult;

import java.util.List;
import java.util.Optional;

public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    List<ExamResult> findByStudentId(Long studentId);
    List<ExamResult> findByLessonId(Long lessonId);
    Optional<ExamResult> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    @Query("SELECT e FROM ExamResult e WHERE e.lesson.course.id = :courseId")
    List<ExamResult> findByCourseId(Long courseId);

    @Query("SELECT AVG(e.score) FROM ExamResult e WHERE e.lesson.course.id = :courseId")
    Double avgScoreByCourseId(Long courseId);

    @Query("SELECT AVG(e.score) FROM ExamResult e WHERE e.student.schoolId = :schoolId")
    Double avgScoreBySchoolId(Long schoolId);
}
