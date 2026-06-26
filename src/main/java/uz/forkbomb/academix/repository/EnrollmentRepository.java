package uz.forkbomb.academix.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.forkbomb.academix.model.Enrollment;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findByCourseId(Long courseId);
    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);
    long countByCourseId(Long courseId);
}
