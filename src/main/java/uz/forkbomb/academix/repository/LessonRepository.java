package uz.forkbomb.academix.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.forkbomb.academix.model.Lesson;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByCourseIdOrderByOrderNumAsc(Long courseId);
    long countByCourseId(Long courseId);
}
