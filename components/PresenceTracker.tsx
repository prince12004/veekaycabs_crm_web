"use client";

import { useEffect, useRef, useState } from "react";
import { presenceApi } from "@/lib/api";
import { logout } from "@/lib/auth";

// Must match IDLE_LOGOUT_MINUTES in crm/server services/assignmentService.js.
const IDLE_LOGOUT_MS = 5 * 60 * 1000;
const WARN_BEFORE_MS = 60 * 1000;
const HEARTBEAT_MS = 30 * 1000;
const ACTIVITY_KEY = "crm_last_activity";
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;

// Shared across tabs, so using the CRM in one tab keeps the others signed in.
const readLastActivity = () => Number(localStorage.getItem(ACTIVITY_KEY)) || Date.now();

// Salesperson-only: reports activity to the server and signs out after
// IDLE_LOGOUT_MS without any mouse, keyboard or touch input.
export default function PresenceTracker() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastSentRef = useRef(0);
  const signingOut = useRef(false);

  useEffect(() => {
    const markActive = () => {
      const now = Date.now();
      // Writing on every mousemove is wasteful; once a second is plenty.
      if (now - readLastActivity() > 1000) localStorage.setItem(ACTIVITY_KEY, String(now));
    };
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    document.addEventListener("visibilitychange", markActive);

    const sendHeartbeat = () => {
      const active = readLastActivity() > lastSentRef.current;
      lastSentRef.current = Date.now();
      presenceApi.heartbeat(active).catch(() => {});
    };
    sendHeartbeat();
    const heartbeat = setInterval(sendHeartbeat, HEARTBEAT_MS);

    const idleCheck = setInterval(() => {
      const idle = Date.now() - readLastActivity();
      if (idle >= IDLE_LOGOUT_MS) {
        if (!signingOut.current) {
          signingOut.current = true;
          logout("inactive");
        }
      } else if (idle >= IDLE_LOGOUT_MS - WARN_BEFORE_MS) {
        setSecondsLeft(Math.ceil((IDLE_LOGOUT_MS - idle) / 1000));
      } else {
        setSecondsLeft(null);
      }
    }, 1000);

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, markActive));
      document.removeEventListener("visibilitychange", markActive);
      clearInterval(heartbeat);
      clearInterval(idleCheck);
    };
  }, []);

  if (secondsLeft === null) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div role="alertdialog" aria-labelledby="idle-title" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <h3 id="idle-title" className="text-lg font-black text-[#191b23]">Are you still there?</h3>
        <p className="mt-2 text-sm leading-6 text-[#747987]">
          You&apos;ll be signed out in <span className="font-bold text-[#dc4e1b]">{secondsLeft}s</span> and your uncontacted leads will go to an available teammate.
        </p>
        <button
          onClick={() => { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); setSecondsLeft(null); }}
          className="mt-5 w-full rounded-xl bg-[#f15a24] py-3 text-sm font-bold text-white transition hover:bg-[#dd4e1b]"
        >
          I&apos;m here
        </button>
      </div>
    </div>
  );
}
