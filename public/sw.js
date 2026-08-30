// Randap push notification service worker

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }

  const title = data.title || "Randap";
  const tag = "randap-msg-" + (data.from_username || "x");

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const isFocused = clientsList.some((c) => c.focused);

      if (isFocused) {
        // App is already open and focused: skip the OS notification, show an in-app toast instead.
        clientsList.forEach((c) => c.postMessage({ type: "randap-in-app-notify", payload: data }));
        return;
      }

      await self.registration.showNotification(title, {
        body: data.body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag,
        data: { url: data.url || "/" },
      });

      clientsList.forEach((c) => c.postMessage({ type: "randap-play-sound" }));

      setTimeout(async () => {
        const notifs = await self.registration.getNotifications({ tag });
        notifs.forEach((n) => n.close());
      }, 5000);
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of allClients) {
        if ("focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })()
  );
});
