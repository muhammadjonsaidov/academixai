package uz.forkbomb.academix.shared.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.forkbomb.academix.shared.model.AcademixNotification;

import java.util.List;

public interface NotificationRepository extends JpaRepository<AcademixNotification, Long> {
    List<AcademixNotification> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
}
