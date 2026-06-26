package uz.forkbomb.academix.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import uz.forkbomb.academix.model.User;
import uz.forkbomb.academix.repository.UserRepository;

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

    // Used in @PreAuthorize — parent can only access their own child's data
    public boolean isOwnChild(Long studentId) {
        User user = currentUser();
        if (user.getRole().name().equals("PARENT")) {
            User student = userRepository.findById(studentId).orElse(null);
            return student != null && user.getId().equals(student.getParentId());
        }
        return true; // teachers and admins can access any student
    }

    public boolean isOwner(Long userId) {
        return currentUserId().equals(userId);
    }
}
