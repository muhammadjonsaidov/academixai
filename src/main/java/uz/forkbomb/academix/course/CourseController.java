package uz.forkbomb.academix.course;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.course.dto.CourseResponse;
import uz.forkbomb.academix.course.dto.LessonResponse;
import uz.forkbomb.academix.shared.exception.ForbiddenException;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.model.enums.Role;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Course and lesson browsing")
@SecurityRequirement(name = "Bearer")
public class CourseController {

    private final CourseService courseService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getCourses(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<CourseResponse> courses = user.getRole() == Role.STUDENT
                ? courseService.getCoursesForStudent(user.getId())
                : courseService.getAllCourses();
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseWithLessons(id));
    }

    @GetMapping("/{courseId}/lessons/{lessonId}")
    public ResponseEntity<LessonResponse> getLesson(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(courseService.getLesson(courseId, lessonId, user.getId(), user.getRole()));
    }

    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<?> enroll(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        if (user.getRole() != Role.STUDENT) {
            throw new ForbiddenException("Only students can enroll in courses");
        }
        courseService.enrollStudent(user.getId(), courseId);
        return ResponseEntity.ok(Map.of("message", "Kursga muvaffaqiyatli yozildingiz!"));
    }
}
