package uz.forkbomb.academix.shared.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import uz.forkbomb.academix.shared.model.Attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    List<Attendance> findByStudentIdAndCourseId(Long studentId, Long courseId);
    Optional<Attendance> findByStudentIdAndCourseIdAndDate(Long studentId, Long courseId, LocalDate date);
    List<Attendance> findByCourseId(Long courseId);
    List<Attendance> findByCourseIdAndDate(Long courseId, LocalDate date);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :studentId AND a.present = false")
    long countAbsencesByStudentId(Long studentId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.schoolId = :schoolId AND a.present = false")
    long countAbsencesBySchoolId(Long schoolId);

    @Query("SELECT a.student.id, COUNT(a) FROM Attendance a WHERE a.student.schoolId = :schoolId AND a.present = false GROUP BY a.student.id")
    List<Object[]> countAbsencesPerStudentBySchoolId(Long schoolId);

    @Query("SELECT a FROM Attendance a WHERE a.student.schoolId = :schoolId ORDER BY a.date DESC")
    List<Attendance> findBySchoolId(Long schoolId);
}
