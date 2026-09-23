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

  // UTECH Sonic Logo — concept 2:
  // deep impact -> glass pulse -> rising 3-note identity -> warm lock -> sparkle.
  // Kept intentionally short so it feels like a brand signature, not background music.
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-24, now);
  compressor.knee.setValueAtTime(6, now);
  compressor.ratio.setValueAtTime(12, now);
  compressor.attack.setValueAtTime(0.003, now);
  compressor.release.setValueAtTime(0.22, now);

  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.05, now + 0.018);
  master.gain.setValueAtTime(1.05, now + 2.58);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);
  master.connect(compressor);
  compressor.connect(context.destination);

  // 1. Deep identity hit.
  const sub = context.createOscillator();
  const subGain = context.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(96, now);
  sub.frequency.exponentialRampToValueAtTime(48, now + 0.34);
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.9, now + 0.012);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
  sub.connect(subGain);
  subGain.connect(master);
  sub.start(now);
  sub.stop(now + 0.5);

  // 2. Short metallic/glass transient.
  const glass = context.createOscillator();
  const glassGain = context.createGain();
  const glassFilter = context.createBiquadFilter();
  glass.type = "sine";
  glass.frequency.setValueAtTime(1568, now + 0.035);
  glass.frequency.exponentialRampToValueAtTime(3136, now + 0.18);
  glassFilter.type = "highpass";
  glassFilter.frequency.setValueAtTime(900, now);
  glassGain.gain.setValueAtTime(0.0001, now + 0.035);
  glassGain.gain.exponentialRampToValueAtTime(0.42, now + 0.055);
  glassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
  glass.connect(glassFilter);
  glassFilter.connect(glassGain);
  glassGain.connect(master);
  glass.start(now + 0.035);
  glass.stop(now + 0.4);

  // 3. UTECH's new three-note signature.
  const motif = [
    { frequency: 261.63, start: 0.42, length: 0.34 },
    { frequency: 329.63, start: 0.72, length: 0.36 },
    { frequency: 493.88, start: 1.04, length: 0.62 },
  ];

  motif.forEach(({ frequency, start, length }, index) => {
    const tone = context.createOscillator();
    const harmonic = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    tone.type = "triangle";
    tone.frequency.setValueAtTime(frequency, now + start);

    harmonic.type = "sine";
    harmonic.frequency.setValueAtTime(frequency * 2, now + start);
    harmonic.detune.setValueAtTime(index === 1 ? -4 : 4, now + start);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, now + start);
    filter.frequency.exponentialRampToValueAtTime(
      7200,
      now + start + 0.16,
    );

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(
      0.46 + index * 0.08,
      now + start + 0.025,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + start + length,
    );

    tone.connect(filter);
    harmonic.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    tone.start(now + start);
    harmonic.start(now + start);
    tone.stop(now + start + length + 0.03);
    harmonic.stop(now + start + length + 0.03);
  });

  // 4. Premium brand lock: a two-tone chord that lands after the motif.
  const lockNotes = [
    { frequency: 329.63, level: 0.48 },
    { frequency: 493.88, level: 0.36 },
    { frequency: 659.25, level: 0.22 },
  ];

  lockNotes.forEach(({ frequency, level }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + 1.48);
    gain.gain.setValueAtTime(0.0001, now + 1.48);
    gain.gain.exponentialRampToValueAtTime(level, now + 1.53);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.62);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now + 1.48);
    oscillator.stop(now + 2.66);
  });

  // 5. Final upward sparkle.
  const sparkle = context.createOscillator();
  const sparkleGain = context.createGain();
  sparkle.type = "sine";
  sparkle.frequency.setValueAtTime(987.77, now + 2.08);
  sparkle.frequency.exponentialRampToValueAtTime(1975.53, now + 2.48);
  sparkleGain.gain.setValueAtTime(0.0001, now + 2.08);
  sparkleGain.gain.exponentialRampToValueAtTime(0.28, now + 2.16);
  sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.86);
  sparkle.connect(sparkleGain);
  sparkleGain.connect(master);
  sparkle.start(now + 2.08);
  sparkle.stop(now + 2.9);
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
