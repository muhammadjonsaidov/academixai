package uz.forkbomb.academix.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.forkbomb.academix.model.Attendance;

import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    List<Attendance> findByStudentIdAndCourseId(Long studentId, Long courseId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :studentId AND a.present = false")
    long countAbsencesByStudentId(Long studentId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.schoolId = :schoolId AND a.present = false")
    long countAbsencesBySchoolId(Long schoolId);
}
