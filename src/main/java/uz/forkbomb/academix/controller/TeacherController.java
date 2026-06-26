package uz.forkbomb.academix.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import uz.forkbomb.academix.dto.request.CreateCourseRequest;
import uz.forkbomb.academix.dto.request.CreateLessonRequest;
import uz.forkbomb.academix.repository.UserRepository;
import uz.forkbomb.academix.service.CourseService;
import uz.forkbomb.academix.service.TeacherService;

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

    @GetMapping("/courses")
    public ResponseEntity<?> myCourses(@AuthenticationPrincipal UserDetails userDetails) {
        Long teacherId = userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
        return ResponseEntity.ok(courseService.getTeacherCourses(teacherId));
    }

    @PostMapping("/courses")
    public ResponseEntity<?> createCourse(
            @Valid @RequestBody CreateCourseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long teacherId = userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
        return ResponseEntity.ok(courseService.createCourse(request, teacherId));
    }

    @PostMapping("/courses/{courseId}/lessons")
    public ResponseEntity<?> addLesson(
            @PathVariable Long courseId,
            @Valid @RequestBody CreateLessonRequest request) {
        return ResponseEntity.ok(courseService.addLesson(courseId, request));
    }

    @GetMapping("/courses/{courseId}/students")
    public ResponseEntity<?> getCourseStudents(@PathVariable Long courseId) {
        return ResponseEntity.ok(teacherService.getCourseStudents(courseId));
    }

    @GetMapping("/courses/{courseId}/analytics")
    public ResponseEntity<?> getCourseAnalytics(@PathVariable Long courseId) {
        return ResponseEntity.ok(teacherService.getCourseAnalytics(courseId));
    }

    @PostMapping("/courses/{courseId}/attendance")
    public ResponseEntity<?> markAttendance(
            @PathVariable Long courseId,
            @RequestParam Long studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam boolean present) {

        teacherService.markAttendance(courseId, studentId, date, present);
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
