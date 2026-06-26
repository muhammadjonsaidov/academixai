package uz.forkbomb.academix.shared.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.forkbomb.academix.shared.model.Course;
import uz.forkbomb.academix.shared.model.User;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByTeacher(User teacher);
    List<Course> findBySchoolId(Long schoolId);
    List<Course> findBySubjectAndGradeLevel(String subject, Integer gradeLevel);

    @Query("SELECT c FROM Course c WHERE c.id IN (SELECT e.course.id FROM Enrollment e WHERE e.student.id = :studentId)")
    List<Course> findEnrolledCourses(Long studentId);
}
