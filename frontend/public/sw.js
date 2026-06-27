self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'AcademiXAI', body: 'Yangi bildirishnoma' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'AcademiXAI', {
      body: data.body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
