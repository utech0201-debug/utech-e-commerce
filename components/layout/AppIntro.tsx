"use client";

import { useEffect, useRef, useState } from "react";

function playIntroSound(context: AudioContext) {
  const now = context.currentTime;

  // UTECH Sonic Logo — concept 6:
  // iconic low hit -> fast three-note hook -> wide tonal lift -> confident final lock.
  // Built to feel like a real brand ident rather than a collection of sound effects.
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-19, now);
  compressor.knee.setValueAtTime(5, now);
  compressor.ratio.setValueAtTime(7, now);
  compressor.attack.setValueAtTime(0.003, now);
  compressor.release.setValueAtTime(0.24, now);

  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.16, now + 0.025);
  master.gain.setValueAtTime(1.16, now + 2.15);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.65);
  master.connect(compressor);
  compressor.connect(context.destination);

  // 1. Branded low-frequency hit.
  const hit = context.createOscillator();
  const hitGain = context.createGain();
  hit.type = "sine";
  hit.frequency.setValueAtTime(96, now);
  hit.frequency.exponentialRampToValueAtTime(48, now + 0.22);
  hitGain.gain.setValueAtTime(0.0001, now);
  hitGain.gain.exponentialRampToValueAtTime(0.78, now + 0.012);
  hitGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
  hit.connect(hitGain);
  hitGain.connect(master);
  hit.start(now);
  hit.stop(now + 0.38);

  // 2. The hook: A -> C# -> E, deliberately tight and memorable.
  [
    { frequency: 440, start: 0.12, length: 0.22, level: 0.48 },
    { frequency: 554.37, start: 0.29, length: 0.25, level: 0.5 },
    { frequency: 659.25, start: 0.49, length: 0.46, level: 0.62 },
  ].forEach(({ frequency, start, length, level }) => {
    const osc = context.createOscillator();
    const harmonic = context.createOscillator();
    const gain = context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now + start);
    harmonic.type = "triangle";
    harmonic.frequency.setValueAtTime(frequency * 2, now + start);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(level, now + start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);

    osc.connect(gain);
    harmonic.connect(gain);
    gain.connect(master);
    osc.start(now + start);
    harmonic.start(now + start);
    osc.stop(now + start + length + 0.03);
    harmonic.stop(now + start + length + 0.03);
  });

  // 3. A smooth lift underneath the hook.
  const lift = context.createOscillator();
  const liftGain = context.createGain();
  const liftFilter = context.createBiquadFilter();
  lift.type = "triangle";
  lift.frequency.setValueAtTime(174.61, now + 0.45);
  lift.frequency.exponentialRampToValueAtTime(349.23, now + 1.32);
  liftFilter.type = "lowpass";
  liftFilter.frequency.setValueAtTime(700, now + 0.45);
  liftFilter.frequency.exponentialRampToValueAtTime(2600, now + 1.32);
  liftGain.gain.setValueAtTime(0.0001, now + 0.45);
  liftGain.gain.exponentialRampToValueAtTime(0.19, now + 0.85);
  liftGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.52);
  lift.connect(liftFilter);
  liftFilter.connect(liftGain);
  liftGain.connect(master);
  lift.start(now + 0.45);
  lift.stop(now + 1.58);

  // 4. Confident final lock: E major voicing.
  [
    { frequency: 329.63, level: 0.22 },
    { frequency: 415.3, level: 0.17 },
    { frequency: 493.88, level: 0.13 },
  ].forEach(({ frequency, level }) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now + 1.34);
    gain.gain.setValueAtTime(0.0001, now + 1.34);
    gain.gain.exponentialRampToValueAtTime(level, now + 1.48);
    gain.gain.exponentialRampToValueAtTime(level * 0.5, now + 2.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.58);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + 1.34);
    osc.stop(now + 2.62);
  });

  // 5. Short air release gives the logo a polished ending.
  const air = context.createOscillator();
  const airGain = context.createGain();
  air.type = "sine";
  air.frequency.setValueAtTime(988, now + 1.75);
  air.frequency.exponentialRampToValueAtTime(783.99, now + 2.48);
  airGain.gain.setValueAtTime(0.0001, now + 1.75);
  airGain.gain.exponentialRampToValueAtTime(0.1, now + 1.94);
  airGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.54);
  air.connect(airGain);
  airGain.connect(master);
  air.start(now + 1.75);
  air.stop(now + 2.6);
}

function speakBrandLine() {
  // Concept 6 intentionally has no spoken line.
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
