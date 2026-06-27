// Custom service worker (injectManifest strategy — see vite.config.ts). Precaches the build like
// the old generateSW output did, and adds the push handlers generateSW has no hook point for.
/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "FinanceTracker";
  const options: NotificationOptions = {
    body: data.body ?? "",
    icon: "/icon-192-v2.png",
    badge: "/icon-192-v2.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => "focus" in c);
      if (existing) return existing.focus();
      return self.clients.openWindow("/");
    })
  );
});
