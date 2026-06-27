package uz.forkbomb.academix.shared.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.forkbomb.academix.shared.model.PushSubscription;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    List<PushSubscription> findByUserId(Long userId);
    Optional<PushSubscription> findByUserIdAndEndpoint(Long userId, String endpoint);
    void deleteByUserIdAndEndpoint(Long userId, String endpoint);
}
