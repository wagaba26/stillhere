"use client";

import { useState } from "react";
import { clearDemoContinuityState } from "@/lib/indexed-db";
import { clearAttestationSnapshot } from "@/lib/preferences";

export function DemoResetControl() {
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  async function resetDemo() {
    setResetting(true);
    setError("");
    try {
      await clearDemoContinuityState();
      clearAttestationSnapshot(window.localStorage);
      window.location.assign("/assessment");
    } catch {
      setResetting(false);
      setError("Reset could not finish. Your existing demo data was left in place.");
    }
  }

  return (
    <div className="demo-reset">
      <strong>Demo controls</strong>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)}>
          Reset demo
        </button>
      ) : (
        <div className="demo-reset-confirm" role="group" aria-label="Confirm demo reset">
          <span>Remove this device&apos;s StillHere demo ledger, Passport, draft, and receipts?</span>
          <div>
            <button type="button" onClick={() => void resetDemo()} disabled={resetting}>
              {resetting ? "Resetting…" : "Confirm reset"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={resetting}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <small>Low Data and browser caches are preserved.</small>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
