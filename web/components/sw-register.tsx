"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (isLocalPreview) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {
            // ignore cleanup failures during local preview
          });
        });
      });
      return;
    }
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => {
      // ignore registration failures in development and unsupported environments
    });
  }, []);

  return null;
}
