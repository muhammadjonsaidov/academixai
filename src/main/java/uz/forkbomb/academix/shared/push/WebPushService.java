package uz.forkbomb.academix.shared.push;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import uz.forkbomb.academix.shared.repository.PushSubscriptionRepository;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebPushService {

    private final PushSubscriptionRepository pushSubscriptionRepository;

    @Value("${vapid.public-key:}")
    private String vapidPublicKey;

    @Value("${vapid.private-key:}")
    private String vapidPrivateKey;

    private PushService pushService;
    private boolean enabled = false;

    @PostConstruct
    void init() {
        if (vapidPublicKey.isBlank() || vapidPrivateKey.isBlank()) {
            log.info("VAPID keys not configured — Web Push disabled");
            return;
        }
        try {
            pushService = new PushService(vapidPublicKey, vapidPrivateKey);
            enabled = true;
            log.info("Web Push enabled with VAPID");
        } catch (Exception e) {
            log.warn("Web Push init failed: {}", e.getMessage());
        }
    }

    public String getPublicKey() {
        return vapidPublicKey;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void sendToUser(Long userId, String title, String body) {
        if (!enabled) return;
        List<uz.forkbomb.academix.shared.model.PushSubscription> subs =
                pushSubscriptionRepository.findByUserId(userId);
        String payload = "{\"title\":\"" + escapeJson(title) + "\",\"body\":\"" + escapeJson(body) + "\"}";
        for (var sub : subs) {
            send(sub, payload);
        }
    }

    private void send(uz.forkbomb.academix.shared.model.PushSubscription sub, String payload) {
        try {
            Subscription subscription = new Subscription(
                    sub.getEndpoint(),
                    new Subscription.Keys(sub.getP256dh(), sub.getAuth())
            );
            Notification notification = new Notification(subscription, payload);
            pushService.send(notification);
        } catch (Exception e) {
            log.warn("Push send failed for endpoint {}: {}", sub.getEndpoint(), e.getMessage());
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }
}
