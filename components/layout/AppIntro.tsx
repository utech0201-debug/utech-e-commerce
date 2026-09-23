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

function playIntroSound(context: AudioContext) {
  const now = context.currentTime;

  // Loud, compressed 3-second sonic bed:
  // impact -> motion -> spoken brand line -> signature finish.
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-20, now);
  compressor.knee.setValueAtTime(5, now);
  compressor.ratio.setValueAtTime(16, now);
  compressor.attack.setValueAtTime(0.002, now);
  compressor.release.setValueAtTime(0.18, now);

  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.25, now + 0.025);
  master.gain.setValueAtTime(1.25, now + 2.72);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
  master.connect(compressor);
  compressor.connect(context.destination);

  // Heavy opening hit.
  const impact = context.createOscillator();
  const impactGain = context.createGain();
  impact.type = "sine";
  impact.frequency.setValueAtTime(132, now);
  impact.frequency.exponentialRampToValueAtTime(42, now + 0.32);
  impactGain.gain.setValueAtTime(0.0001, now);
  impactGain.gain.exponentialRampToValueAtTime(1.05, now + 0.012);
  impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  impact.connect(impactGain);
  impactGain.connect(master);
  impact.start(now);
  impact.stop(now + 0.53);

  // Bright transient layered over the impact.
  const click = context.createBufferSource();
  const clickGain = context.createGain();
  const clickFilter = context.createBiquadFilter();
  click.buffer = createNoiseBuffer(context, 0.2);
  clickFilter.type = "bandpass";
  clickFilter.frequency.setValueAtTime(2400, now);
  clickFilter.Q.setValueAtTime(0.8, now);
  clickGain.gain.setValueAtTime(0.0001, now);
  clickGain.gain.exponentialRampToValueAtTime(0.58, now + 0.006);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
  click.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(master);
  click.start(now);
  click.stop(now + 0.2);

  // Futuristic movement underneath the voice.
  const rise = context.createOscillator();
  const riseGain = context.createGain();
  const riseFilter = context.createBiquadFilter();
  rise.type = "sawtooth";
  rise.frequency.setValueAtTime(72, now + 0.12);
  rise.frequency.exponentialRampToValueAtTime(620, now + 1.35);
  riseFilter.type = "lowpass";
  riseFilter.frequency.setValueAtTime(360, now + 0.12);
  riseFilter.frequency.exponentialRampToValueAtTime(4800, now + 1.35);
  riseGain.gain.setValueAtTime(0.0001, now + 0.12);
  riseGain.gain.exponentialRampToValueAtTime(0.28, now + 0.65);
  riseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
  rise.connect(riseFilter);
  riseFilter.connect(riseGain);
  riseGain.connect(master);
  rise.start(now + 0.12);
  rise.stop(now + 1.55);

  // Original UTECH three-hit signature begins underneath the spoken line.
  const signature = [
    { frequency: 196, start: 0.72, length: 0.38, level: 0.5 },
    { frequency: 293.66, start: 0.98, length: 0.42, level: 0.56 },
    { frequency: 440, start: 1.25, length: 0.55, level: 0.66 },
  ];

  signature.forEach(({ frequency, start, length, level }, index) => {
    const tone = context.createOscillator();
    const upper = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    tone.type = "triangle";
    tone.frequency.setValueAtTime(frequency * 0.82, now + start);
    tone.frequency.exponentialRampToValueAtTime(
      frequency,
      now + start + 0.08,
    );

    upper.type = "sawtooth";
    upper.frequency.setValueAtTime(frequency * 2, now + start);
    upper.detune.setValueAtTime(index % 2 === 0 ? -6 : 6, now + start);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, now + start);
    filter.frequency.exponentialRampToValueAtTime(
      6200,
      now + start + 0.18,
    );

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(
      level,
      now + start + 0.02,
    );
    gain.gain.exponentialRampToValueAtTime(
      level * 0.3,
      now + start + 0.14,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + start + length,
    );

    tone.connect(filter);
    upper.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    tone.start(now + start);
    upper.start(now + start);
    tone.stop(now + start + length + 0.03);
    upper.stop(now + start + length + 0.03);
  });

  // Big UTECH finish after the voice line.
  const finish = context.createOscillator();
  const finishGain = context.createGain();
  finish.type = "sine";
  finish.frequency.setValueAtTime(392, now + 1.72);
  finish.frequency.exponentialRampToValueAtTime(329.63, now + 2.05);
  finishGain.gain.setValueAtTime(0.0001, now + 1.72);
  finishGain.gain.exponentialRampToValueAtTime(0.95, now + 1.76);
  finishGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.72);
  finish.connect(finishGain);
  finishGain.connect(master);
  finish.start(now + 1.72);
  finish.stop(now + 2.75);

  const finishOctave = context.createOscillator();
  const finishOctaveGain = context.createGain();
  finishOctave.type = "triangle";
  finishOctave.frequency.setValueAtTime(783.99, now + 1.74);
  finishOctave.frequency.exponentialRampToValueAtTime(
    659.25,
    now + 2.08,
  );
  finishOctaveGain.gain.setValueAtTime(0.0001, now + 1.74);
  finishOctaveGain.gain.exponentialRampToValueAtTime(0.38, now + 1.79);
  finishOctaveGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
  finishOctave.connect(finishOctaveGain);
  finishOctaveGain.connect(master);
  finishOctave.start(now + 1.74);
  finishOctave.stop(now + 2.65);

  // High-end signature sparkle.
  const sparkle = context.createOscillator();
  const sparkleGain = context.createGain();
  sparkle.type = "sine";
  sparkle.frequency.setValueAtTime(1318.51, now + 2.08);
  sparkle.frequency.exponentialRampToValueAtTime(2093, now + 2.42);
  sparkleGain.gain.setValueAtTime(0.0001, now + 2.08);
  sparkleGain.gain.exponentialRampToValueAtTime(0.25, now + 2.14);
  sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);
  sparkle.connect(sparkleGain);
  sparkleGain.connect(master);
  sparkle.start(now + 2.08);
  sparkle.stop(now + 2.95);
}

function speakBrandLine() {
  try {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      "UTECH. Shop with ease.",
    );
    utterance.rate = 0.9;
    utterance.pitch = 0.72;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((voice) => /en-US|en-GB/i.test(voice.lang)) ??
      voices.find((voice) => /^en/i.test(voice.lang));

    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);
  } catch {
    // Spoken branding is optional and never blocks the intro.
  }
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
