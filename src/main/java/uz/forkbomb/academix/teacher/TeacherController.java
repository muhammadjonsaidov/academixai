package uz.forkbomb.academix.teacher;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.course.CourseService;
import uz.forkbomb.academix.course.dto.CreateCourseRequest;
import uz.forkbomb.academix.course.dto.CreateLessonRequest;
import uz.forkbomb.academix.shared.repository.UserRepository;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@Tag(name = "Teacher", description = "Course creation, attendance, AI exam generation, analytics")
@SecurityRequirement(name = "Bearer")
public class TeacherController {

    private final CourseService courseService;
    private final TeacherService teacherService;
    private final UserRepository userRepository;

    private Long getTeacherId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
    }

    @GetMapping("/courses")
    public ResponseEntity<?> myCourses(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(courseService.getTeacherCourses(getTeacherId(userDetails)));
    }

    @PostMapping("/courses")
    public ResponseEntity<?> createCourse(
            @Valid @RequestBody CreateCourseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(courseService.createCourse(request, getTeacherId(userDetails)));
    }

    @PostMapping("/courses/{courseId}/lessons")
    public ResponseEntity<?> addLesson(
            @PathVariable Long courseId,
            @Valid @RequestBody CreateLessonRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(teacherService.addLesson(courseId, request, getTeacherId(userDetails)));
    }

    @GetMapping("/courses/{courseId}/students")
    public ResponseEntity<?> getCourseStudents(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(teacherService.getCourseStudents(courseId, getTeacherId(userDetails)));
    }

    @GetMapping("/courses/{courseId}/analytics")
    public ResponseEntity<?> getCourseAnalytics(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(teacherService.getCourseAnalytics(courseId, getTeacherId(userDetails)));
    }

    @PostMapping("/courses/{courseId}/attendance")
    public ResponseEntity<?> markAttendance(
            @PathVariable Long courseId,
            @RequestParam Long studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam boolean present,
            @AuthenticationPrincipal UserDetails userDetails) {
        teacherService.markAttendance(courseId, studentId, getTeacherId(userDetails), date, present);
        return ResponseEntity.ok(Map.of("message", "Davomat belgilandi"));
    }

    @PostMapping("/lesson-draft")
    public ResponseEntity<?> generateLessonDraft(@RequestBody Map<String, Object> body) {
        String topic = (String) body.get("topic");
        String subject = (String) body.get("subject");
        int gradeLevel = Integer.parseInt(body.getOrDefault("gradeLevel", "9").toString());
        return ResponseEntity.ok(Map.of("draft", teacherService.generateLessonDraft(topic, subject, gradeLevel)));
    }
}
