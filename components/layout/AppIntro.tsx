"use client";

import { useEffect, useRef, useState } from "react";

function playIntroSound(context: AudioContext) {
  const now = context.currentTime;

  // UTECH Sonic Logo — concept 5:
  // digital glass ping -> two-note identity -> harmonic bloom -> clean hardware-like tail.
  // Intentionally different from the rhythmic pulse/signature approach of concepts 1–4.
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-18, now);
  compressor.knee.setValueAtTime(8, now);
  compressor.ratio.setValueAtTime(6, now);
  compressor.attack.setValueAtTime(0.004, now);
  compressor.release.setValueAtTime(0.28, now);

  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.08, now + 0.018);
  master.gain.setValueAtTime(1.08, now + 2.18);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.75);
  master.connect(compressor);
  compressor.connect(context.destination);

  // 1. Tiny sub pulse: a restrained hardware-power-on foundation.
  const sub = context.createOscillator();
  const subGain = context.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(58, now);
  sub.frequency.exponentialRampToValueAtTime(42, now + 0.26);
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.5, now + 0.018);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  sub.connect(subGain);
  subGain.connect(master);
  sub.start(now);
  sub.stop(now + 0.34);

  // 2. Glass-like pluck: short, bright, and recognizable.
  const pluck = context.createOscillator();
  const pluckGain = context.createGain();
  const pluckFilter = context.createBiquadFilter();
  pluck.type = "sine";
  pluck.frequency.setValueAtTime(1046.5, now + 0.07);
  pluck.frequency.exponentialRampToValueAtTime(1318.51, now + 0.18);
  pluckFilter.type = "highpass";
  pluckFilter.frequency.setValueAtTime(650, now + 0.07);
  pluckGain.gain.setValueAtTime(0.0001, now + 0.07);
  pluckGain.gain.exponentialRampToValueAtTime(0.42, now + 0.085);
  pluckGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
  pluck.connect(pluckFilter);
  pluckFilter.connect(pluckGain);
  pluckGain.connect(master);
  pluck.start(now + 0.07);
  pluck.stop(now + 0.5);

  // 3. Two-note identity: D -> A, with a tiny gap for memorability.
  [
    { frequency: 587.33, start: 0.42, length: 0.34, level: 0.42 },
    { frequency: 880, start: 0.73, length: 0.52, level: 0.5 },
  ].forEach(({ frequency, start, length, level }) => {
    const tone = context.createOscillator();
    const harmonic = context.createOscillator();
    const gain = context.createGain();

    tone.type = "sine";
    tone.frequency.setValueAtTime(frequency, now + start);
    harmonic.type = "triangle";
    harmonic.frequency.setValueAtTime(frequency * 2, now + start);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(level, now + start + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);

    tone.connect(gain);
    harmonic.connect(gain);
    gain.connect(master);
    tone.start(now + start);
    harmonic.start(now + start);
    tone.stop(now + start + length + 0.03);
    harmonic.stop(now + start + length + 0.03);
  });

  // 4. Harmonic bloom: a warm major-color chord that makes the logo feel finished.
  const chord = [
    { frequency: 440, level: 0.16 },
    { frequency: 554.37, level: 0.13 },
    { frequency: 659.25, level: 0.11 },
  ];

  chord.forEach(({ frequency, level }) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, now + 1.02);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, now + 1.02);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 1.45);

    gain.gain.setValueAtTime(0.0001, now + 1.02);
    gain.gain.exponentialRampToValueAtTime(level, now + 1.22);
    gain.gain.exponentialRampToValueAtTime(level * 0.62, now + 2.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.58);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(now + 1.02);
    osc.stop(now + 2.62);
  });

  // 5. Crisp reverse-like sweep into the final lock.
  const sweep = context.createOscillator();
  const sweepGain = context.createGain();
  const sweepFilter = context.createBiquadFilter();
  sweep.type = "sawtooth";
  sweep.frequency.setValueAtTime(1600, now + 1.68);
  sweep.frequency.exponentialRampToValueAtTime(420, now + 2.08);
  sweepFilter.type = "lowpass";
  sweepFilter.frequency.setValueAtTime(5000, now + 1.68);
  sweepFilter.frequency.exponentialRampToValueAtTime(900, now + 2.08);
  sweepGain.gain.setValueAtTime(0.0001, now + 1.68);
  sweepGain.gain.exponentialRampToValueAtTime(0.1, now + 1.82);
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.12);
  sweep.connect(sweepFilter);
  sweepFilter.connect(sweepGain);
  sweepGain.connect(master);
  sweep.start(now + 1.68);
  sweep.stop(now + 2.16);

  // 6. Final high harmonic: clean, subtle, not a sparkle.
  const final = context.createOscillator();
  const finalGain = context.createGain();
  final.type = "sine";
  final.frequency.setValueAtTime(1318.51, now + 2.02);
  final.frequency.exponentialRampToValueAtTime(1174.66, now + 2.54);
  finalGain.gain.setValueAtTime(0.0001, now + 2.02);
  finalGain.gain.exponentialRampToValueAtTime(0.18, now + 2.12);
  finalGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.68);
  final.connect(finalGain);
  finalGain.connect(master);
  final.start(now + 2.02);
  final.stop(now + 2.72);
}

function speakBrandLine() {
  // Concept 5 intentionally has no spoken line.
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
              // Retry through the first normal user interaction.
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

      <span className="sr-only">UTECH. Shop with ease.</span>
    </div>
  );
}
