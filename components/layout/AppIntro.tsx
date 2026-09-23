"use client";

import { useEffect, useRef, useState } from "react";

function playIntroSound(context: AudioContext) {
  const now = context.currentTime;

  // UTECH Sonic Logo — concept 8:
  // warm cinematic bloom + human-feeling chord movement + memorable melodic hook.
  // The goal is calm at the core, but unmistakably alive and full-bodied.
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-18, now);
  compressor.knee.setValueAtTime(10, now);
  compressor.ratio.setValueAtTime(4.5, now);
  compressor.attack.setValueAtTime(0.006, now);
  compressor.release.setValueAtTime(0.34, now);

  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.42, now + 0.08);
  master.gain.setValueAtTime(1.42, now + 2.72);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 3.45);
  master.connect(compressor);
  compressor.connect(context.destination);

  // 1. Big warm opening bloom — felt immediately, without a harsh "boom".
  const bloom = context.createOscillator();
  const bloom2 = context.createOscillator();
  const bloomGain = context.createGain();
  bloom.type = "sine";
  bloom2.type = "triangle";
  bloom.frequency.setValueAtTime(49, now);
  bloom.frequency.exponentialRampToValueAtTime(73.42, now + 0.52);
  bloom2.frequency.setValueAtTime(98, now);
  bloom2.frequency.exponentialRampToValueAtTime(146.83, now + 0.58);
  bloomGain.gain.setValueAtTime(0.0001, now);
  bloomGain.gain.exponentialRampToValueAtTime(0.72, now + 0.14);
  bloomGain.gain.exponentialRampToValueAtTime(0.16, now + 1.55);
  bloomGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
  bloom.connect(bloomGain);
  bloom2.connect(bloomGain);
  bloomGain.connect(master);
  bloom.start(now);
  bloom2.start(now);
  bloom.stop(now + 2.58);
  bloom2.stop(now + 2.58);

  // 2. Soft "breath" layer — a filtered swell that gives the ident a human warmth.
  const breath = context.createOscillator();
  const breathFilter = context.createBiquadFilter();
  const breathGain = context.createGain();
  breath.type = "sawtooth";
  breath.frequency.setValueAtTime(174.61, now + 0.18);
  breath.frequency.exponentialRampToValueAtTime(261.63, now + 1.18);
  breathFilter.type = "lowpass";
  breathFilter.frequency.setValueAtTime(480, now + 0.18);
  breathFilter.frequency.exponentialRampToValueAtTime(1800, now + 1.15);
  breathGain.gain.setValueAtTime(0.0001, now + 0.18);
  breathGain.gain.exponentialRampToValueAtTime(0.12, now + 0.62);
  breathGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.48);
  breath.connect(breathFilter);
  breathFilter.connect(breathGain);
  breathGain.connect(master);
  breath.start(now + 0.18);
  breath.stop(now + 1.55);

  // 3. Signature melody — C -> E -> G -> E, with the last E held.
  // Two detuned voices make it feel richer and less like a plain oscillator.
  [
    { frequency: 261.63, start: 0.34, length: 0.48, level: 0.52 },
    { frequency: 329.63, start: 0.72, length: 0.52, level: 0.58 },
    { frequency: 392, start: 1.12, length: 0.66, level: 0.64 },
    { frequency: 329.63, start: 1.58, length: 1.2, level: 0.72 },
  ].forEach(({ frequency, start, length, level }) => {
    const lead = context.createOscillator();
    const voice = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    lead.type = "triangle";
    voice.type = "sine";
    lead.frequency.setValueAtTime(frequency, now + start);
    voice.frequency.setValueAtTime(frequency * 1.003, now + start);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, now + start);
    filter.frequency.exponentialRampToValueAtTime(3600, now + start + 0.2);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(level, now + start + 0.07);
    gain.gain.exponentialRampToValueAtTime(level * 0.42, now + start + length * 0.62);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);

    lead.connect(filter);
    voice.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    lead.start(now + start);
    voice.start(now + start);
    lead.stop(now + start + length + 0.03);
    voice.stop(now + start + length + 0.03);
  });

  // 4. Emotional chord bloom — C major opens underneath the final hook.
  [
    { frequency: 130.81, level: 0.18 },
    { frequency: 261.63, level: 0.13 },
    { frequency: 329.63, level: 0.12 },
    { frequency: 392, level: 0.1 },
  ].forEach(({ frequency, level }, index) => {
    const pad = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const start = 1.18 + index * 0.025;

    pad.type = "sine";
    pad.frequency.setValueAtTime(frequency, now + start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, now + start);
    filter.frequency.exponentialRampToValueAtTime(2600, now + 2.1);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(level, now + 1.72);
    gain.gain.exponentialRampToValueAtTime(level * 0.62, now + 2.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.28);

    pad.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    pad.start(now + start);
    pad.stop(now + 3.34);
  });

  // 5. Airy high resolution — the moment the logo "opens up".
  const shimmer = context.createOscillator();
  const shimmerGain = context.createGain();
  const shimmerFilter = context.createBiquadFilter();
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(659.25, now + 2.08);
  shimmer.frequency.exponentialRampToValueAtTime(1046.5, now + 2.72);
  shimmerFilter.type = "lowpass";
  shimmerFilter.frequency.setValueAtTime(2200, now + 2.08);
  shimmerFilter.frequency.exponentialRampToValueAtTime(5200, now + 2.72);
  shimmerGain.gain.setValueAtTime(0.0001, now + 2.08);
  shimmerGain.gain.exponentialRampToValueAtTime(0.2, now + 2.42);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.18);
  shimmer.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerGain.connect(master);
  shimmer.start(now + 2.08);
  shimmer.stop(now + 3.24);

  // 6. Final soft "lock" — a short upper harmonic gives the brand a clean ending.
  const lock = context.createOscillator();
  const lockGain = context.createGain();
  lock.type = "triangle";
  lock.frequency.setValueAtTime(783.99, now + 2.72);
  lock.frequency.exponentialRampToValueAtTime(659.25, now + 3.18);
  lockGain.gain.setValueAtTime(0.0001, now + 2.72);
  lockGain.gain.exponentialRampToValueAtTime(0.22, now + 2.84);
  lockGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
  lock.connect(lockGain);
  lockGain.connect(master);
  lock.start(now + 2.72);
  lock.stop(now + 3.46);
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
    }, 3500);

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
