package uz.forkbomb.academix.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.forkbomb.academix.shared.model.AcademixNotification;
import uz.forkbomb.academix.shared.model.User;
import uz.forkbomb.academix.shared.push.WebPushService;
import uz.forkbomb.academix.shared.repository.NotificationRepository;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;
    private final WebPushService webPushService;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Transactional
    public AcademixNotification create(Long userId, String type, String title, String body) {
        AcademixNotification saved = notificationRepository.save(AcademixNotification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .isRead(false)
                .build());
        webPushService.sendToUser(userId, title, body);
        return saved;
    }

    public void sendEmailIfEnabled(User user, String subject, String text) {
        if (Boolean.TRUE.equals(user.getEmailNotif())) {
            sendEmail(user.getEmail(), subject, text);
        }
    }

    public void sendEmail(String toEmail, String subject, String text) {
        if (mailFrom == null || mailFrom.isBlank()) {
            log.info("Mail not configured — skipping email to {}: {}", toEmail, subject);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(mailFrom);
            msg.setTo(toEmail);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
            log.info("Email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Email send failed to {}: {}", toEmail, e.getMessage());
        }
    }
}
