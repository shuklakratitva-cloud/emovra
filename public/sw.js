// public/sw.js - minimal service worker, exists ONLY to receive push
// events and show a notification. Does not do offline caching (that's a
// separate, bigger feature - deferred).

self.addEventListener("push", (event) => {
  let data = { title: "Emovra", body: "You have a new notification." };
  try {
    if (event.data) data = event.data.json();
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/emovra-logo.png",
      badge: "/emovra-logo.png",
      data: { url: data.url || "/app" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/app";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
