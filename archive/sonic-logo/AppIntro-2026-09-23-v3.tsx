"use client";

import { useEffect, useRef, useState } from "react";

function playIntroSound(context: AudioContext) {
  const now = context.currentTime;

  // UTECH Sonic Logo — concept 3:
  // a different direction: cinematic pulse -> rhythmic ticks -> airy sweep -> clean signature chime.
  // No spoken line. Designed to feel modern, confident and instantly recognizable.
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-22, now);
  compressor.knee.setValueAtTime(5, now);
  compressor.ratio.setValueAtTime(10, now);
  compressor.attack.setValueAtTime(0.002, now);
  compressor.release.setValueAtTime(0.28, now);

  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.18, now + 0.035);
  master.gain.setValueAtTime(1.18, now + 2.42);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);
  master.connect(compressor);
  compressor.connect(context.destination);

  // 1. Cinematic pulse — short, wide and physical.
  const pulse = context.createOscillator();
  const pulseGain = context.createGain();
  pulse.type = "sine";
  pulse.frequency.setValueAtTime(72, now);
  pulse.frequency.exponentialRampToValueAtTime(38, now + 0.5);
  pulseGain.gain.setValueAtTime(0.0001, now);
  pulseGain.gain.exponentialRampToValueAtTime(0.95, now + 0.015);
  pulseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
  pulse.connect(pulseGain);
  pulseGain.connect(master);
  pulse.start(now);
  pulse.stop(now + 0.62);

  // 2. Rhythmic digital ticks — a subtle mechanical identity.
  [0.16, 0.29, 0.43].forEach((offset, index) => {
    const tick = context.createOscillator();
    const tickGain = context.createGain();
    tick.type = "square";
    tick.frequency.setValueAtTime(1500 + index * 420, now + offset);
    tickGain.gain.setValueAtTime(0.0001, now + offset);
    tickGain.gain.exponentialRampToValueAtTime(0.12 + index * 0.025, now + offset + 0.006);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.075);
    tick.connect(tickGain);
    tickGain.connect(master);
    tick.start(now + offset);
    tick.stop(now + offset + 0.09);
  });

  // 3. Airy upward sweep — creates the transition into the brand reveal.
  const sweep = context.createOscillator();
  const sweepGain = context.createGain();
  const sweepFilter = context.createBiquadFilter();
  sweep.type = "sawtooth";
  sweep.frequency.setValueAtTime(180, now + 0.48);
  sweep.frequency.exponentialRampToValueAtTime(980, now + 1.28);
  sweepFilter.type = "lowpass";
  sweepFilter.frequency.setValueAtTime(700, now + 0.48);
  sweepFilter.frequency.exponentialRampToValueAtTime(5200, now + 1.28);
  sweepGain.gain.setValueAtTime(0.0001, now + 0.48);
  sweepGain.gain.exponentialRampToValueAtTime(0.18, now + 0.92);
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.38);
  sweep.connect(sweepFilter);
  sweepFilter.connect(sweepGain);
  sweepGain.connect(master);
  sweep.start(now + 0.48);
  sweep.stop(now + 1.45);

  // 4. Clean UTECH signature: two bright notes followed by a resolving third.
  const signature = [
    { frequency: 392, start: 1.22, length: 0.32, level: 0.42 },
    { frequency: 523.25, start: 1.48, length: 0.34, level: 0.48 },
    { frequency: 783.99, start: 1.78, length: 0.72, level: 0.54 },
  ];

  signature.forEach(({ frequency, start, length, level }) => {
    const tone = context.createOscillator();
    const overtone = context.createOscillator();
    const gain = context.createGain();

    tone.type = "triangle";
    tone.frequency.setValueAtTime(frequency, now + start);

    overtone.type = "sine";
    overtone.frequency.setValueAtTime(frequency * 2, now + start);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(level, now + start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);

    tone.connect(gain);
    overtone.connect(gain);
    gain.connect(master);

    tone.start(now + start);
    overtone.start(now + start);
    tone.stop(now + start + length + 0.03);
    overtone.stop(now + start + length + 0.03);
  });

  // 5. Final brand resolve — warm chord + tiny high-end glint.
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const resolve = context.createOscillator();
    const resolveGain = context.createGain();
    resolve.type = "sine";
    resolve.frequency.setValueAtTime(frequency, now + 2.02);
    resolveGain.gain.setValueAtTime(0.0001, now + 2.02);
    resolveGain.gain.exponentialRampToValueAtTime(0.28 - index * 0.035, now + 2.08);
    resolveGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.68);
    resolve.connect(resolveGain);
    resolveGain.connect(master);
    resolve.start(now + 2.02);
    resolve.stop(now + 2.72);
  });

  const glint = context.createOscillator();
  const glintGain = context.createGain();
  glint.type = "sine";
  glint.frequency.setValueAtTime(1568, now + 2.32);
  glint.frequency.exponentialRampToValueAtTime(3136, now + 2.58);
  glintGain.gain.setValueAtTime(0.0001, now + 2.32);
  glintGain.gain.exponentialRampToValueAtTime(0.24, now + 2.4);
  glintGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.88);
  glint.connect(glintGain);
  glintGain.connect(master);
  glint.start(now + 2.32);
  glint.stop(now + 2.9);
}
function speakBrandLine() {
  // Concept 3 intentionally has no spoken brand line.
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
            } catch {
              // Audible autoplay can be blocked until the browser receives
              // a user gesture. The fallback listener below retries silently.
            }
          }

          if (context.state === "running") {
            playIntroSound(context);
            playedRef.current = true;
          }
        }
      } catch {
        // Keep the visual intro usable if audio is unavailable.
      }

      if (playedRef.current) {
        speakBrandLine();
        return true;
      }

      return false;
    };

    // Try immediately. When the browser allows audible autoplay, there is
    // no interaction at all. If the browser blocks it, the first normal
    // interaction with the page transparently unlocks the same intro sound.
    void startIntro();

    const unlockAudio = () => {
      if (playedRef.current) return;
      void startIntro();
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      window.sessionStorage.setItem("utech-app-intro", "1");
    }, 3000);

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
      <div
        className="utech-intro-orbit utech-intro-orbit-one"
        aria-hidden="true"
      />
      <div
        className="utech-intro-orbit utech-intro-orbit-two"
        aria-hidden="true"
      />
      <div
        className="utech-intro-node utech-intro-node-one"
        aria-hidden="true"
      />
      <div
        className="utech-intro-node utech-intro-node-two"
        aria-hidden="true"
      />
      <div
        className="utech-intro-node utech-intro-node-three"
        aria-hidden="true"
      />

      <div className="utech-intro-core">
        <div className="utech-intro-kicker">THE MARKETPLACE</div>
        <div className="utech-intro-word" aria-hidden="true">
          <span>U</span>
          <span>T</span>
          <span>E</span>
          <span>C</span>
          <span>H</span>
        </div>
        <div className="utech-intro-tagline">SHOP WITH EASE</div>
        <div className="utech-intro-progress" aria-hidden="true">
          <span />
        </div>
      </div>

      <span className="sr-only">
        UTECH. Shop with ease.
      </span>
    </div>
  );
}
