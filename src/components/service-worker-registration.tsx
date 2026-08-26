"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Development chunks use stable URLs; caching them breaks HMR and can leave
    // visible HTML wired to stale client handlers. Offline caching is production-only.
    if (process.env.NODE_ENV !== "production") return;
    if (
      "serviceWorker" in navigator &&
      (location.protocol === "https:" || location.hostname === "localhost")
    ) {
      void navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    }
  }, []);

  return null;
}
