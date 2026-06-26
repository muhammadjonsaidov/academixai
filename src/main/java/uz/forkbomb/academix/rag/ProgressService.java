package uz.forkbomb.academix.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.shared.model.*;
import uz.forkbomb.academix.shared.model.enums.Role;
import uz.forkbomb.academix.shared.repository.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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
    private final ChatModel chatModel;

    // Every Sunday at 20:00
    @Scheduled(cron = "0 0 20 * * SUN")
    public void weeklySnapshots() {
        log.info("Running weekly progress snapshots...");
        List<User> students = userRepository.findByRole(Role.STUDENT);
        for (User student : students) {
            try {
                buildAndSaveSnapshot(student, "weekly");
            } catch (Exception e) {
                log.warn("Failed weekly snapshot for student {}: {}", student.getId(), e.getMessage());
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

        // compute subject breakdown
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

        // In-app notification for student
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
            notificationService.sendEmail(parent.getEmail(),
                    "AcademiXAI — " + student.getFullName() + " hisoboti",
                    narrative);
        });
    }

    private String generateNarrative(String name, double avgScore, long chatCount,
                                      String topSubject, String weakSubject,
                                      Double sentimentAvg, String period) {
        try {
            String prompt = String.format("""
                    O'quvchi haqida qisqa (3-4 jumla) hisobot yozing. O'zbek tilida.
                    Ism: %s, O'rtacha ball: %.0f%%, AI suhbatlar soni: %d,
                    Eng yaxshi fan: %s, Eng qiyin fan: %s,
                    Kayfiyat ko'rsatkichi: %.2f (-1 salbiy, 1 ijobiy).
                    Hisobot ota-ona uchun, qisqa va rag'batlantiruvchi bo'lsin.
                    """, name, avgScore, chatCount,
                    topSubject != null ? topSubject : "—",
                    weakSubject != null ? weakSubject : "—",
                    sentimentAvg != null ? sentimentAvg : 0.0);

            return ChatClient.builder(chatModel).build()
                    .prompt()
                    .system("Siz ta'lim analitikiisz. O'zbek tilida qisqa hisobot yozing.")
                    .user(prompt)
                    .call()
                    .content();
        } catch (Exception e) {
            return String.format("%s bu hafta o'rtacha %.0f%% ball ko'rsatdi. AI bilan %d marta suhbatlashdi.",
                    name, avgScore, chatCount);
        }
    }
}
