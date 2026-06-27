package uz.forkbomb.academix.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.forkbomb.academix.shared.ai.AIService;
import uz.forkbomb.academix.shared.model.*;
import uz.forkbomb.academix.shared.model.enums.Role;
import uz.forkbomb.academix.shared.repository.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressService {

    private final UserRepository userRepository;
    private final ExamResultRepository examResultRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SentimentLogRepository sentimentLogRepository;
    private final ProgressSnapshotRepository snapshotRepository;
    private final NotificationService notificationService;
    private final AIService aiService;

    // Every Sunday at 20:00
    @Scheduled(cron = "0 0 20 * * SUN")
    public void weeklySnapshots() {
        log.info("Running weekly progress snapshots...");
        List<User> students = userRepository.findByRole(Role.STUDENT);
        for (User student : students) {
            try {
                ProgressSnapshot snap = buildAndSaveSnapshot(student, "weekly");
                if (Boolean.TRUE.equals(student.getWeeklyReport())) {
                    notificationService.sendEmailIfEnabled(student,
                            "AcademiXAI — Haftalik hisobot",
                            "Salom " + student.getFullName() + ",\n\n" +
                            snap.getAiNarrative() + "\n\nPlatformaga kirish: https://academixai.uz");
                }
            } catch (Exception e) {
                log.warn("Failed weekly snapshot for student {}: {}", student.getId(), e.getMessage());
            }
        }
    }

    // Every Sunday at 21:00 — teacher weekly summary
    @Scheduled(cron = "0 0 21 * * SUN")
    @Transactional
    public void teacherWeeklyReports() {
        log.info("Running teacher weekly reports...");
        List<User> teachers = userRepository.findByRole(Role.TEACHER);
        for (User teacher : teachers) {
            try {
                if (!Boolean.TRUE.equals(teacher.getWeeklyReport())) continue;
                long studentCount = teacher.getSchoolId() != null
                        ? userRepository.countByRoleAndSchoolId(Role.STUDENT, teacher.getSchoolId())
                        : 0L;
                String summary = aiService.chatWithSystem(
                        "Siz ta'lim analitikisiz. O'zbek tilida qisqa hisobot yozing.",
                        String.format("O'qituvchi %s uchun haftalik umumiy hisobot. Maktabda %d o'quvchi bor. " +
                                "3 jumlada qisqa umumiy xulosang yozing.",
                                teacher.getFullName(), studentCount));
                notificationService.create(teacher.getId(), "weekly_report",
                        "Haftalik o'qituvchi hisoboti", summary);
                notificationService.sendEmailIfEnabled(teacher,
                        "AcademiXAI — Haftalik hisobot",
                        "Salom " + teacher.getFullName() + ",\n\n" + summary +
                        "\n\nPlatformaga kirish: https://academixai.uz");
            } catch (Exception e) {
                log.warn("Failed teacher weekly report for {}: {}", teacher.getId(), e.getMessage());
            }
        }
    }

    // Every Sunday at 22:00 — admin weekly summary
    @Scheduled(cron = "0 0 22 * * SUN")
    @Transactional
    public void adminWeeklyReports() {
        log.info("Running admin weekly reports...");
        List<User> admins = userRepository.findByRole(Role.SCHOOL_ADMIN);
        for (User admin : admins) {
            try {
                if (!Boolean.TRUE.equals(admin.getWeeklyReport())) continue;
                Long schoolId = admin.getSchoolId();
                if (schoolId == null) continue;
                long teacherCount = userRepository.countByRoleAndSchoolId(Role.TEACHER, schoolId);
                long studentCount = userRepository.countByRoleAndSchoolId(Role.STUDENT, schoolId);
                String summary = aiService.chatWithSystem(
                        "Siz ta'lim analitikisiz. O'zbek tilida qisqa hisobot yozing.",
                        String.format("Maktab direktori %s uchun haftalik hisobot. O'qituvchilar: %d, O'quvchilar: %d. " +
                                "3 jumlada qisqa xulosang yozing.",
                                admin.getFullName(), teacherCount, studentCount));
                notificationService.create(admin.getId(), "weekly_report",
                        "Haftalik maktab hisoboti", summary);
                notificationService.sendEmailIfEnabled(admin,
                        "AcademiXAI — Haftalik maktab hisoboti",
                        "Salom " + admin.getFullName() + ",\n\n" + summary +
                        "\n\nPlatformaga kirish: https://academixai.uz");
            } catch (Exception e) {
                log.warn("Failed admin weekly report for {}: {}", admin.getId(), e.getMessage());
            }
        }
    }

    // Every Monday at 08:00 — AI tips for all users who have aiTips enabled
    @Scheduled(cron = "0 0 8 * * MON")
    @Transactional
    public void weeklyAiTips() {
        log.info("Running weekly AI tips...");
        List<User> students = userRepository.findByRole(Role.STUDENT);
        for (User student : students) {
            try {
                if (!Boolean.TRUE.equals(student.getAiTips())) continue;
                String tip = aiService.chatWithSystem(
                        "Siz ta'lim bo'yicha maslahatchi. O'zbek tilida 1 qisqa, amaliy maslahat bering.",
                        "O'quvchi " + student.getFullName() + " uchun bu haftaga oid 1 amaliy o'qish maslahatini bering. " +
                        "50 so'zdan oshmasin.");
                notificationService.create(student.getId(), "ai_tip",
                        "AI Maslahat", tip);
                notificationService.sendEmailIfEnabled(student,
                        "AcademiXAI — Haftalik AI maslahat",
                        "Salom " + student.getFullName() + ",\n\n" + tip +
                        "\n\nPlatformaga kirish: https://academixai.uz");
            } catch (Exception e) {
                log.warn("Failed AI tip for student {}: {}", student.getId(), e.getMessage());
            }
        }
    }

    // 1st of each month at 09:00
    @Scheduled(cron = "0 0 9 1 * *")
    public void monthlySnapshots() {
        log.info("Running monthly progress snapshots...");
        List<User> students = userRepository.findByRole(Role.STUDENT);
        for (User student : students) {
            try {
                buildAndSaveSnapshot(student, "monthly");
                notifyParent(student, "monthly");
            } catch (Exception e) {
                log.warn("Failed monthly snapshot for student {}: {}", student.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public ProgressSnapshot buildAndSaveSnapshot(User student, String type) {
        Long sid = student.getId();
        LocalDateTime since = type.equals("weekly")
                ? LocalDateTime.now().minusWeeks(1)
                : LocalDateTime.now().minusMonths(1);

        List<ExamResult> results = examResultRepository.findByStudentId(sid);
        double avgScore = results.stream()
                .mapToInt(r -> r.getScore() != null ? r.getScore() : 0)
                .average().orElse(0.0);

        long chatCount = chatMessageRepository.countByUserId(sid);

        Map<String, Double> subjectScores = results.stream()
                .filter(r -> r.getLesson() != null && r.getLesson().getCourse() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getLesson().getCourse().getSubject(),
                        Collectors.averagingInt(r -> r.getScore() != null ? r.getScore() : 0)));

        String topSubject = subjectScores.entrySet().stream()
                .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
        String weakSubject = subjectScores.entrySet().stream()
                .min(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);

        Double sentimentAvg = sentimentLogRepository.avgSentimentSince(sid, since);
        double engagementScore = Math.min(100.0, chatCount * 2.0 + results.size() * 5.0);

        String narrative = generateNarrative(student.getFullName().split(" ")[0],
                avgScore, chatCount, topSubject, weakSubject, sentimentAvg, type);

        ProgressSnapshot snap = snapshotRepository.save(ProgressSnapshot.builder()
                .studentId(sid)
                .snapshotType(type)
                .avgScore(avgScore)
                .chatCount((int) chatCount)
                .topSubject(topSubject)
                .weakSubject(weakSubject)
                .engagementScore(engagementScore)
                .sentimentAvg(sentimentAvg)
                .aiNarrative(narrative)
                .build());

        notificationService.create(sid,
                type.equals("weekly") ? "weekly_report" : "monthly_report",
                type.equals("weekly") ? "Haftalik hisobot tayyor" : "Oylik hisobot tayyor",
                narrative);

        return snap;
    }

    private void notifyParent(User student, String type) {
        if (student.getParentId() == null) return;
        userRepository.findById(student.getParentId()).ifPresent(parent -> {
            ProgressSnapshot snap = snapshotRepository
                    .findTopByStudentIdAndSnapshotTypeOrderBySnapshotDateDesc(student.getId(), type)
                    .orElse(null);
            if (snap == null) return;

            String narrative = snap.getAiNarrative();
            notificationService.create(parent.getId(), "parent_report",
                    student.getFullName() + " — " + (type.equals("weekly") ? "Haftalik" : "Oylik") + " hisobot",
                    narrative);
            notificationService.sendEmailIfEnabled(parent,
                    "AcademiXAI — " + student.getFullName() + " hisoboti",
                    narrative);
        });
    }

    private String generateNarrative(String name, double avgScore, long chatCount,
                                      String topSubject, String weakSubject,
                                      Double sentimentAvg, String period) {
        try {
            String userPrompt = String.format(
                    "O'quvchi haqida qisqa (3-4 jumla) hisobot yozing. O'zbek tilida.\n" +
                    "Ism: %s, O'rtacha ball: %.0f%%, AI suhbatlar soni: %d,\n" +
                    "Eng yaxshi fan: %s, Eng qiyin fan: %s,\n" +
                    "Kayfiyat ko'rsatkichi: %.2f (-1 salbiy, 1 ijobiy).\n" +
                    "Hisobot ota-ona uchun, qisqa va rag'batlantiruvchi bo'lsin.",
                    name, avgScore, chatCount,
                    topSubject != null ? topSubject : "—",
                    weakSubject != null ? weakSubject : "—",
                    sentimentAvg != null ? sentimentAvg : 0.0);

            return aiService.chatWithSystem(
                    "Siz ta'lim analitikiisz. O'zbek tilida qisqa hisobot yozing.",
                    userPrompt);
        } catch (Exception e) {
            return String.format("%s bu hafta o'rtacha %.0f%% ball ko'rsatdi. AI bilan %d marta suhbatlashdi.",
                    name, avgScore, chatCount);
        }
    }
}
