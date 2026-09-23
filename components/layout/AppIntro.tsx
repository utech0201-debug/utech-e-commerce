"use client";

import { useEffect, useRef, useState } from "react";

function playIntroSound(context: AudioContext) {
  const now = context.currentTime;

  // UTECH Sonic Logo — concept 7:
  // calm piano-like tones + warm sustained pad + deep, full-bodied impact.
  // Designed to feel reassuring and premium while still arriving loudly.
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-16, now);
  compressor.knee.setValueAtTime(8, now);
  compressor.ratio.setValueAtTime(5.5, now);
  compressor.attack.setValueAtTime(0.008, now);
  compressor.release.setValueAtTime(0.4, now);

  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.28, now + 0.09);
  master.gain.setValueAtTime(1.28, now + 2.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 3.25);
  master.connect(compressor);
  compressor.connect(context.destination);

  // 1. Warm cinematic foundation — felt rather than heard.
  const bass = context.createOscillator();
  const bassGain = context.createGain();
  bass.type = "sine";
  bass.frequency.setValueAtTime(73.42, now);
  bass.frequency.exponentialRampToValueAtTime(55, now + 0.7);
  bassGain.gain.setValueAtTime(0.0001, now);
  bassGain.gain.exponentialRampToValueAtTime(0.72, now + 0.16);
  bassGain.gain.exponentialRampToValueAtTime(0.18, now + 1.5);
  bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.55);
  bass.connect(bassGain);
  bassGain.connect(master);
  bass.start(now);
  bass.stop(now + 2.62);

  // 2. Gentle "heart" pulse: soft low sine swell, not a drum hit.
  [0.05, 0.82].forEach((offset) => {
    const pulse = context.createOscillator();
    const gain = context.createGain();
    pulse.type = "sine";
    pulse.frequency.setValueAtTime(82, now + offset);
    pulse.frequency.exponentialRampToValueAtTime(64, now + offset + 0.42);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.32, now + offset + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.5);
    pulse.connect(gain);
    gain.connect(master);
    pulse.start(now + offset);
    pulse.stop(now + offset + 0.54);
  });

  // 3. Calm three-note identity: C -> G -> E.
  // Rounded triangle waves give a soft, almost bell/piano character.
  [
    { frequency: 261.63, start: 0.28, length: 0.78, level: 0.5 },
    { frequency: 392, start: 0.78, length: 0.9, level: 0.56 },
    { frequency: 329.63, start: 1.38, length: 1.15, level: 0.62 },
  ].forEach(({ frequency, start, length, level }) => {
    const tone = context.createOscillator();
    const harmonic = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    tone.type = "triangle";
    tone.frequency.setValueAtTime(frequency, now + start);
    harmonic.type = "sine";
    harmonic.frequency.setValueAtTime(frequency * 2, now + start);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, now + start);
    filter.frequency.exponentialRampToValueAtTime(3200, now + start + 0.45);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(level, now + start + 0.12);
    gain.gain.exponentialRampToValueAtTime(level * 0.48, now + start + length * 0.62);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);

    tone.connect(filter);
    harmonic.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    tone.start(now + start);
    harmonic.start(now + start);
    tone.stop(now + start + length + 0.04);
    harmonic.stop(now + start + length + 0.04);
  });

  // 4. Warm chord bed — creates the calming emotional lift.
  [
    { frequency: 261.63, level: 0.12 },
    { frequency: 329.63, level: 0.1 },
    { frequency: 392, level: 0.08 },
  ].forEach(({ frequency, level }) => {
    const pad = context.createOscillator();
    const padGain = context.createGain();
    const padFilter = context.createBiquadFilter();

    pad.type = "sine";
    pad.frequency.setValueAtTime(frequency, now + 1.05);
    padFilter.type = "lowpass";
    padFilter.frequency.setValueAtTime(900, now + 1.05);
    padFilter.frequency.exponentialRampToValueAtTime(2200, now + 2.15);

    padGain.gain.setValueAtTime(0.0001, now + 1.05);
    padGain.gain.exponentialRampToValueAtTime(level, now + 1.65);
    padGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.05);

    pad.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(master);
    pad.start(now + 1.05);
    pad.stop(now + 3.12);
  });

  // 5. Soft upper resolution — bright enough to cut through without becoming harsh.
  const upper = context.createOscillator();
  const upperGain = context.createGain();
  upper.type = "sine";
  upper.frequency.setValueAtTime(783.99, now + 1.88);
  upper.frequency.exponentialRampToValueAtTime(659.25, now + 2.72);
  upperGain.gain.setValueAtTime(0.0001, now + 1.88);
  upperGain.gain.exponentialRampToValueAtTime(0.16, now + 2.1);
  upperGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.02);
  upper.connect(upperGain);
  upperGain.connect(master);
  upper.start(now + 1.88);
  upper.stop(now + 3.08);
}

function speakBrandLine() {
  // Concept 7 intentionally has no spoken line.
}

export default function AppIntro() {
  const [visible, setVisible] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const seen = window.sessionStorage.getItem("utech-app-intro");
    if (seen) return;
    setVisible(true);

    const startIntro = async () => {
      if (playedRef.current) return false;
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }).webkitAudioContext;

        if (AudioContextClass) {
          const context =
            audioContextRef.current ?? new AudioContextClass();
          audioContextRef.current = context;

          if (context.state === "suspended") {
            try {
              await context.resume();
            } catch {}
          }

          if (context.state === "running") {
            playIntroSound(context);
            playedRef.current = true;
          }
        }
      } catch {}

      if (playedRef.current) {
        speakBrandLine();
        return true;
      }
      return false;
    };

    void startIntro();

    const unlockAudio = () => {
      if (!playedRef.current) void startIntro();
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      window.sessionStorage.setItem("utech-app-intro", "1");
    }, 3300);

    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.speechSynthesis?.cancel();

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
          <span>U</span><span>T</span><span>E</span><span>C</span><span>H</span>
        </div>
        <div className="utech-intro-tagline">SHOP WITH EASE</div>
        <div className="utech-intro-progress" aria-hidden="true"><span /></div>
      </div>

      <span className="sr-only">UTECH. Shop with ease.</span>
    </div>
  );
}
