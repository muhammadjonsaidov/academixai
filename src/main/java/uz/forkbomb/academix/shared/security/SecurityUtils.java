package uz.forkbomb.academix.shared.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.repository.UserRepository;

@Component("securityUtils")
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    public User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = (principal instanceof UserDetails ud) ? ud.getUsername() : principal.toString();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public Long currentUserId() {
        return currentUser().getId();
    }

    public boolean isOwnChild(Long studentId) {
        User user = currentUser();
        if (user.getRole().name().equals("PARENT")) {
            User student = userRepository.findById(studentId).orElse(null);
            return student != null && user.getId().equals(student.getParentId());
        }
        return true;
    }

    public boolean isOwner(Long userId) {
        return currentUserId().equals(userId);
    }
}
