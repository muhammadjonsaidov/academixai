package uz.forkbomb.academix.course;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.forkbomb.academix.course.dto.*;
import uz.forkbomb.academix.shared.exception.ForbiddenException;
import uz.forkbomb.academix.shared.exception.ResourceNotFoundException;
import uz.forkbomb.academix.shared.model.*;
import uz.forkbomb.academix.shared.model.enums.Role;
import uz.forkbomb.academix.shared.repository.*;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseService {

    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public List<CourseResponse> getCoursesForStudent(Long studentId) {
        return courseRepository.findEnrolledCourses(studentId).stream()
                .map(this::toCourseResponse).toList();
    }

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream().map(this::toCourseResponse).toList();
    }

    public CourseResponse getCourseWithLessons(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

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

    public LessonResponse getLesson(Long courseId, Long lessonId, Long userId, Role role) {
        if (role == Role.STUDENT && !enrollmentRepository.existsByStudentIdAndCourseId(userId, courseId)) {
            throw new ForbiddenException("Kursga yozilmagansiz");
        }
        if (role == Role.TEACHER) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
            if (!course.getTeacher().getId().equals(userId)) {
                throw new ForbiddenException("Bu kurs sizga tegishli emas");
            }
        }
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", lessonId));
        return toLessonResponse(lesson);
    }

    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request, Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));

        Course course = Course.builder()
                .titleUz(request.getTitleUz())
                .titleEn(request.getTitleEn())
                .subject(request.getSubject())
                .gradeLevel(request.getGradeLevel())
                .descriptionUz(request.getDescriptionUz())
                .coverEmoji(request.getCoverEmoji())
                .teacher(teacher)
                .schoolId(teacher.getSchoolId())  // FIX: propagate teacher's schoolId
                .build();

        return toCourseResponse(courseRepository.save(course));
    }

    @Transactional
    public LessonResponse addLesson(Long courseId, CreateLessonRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

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

    @Transactional
    public void enrollStudent(Long studentId, Long courseId) {
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) return;

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        enrollmentRepository.save(Enrollment.builder().student(student).course(course).build());
    }

    public List<CourseResponse> getTeacherCourses(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));
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
                .titleI18n(c.getTitleI18n())
                .descriptionI18n(c.getDescriptionI18n())
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
