package uz.forkbomb.academix.shared.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.forkbomb.academix.shared.model.ProgressSnapshot;

import java.util.List;
import java.util.Optional;

public interface ProgressSnapshotRepository extends JpaRepository<ProgressSnapshot, Long> {
    List<ProgressSnapshot> findByStudentIdOrderBySnapshotDateDesc(Long studentId);
    Optional<ProgressSnapshot> findTopByStudentIdAndSnapshotTypeOrderBySnapshotDateDesc(Long studentId, String type);
}
