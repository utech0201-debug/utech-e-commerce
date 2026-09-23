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

    // Soft cinematic "air" sweep: a quick rise that leads into the brand reveal.
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

    // UTECH signature: three clean tones, spaced like a short sonic logo.
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

    // A very short high harmonic gives the final UTECH reveal a polished "spark".
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
