package uz.forkbomb.academix.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.dto.request.CreateCourseRequest;
import uz.forkbomb.academix.dto.request.CreateLessonRequest;
import uz.forkbomb.academix.dto.response.CourseResponse;
import uz.forkbomb.academix.dto.response.LessonResponse;
import uz.forkbomb.academix.dto.response.LessonSummaryResponse;
import uz.forkbomb.academix.model.Course;
import uz.forkbomb.academix.model.Enrollment;
import uz.forkbomb.academix.model.Lesson;
import uz.forkbomb.academix.model.User;
import uz.forkbomb.academix.repository.*;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public List<CourseResponse> getCoursesForStudent(Long studentId) {
        List<Course> courses = courseRepository.findEnrolledCourses(studentId);
        return courses.stream().map(this::toCourseResponse).toList();
    }

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream().map(this::toCourseResponse).toList();
    }

    public CourseResponse getCourseWithLessons(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + courseId));

        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderNumAsc(courseId);
        List<LessonSummaryResponse> lessonSummaries = lessons.stream()
                .map(l -> LessonSummaryResponse.builder()
                        .id(l.getId())
                        .titleUz(l.getTitleUz())
                        .orderNum(l.getOrderNum())
                        .hasPhet(l.getPhetUrl() != null)
                        .hasVideo(l.getVideoUrl() != null)
                        .build())
                .toList();

        return CourseResponse.builder()
                .id(course.getId())
                .titleUz(course.getTitleUz())
                .titleEn(course.getTitleEn())
                .subject(course.getSubject())
                .gradeLevel(course.getGradeLevel())
                .descriptionUz(course.getDescriptionUz())
                .coverEmoji(course.getCoverEmoji())
                .teacherName(course.getTeacher() != null ? course.getTeacher().getFullName() : null)
                .lessonCount((long) lessons.size())
                .studentCount(enrollmentRepository.countByCourseId(courseId))
                .lessons(lessonSummaries)
                .build();
    }

    public LessonResponse getLesson(Long courseId, Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found: " + lessonId));
        return toLessonResponse(lesson);
    }

    public CourseResponse createCourse(CreateCourseRequest request, Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));

        Course course = Course.builder()
                .titleUz(request.getTitleUz())
                .titleEn(request.getTitleEn())
                .subject(request.getSubject())
                .gradeLevel(request.getGradeLevel())
                .descriptionUz(request.getDescriptionUz())
                .coverEmoji(request.getCoverEmoji())
                .teacher(teacher)
                .build();

        return toCourseResponse(courseRepository.save(course));
    }

    public LessonResponse addLesson(Long courseId, CreateLessonRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        Lesson lesson = Lesson.builder()
                .course(course)
                .titleUz(request.getTitleUz())
                .contentUz(request.getContentUz())
                .phetUrl(request.getPhetUrl())
                .videoUrl(request.getVideoUrl())
                .orderNum(request.getOrderNum())
                .build();

        return toLessonResponse(lessonRepository.save(lesson));
    }

    public void enrollStudent(Long studentId, Long courseId) {
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) return;

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        enrollmentRepository.save(Enrollment.builder().student(student).course(course).build());
    }

    public List<CourseResponse> getTeacherCourses(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));
        return courseRepository.findByTeacher(teacher).stream().map(this::toCourseResponse).toList();
    }

    private CourseResponse toCourseResponse(Course c) {
        return CourseResponse.builder()
                .id(c.getId())
                .titleUz(c.getTitleUz())
                .titleEn(c.getTitleEn())
                .subject(c.getSubject())
                .gradeLevel(c.getGradeLevel())
                .descriptionUz(c.getDescriptionUz())
                .coverEmoji(c.getCoverEmoji())
                .teacherName(c.getTeacher() != null ? c.getTeacher().getFullName() : null)
                .lessonCount(lessonRepository.countByCourseId(c.getId()))
                .studentCount(enrollmentRepository.countByCourseId(c.getId()))
                .build();
    }

    private LessonResponse toLessonResponse(Lesson l) {
        return LessonResponse.builder()
                .id(l.getId())
                .courseId(l.getCourse().getId())
                .courseTitleUz(l.getCourse().getTitleUz())
                .titleUz(l.getTitleUz())
                .contentUz(l.getContentUz())
                .phetUrl(l.getPhetUrl())
                .videoUrl(l.getVideoUrl())
                .orderNum(l.getOrderNum())
                .build();
    }
}
