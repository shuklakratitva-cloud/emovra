// public/sw.js - built via vite-plugin-pwa's 'injectManifest' strategy
// (see vite.config.js). precacheAndRoute below is required for that
// strategy to build at all - it wires up the Workbox precache list Vite
// injects at build time. Everything past that is unchanged: this worker
// exists to receive push events and show a notification, not for a full
// offline experience.
import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

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
