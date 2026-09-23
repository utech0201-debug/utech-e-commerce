"use client";

import { useEffect, useRef, useState } from "react";

function createNoiseBuffer(audio: AudioContext, duration: number) {
  const buffer = audio.createBuffer(
    1,
    Math.floor(audio.sampleRate * duration),
    audio.sampleRate,
  );
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

function playIntroSound(context?: AudioContext) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const audio = context ?? new AudioContextClass();
    const now = audio.currentTime;

    // A mastered, 3-second UTECH sonic signature:
    // impact -> rising motion -> signature hits -> final brand lock.
    const compressor = audio.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, now);
    compressor.knee.setValueAtTime(8, now);
    compressor.ratio.setValueAtTime(10, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.22, now);

    const master = audio.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.92, now + 0.035);
    master.gain.setValueAtTime(0.92, now + 2.25);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
    master.connect(compressor);
    compressor.connect(audio.destination);

    // 1. Cinematic low-end impact.
    const impact = audio.createOscillator();
    const impactGain = audio.createGain();
    impact.type = "sine";
    impact.frequency.setValueAtTime(118, now);
    impact.frequency.exponentialRampToValueAtTime(46, now + 0.34);
    impactGain.gain.setValueAtTime(0.0001, now);
    impactGain.gain.exponentialRampToValueAtTime(0.9, now + 0.018);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
    impact.connect(impactGain);
    impactGain.connect(master);
    impact.start(now);
    impact.stop(now + 0.55);

    // 2. Punchy transient to make the mark feel physical.
    const noise = audio.createBufferSource();
    const noiseGain = audio.createGain();
    const noiseFilter = audio.createBiquadFilter();
    noise.buffer = createNoiseBuffer(audio, 0.28);
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1450, now);
    noiseFilter.Q.setValueAtTime(0.7, now);
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.42, now + 0.008);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.25);

    // 3. Wide futuristic rise.
    const rise = audio.createOscillator();
    const riseGain = audio.createGain();
    const riseFilter = audio.createBiquadFilter();
    rise.type = "sawtooth";
    rise.frequency.setValueAtTime(82, now + 0.16);
    rise.frequency.exponentialRampToValueAtTime(760, now + 1.52);
    riseFilter.type = "lowpass";
    riseFilter.frequency.setValueAtTime(420, now + 0.16);
    riseFilter.frequency.exponentialRampToValueAtTime(5200, now + 1.55);
    riseGain.gain.setValueAtTime(0.0001, now + 0.16);
    riseGain.gain.exponentialRampToValueAtTime(0.24, now + 0.58);
    riseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.68);
    rise.connect(riseFilter);
    riseFilter.connect(riseGain);
    riseGain.connect(master);
    rise.start(now + 0.16);
    rise.stop(now + 1.72);

    // 4. UTECH's original signature: three bold, synthetic brand hits.
    const signature = [
      { frequency: 196.0, start: 0.72, length: 0.48, level: 0.58 },
      { frequency: 293.66, start: 1.04, length: 0.52, level: 0.62 },
      { frequency: 440.0, start: 1.38, length: 0.72, level: 0.7 },
    ];

    signature.forEach(({ frequency, start, length, level }, index) => {
      const oscillator = audio.createOscillator();
      const octave = audio.createOscillator();
      const gain = audio.createGain();
      const filter = audio.createBiquadFilter();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency * 0.82, now + start);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency,
        now + start + 0.12,
      );

      octave.type = "sawtooth";
      octave.frequency.setValueAtTime(frequency * 2, now + start);
      octave.detune.setValueAtTime(index % 2 === 0 ? -7 : 7, now + start);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1900, now + start);
      filter.frequency.exponentialRampToValueAtTime(
        5200,
        now + start + 0.24,
      );

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(
        level,
        now + start + 0.025,
      );
      gain.gain.exponentialRampToValueAtTime(
        level * 0.34,
        now + start + 0.18,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + start + length,
      );

      oscillator.connect(filter);
      octave.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      oscillator.start(now + start);
      octave.start(now + start);
      oscillator.stop(now + start + length + 0.04);
      octave.stop(now + start + length + 0.04);
    });

    // 5. Final UTECH brand lock: deep hit + bright metallic resolve.
    const lock = audio.createOscillator();
    const lockGain = audio.createGain();
    lock.type = "sine";
    lock.frequency.setValueAtTime(440, now + 1.78);
    lock.frequency.exponentialRampToValueAtTime(392, now + 2.05);
    lockGain.gain.setValueAtTime(0.0001, now + 1.78);
    lockGain.gain.exponentialRampToValueAtTime(0.72, now + 1.81);
    lockGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.65);
    lock.connect(lockGain);
    lockGain.connect(master);
    lock.start(now + 1.78);
    lock.stop(now + 2.7);

    const shimmer = audio.createOscillator();
    const shimmerGain = audio.createGain();
    const shimmerFilter = audio.createBiquadFilter();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(1174.66, now + 1.88);
    shimmer.frequency.exponentialRampToValueAtTime(1760, now + 2.2);
    shimmerFilter.type = "highpass";
    shimmerFilter.frequency.setValueAtTime(900, now + 1.88);
    shimmerGain.gain.setValueAtTime(0.0001, now + 1.88);
    shimmerGain.gain.exponentialRampToValueAtTime(0.16, now + 1.92);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.62);
    shimmer.connect(shimmerFilter);
    shimmerFilter.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmer.start(now + 1.88);
    shimmer.stop(now + 2.7);

    // A final air tail carries the logo through the last second.
    const tail = audio.createOscillator();
    const tailGain = audio.createGain();
    tail.type = "triangle";
    tail.frequency.setValueAtTime(2200, now + 2.08);
    tail.frequency.exponentialRampToValueAtTime(740, now + 2.92);
    tailGain.gain.setValueAtTime(0.0001, now + 2.08);
    tailGain.gain.exponentialRampToValueAtTime(0.055, now + 2.18);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.96);
    tail.connect(tailGain);
    tailGain.connect(master);
    tail.start(now + 2.08);
    tail.stop(now + 3.0);

    if (!context) {
      window.setTimeout(() => void audio.close(), 3300);
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
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;

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
