package uz.forkbomb.academix.shared.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.forkbomb.academix.shared.model.ExamResult;

import java.util.List;
import java.util.Optional;

public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    @EntityGraph(attributePaths = {"lesson", "lesson.course"})
    List<ExamResult> findByStudentId(Long studentId);
    List<ExamResult> findByLessonId(Long lessonId);
    Optional<ExamResult> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    @EntityGraph(attributePaths = {"lesson", "lesson.course", "student"})
    @Query("SELECT e FROM ExamResult e WHERE e.lesson.course.id = :courseId")
    List<ExamResult> findByCourseId(Long courseId);

    @Query("SELECT AVG(e.score) FROM ExamResult e WHERE e.lesson.course.id = :courseId")
    Double avgScoreByCourseId(Long courseId);

    @Query("SELECT AVG(e.score) FROM ExamResult e WHERE e.student.id = :studentId")
    Double avgScoreByStudentId(Long studentId);

    @Query("SELECT AVG(e.score) FROM ExamResult e WHERE e.student.schoolId = :schoolId")
    Double avgScoreBySchoolId(Long schoolId);

    @Query("SELECT e.student.id, AVG(e.score) FROM ExamResult e WHERE e.student.id IN :studentIds GROUP BY e.student.id")
    List<Object[]> avgScoresByStudentIds(List<Long> studentIds);
}
