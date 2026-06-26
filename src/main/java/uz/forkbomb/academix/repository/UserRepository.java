package uz.forkbomb.academix.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.forkbomb.academix.model.User;
import uz.forkbomb.academix.model.enums.Role;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByParentId(Long parentId);
    List<User> findBySchoolId(Long schoolId);
    List<User> findByRoleAndSchoolId(Role role, Long schoolId);
}
