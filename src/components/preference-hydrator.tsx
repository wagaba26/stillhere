"use client";

import { useEffect } from "react";
import { readLowDataPreference } from "@/lib/preferences";

export function PreferenceHydrator() {
  useEffect(() => {
    document.documentElement.dataset.lowData = String(
      readLowDataPreference(window.localStorage),
    );
  }, []);

  return null;
}
