package uz.forkbomb.academix.course;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.course.dto.CourseI18nResponse;
import uz.forkbomb.academix.course.dto.CourseResponse;
import uz.forkbomb.academix.course.dto.LessonResponse;
import uz.forkbomb.academix.shared.exception.ForbiddenException;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.model.enums.Role;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.util.List;
import java.util.Locale;
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

    /**
     * Locale-aware endpoint: returns title/description in the language
     * resolved from the Accept-Language header (uz | en | ru, default uz).
     * <p>
     * Frontend sends: Accept-Language: en
     * Response: { title: "Algebra Basics", description: "..." }
     */
    @GetMapping("/i18n")
    public ResponseEntity<List<CourseI18nResponse>> getCoursesI18n(
            Locale locale,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        String lang = locale.getLanguage(); // "uz", "en", "ru"

        List<CourseI18nResponse> courses = (user.getRole() == Role.STUDENT
                ? courseService.getCoursesForStudent(user.getId())
                : courseService.getAllCourses())
                .stream()
                .map(cr -> {
                    // CourseResponse already has titleUz — build i18n DTO from it
                    // For courses that have i18n JSONB populated, CourseService
                    // should provide the raw entity; this layer resolves the locale.
                    return CourseI18nResponse.builder()
                            .id(cr.getId())
                            .title(resolveField(cr.getTitleI18n(), cr.getTitleUz(), lang))
                            .description(resolveField(cr.getDescriptionI18n(), cr.getDescriptionUz(), lang))
                            .subject(cr.getSubject())
                            .gradeLevel(cr.getGradeLevel())
                            .coverEmoji(cr.getCoverEmoji())
                            .teacherName(cr.getTeacherName())
                            .lessonCount(cr.getLessonCount())
                            .studentCount(cr.getStudentCount())
                            .lessons(cr.getLessons())
                            .build();
                })
                .toList();

        return ResponseEntity.ok(courses);
    }

    private String resolveField(Map<String, String> i18n, String fallback, String lang) {
        return CourseI18nResponse.resolve(i18n, fallback, lang);
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
