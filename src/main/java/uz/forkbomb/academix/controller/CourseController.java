package uz.forkbomb.academix.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.dto.response.CourseResponse;
import uz.forkbomb.academix.dto.response.LessonResponse;
import uz.forkbomb.academix.model.User;
import uz.forkbomb.academix.model.enums.Role;
import uz.forkbomb.academix.repository.UserRepository;
import uz.forkbomb.academix.service.CourseService;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Course and lesson management for students")
@SecurityRequirement(name = "Bearer")
public class CourseController {

    private final CourseService courseService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getCourses(
            @AuthenticationPrincipal UserDetails userDetails) {

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
            @PathVariable Long lessonId) {
        return ResponseEntity.ok(courseService.getLesson(courseId, lessonId));
    }

    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<?> enroll(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
        courseService.enrollStudent(userId, courseId);
        return ResponseEntity.ok(java.util.Map.of("message", "Kursga muvaffaqiyatli yozildingiz!"));
    }
}
