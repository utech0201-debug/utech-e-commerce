"use client";

import { useEffect, useRef, useState } from "react";

function playIntroSound(context?: AudioContext) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const audio = context ?? new AudioContextClass();
    const now = audio.currentTime;

    const master = audio.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.16, now + 0.08);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
    master.connect(audio.destination);

    const frequencies = [146.83, 220, 293.66, 440, 587.33];
    frequencies.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = now + index * 0.12;

      oscillator.type = index < 2 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.02, start + 0.8);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.42 / (index + 1), start + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.05);

      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 1.1);
    });

    if (!context) {
      window.setTimeout(() => void audio.close(), 1600);
    }
  } catch {
    // Audio is optional and never blocks the visual intro.
  }
}

export default function AppIntro() {
  const [visible, setVisible] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    const seen = window.sessionStorage.getItem("utech-app-intro");
    if (seen) return;

    setVisible(true);

    const unlockAndPlay = () => {
      if (soundPlayedRef.current) return;

      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) return;

        const context =
          audioContextRef.current ?? new AudioContextClass();

        audioContextRef.current = context;

        const startSound = () => {
          if (soundPlayedRef.current) return;
          soundPlayedRef.current = true;
          playIntroSound(context);
        };

        if (context.state === "suspended") {
          void context.resume().then(startSound);
        } else {
          startSound();
        }
      } catch {
        // Keep the intro usable when audio is unavailable.
      }
    };

    const handleInteraction = () => unlockAndPlay();

    window.addEventListener("pointerdown", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });

    // Try immediately; browsers that allow it will play without interaction.
    unlockAndPlay();

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      window.sessionStorage.setItem("utech-app-intro", "1");
    }, 3000);

    return () => {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.clearTimeout(hideTimer);
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="utech-app-intro" role="status" aria-label="Opening UTECH">
      <div className="utech-intro-grid" aria-hidden="true" />
      <div className="utech-intro-orbit utech-intro-orbit-one" aria-hidden="true" />
      <div className="utech-intro-orbit utech-intro-orbit-two" aria-hidden="true" />
      <div className="utech-intro-node utech-intro-node-one" aria-hidden="true" />
      <div className="utech-intro-node utech-intro-node-two" aria-hidden="true" />
      <div className="utech-intro-node utech-intro-node-three" aria-hidden="true" />

      <div className="utech-intro-core">
        <div className="utech-intro-kicker">THE MARKETPLACE</div>
        <div className="utech-intro-word" aria-hidden="true">
          <span>U</span>
          <span>T</span>
          <span>E</span>
          <span>C</span>
          <span>H</span>
        </div>
        <div className="utech-intro-tagline">DISCOVER · BUILD · CONNECT</div>
        <div className="utech-intro-progress" aria-hidden="true">
          <span />
        </div>
      </div>

      <span className="sr-only">Opening UTECH Marketplace</span>
    </div>
  );
}
