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
    master.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);
    master.connect(audio.destination);

    const sweep = audio.createOscillator();
    const sweepGain = audio.createGain();
    const filter = audio.createBiquadFilter();

    sweep.type = "sine";
    sweep.frequency.setValueAtTime(90, now);
    sweep.frequency.exponentialRampToValueAtTime(900, now + 0.72);
    sweepGain.gain.setValueAtTime(0.0001, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.055, now + 0.38);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + 0.75);

    sweep.connect(filter);
    filter.connect(sweepGain);
    sweepGain.connect(master);
    sweep.start(now);
    sweep.stop(now + 0.9);

    const notes = [
      { frequency: 261.63, start: 0.42, duration: 0.48 },
      { frequency: 329.63, start: 0.64, duration: 0.52 },
      { frequency: 523.25, start: 0.9, duration: 0.7 },
    ];

    notes.forEach(({ frequency, start, duration }) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.16, now + start + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now + start);
      oscillator.stop(now + start + duration + 0.04);
    });

    const sparkle = audio.createOscillator();
    const sparkleGain = audio.createGain();
    sparkle.type = "sine";
    sparkle.frequency.setValueAtTime(1046.5, now + 1.15);
    sparkleGain.gain.setValueAtTime(0.0001, now + 1.15);
    sparkleGain.gain.exponentialRampToValueAtTime(0.045, now + 1.18);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.48);
    sparkle.connect(sparkleGain);
    sparkleGain.connect(master);
    sparkle.start(now + 1.15);
    sparkle.stop(now + 1.52);

    if (!context) {
      window.setTimeout(() => void audio.close(), 1900);
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
