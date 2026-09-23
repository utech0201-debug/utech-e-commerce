"use client";

// Archived UTECH AppIntro — Sonic Logo Concept 4
// Preserved before Concept 5.

import { useEffect, useRef, useState } from "react";

function playIntroSound(context: AudioContext) {
  const now = context.currentTime;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-20, now);
  compressor.knee.setValueAtTime(7, now);
  compressor.ratio.setValueAtTime(8, now);
  compressor.attack.setValueAtTime(0.003, now);
  compressor.release.setValueAtTime(0.3, now);

  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1.12, now + 0.025);
  master.gain.setValueAtTime(1.12, now + 2.35);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);
  master.connect(compressor);
  compressor.connect(context.destination);

  const pulse = context.createOscillator();
  const pulseGain = context.createGain();
  pulse.type = "sine";
  pulse.frequency.setValueAtTime(110, now);
  pulse.frequency.exponentialRampToValueAtTime(62, now + 0.3);
  pulseGain.gain.setValueAtTime(0.0001, now);
  pulseGain.gain.exponentialRampToValueAtTime(0.68, now + 0.012);
  pulseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
  pulse.connect(pulseGain); pulseGain.connect(master); pulse.start(now); pulse.stop(now + 0.42);

  [0.18, 0.34, 0.52].forEach((offset, index) => {
    const click = context.createOscillator(); const clickGain = context.createGain();
    click.type = "triangle"; click.frequency.setValueAtTime(1100 + index * 280, now + offset);
    clickGain.gain.setValueAtTime(0.0001, now + offset);
    clickGain.gain.exponentialRampToValueAtTime(0.17, now + offset + 0.006);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.06);
    click.connect(clickGain); clickGain.connect(master); click.start(now + offset); click.stop(now + offset + 0.075);
  });

  const rise = context.createOscillator(); const riseGain = context.createGain(); const riseFilter = context.createBiquadFilter();
  rise.type = "triangle"; rise.frequency.setValueAtTime(220, now + 0.58); rise.frequency.exponentialRampToValueAtTime(880, now + 1.3);
  riseFilter.type = "lowpass"; riseFilter.frequency.setValueAtTime(900, now + 0.58); riseFilter.frequency.exponentialRampToValueAtTime(5000, now + 1.3);
  riseGain.gain.setValueAtTime(0.0001, now + 0.58); riseGain.gain.exponentialRampToValueAtTime(0.2, now + 1.02); riseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.42);
  rise.connect(riseFilter); riseFilter.connect(riseGain); riseGain.connect(master); rise.start(now + 0.58); rise.stop(now + 1.48);

  [{ frequency: 392, start: 1.22, length: 0.28, level: 0.42 }, { frequency: 493.88, start: 1.48, length: 0.32, level: 0.5 }, { frequency: 659.25, start: 1.78, length: 0.7, level: 0.58 }].forEach(({ frequency, start, length, level }) => {
    const tone = context.createOscillator(); const harmonic = context.createOscillator(); const gain = context.createGain();
    tone.type = "sine"; tone.frequency.setValueAtTime(frequency, now + start);
    harmonic.type = "triangle"; harmonic.frequency.setValueAtTime(frequency * 2, now + start);
    gain.gain.setValueAtTime(0.0001, now + start); gain.gain.exponentialRampToValueAtTime(level, now + start + 0.018); gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
    tone.connect(gain); harmonic.connect(gain); gain.connect(master); tone.start(now + start); harmonic.start(now + start); tone.stop(now + start + length + 0.03); harmonic.stop(now + start + length + 0.03);
  });

  const tail = context.createOscillator(); const tailGain = context.createGain();
  tail.type = "sine"; tail.frequency.setValueAtTime(1318.51, now + 2.02); tail.frequency.exponentialRampToValueAtTime(880, now + 2.72);
  tailGain.gain.setValueAtTime(0.0001, now + 2.02); tailGain.gain.exponentialRampToValueAtTime(0.2, now + 2.14); tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.88);
  tail.connect(tailGain); tailGain.connect(master); tail.start(now + 2.02); tail.stop(now + 2.9);
}

function speakBrandLine() {}

export default function AppIntro() {
  const [visible, setVisible] = useState(false); const audioContextRef = useRef<AudioContext | null>(null); const playedRef = useRef(false);
  useEffect(() => {
    const seen = window.sessionStorage.getItem("utech-app-intro"); if (seen) return; setVisible(true);
    const startIntro = async () => {
      if (playedRef.current) return false;
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) { const context = audioContextRef.current ?? new AudioContextClass(); audioContextRef.current = context; if (context.state === "suspended") { try { await context.resume(); } catch {} } if (context.state === "running") { playIntroSound(context); playedRef.current = true; } }
      } catch {}
      if (playedRef.current) { speakBrandLine(); return true; } return false;
    };
    void startIntro(); const unlockAudio = () => { if (!playedRef.current) void startIntro(); };
    window.addEventListener("pointerdown", unlockAudio, { passive: true }); window.addEventListener("touchstart", unlockAudio, { passive: true }); window.addEventListener("keydown", unlockAudio);
    const hideTimer = window.setTimeout(() => { setVisible(false); window.sessionStorage.setItem("utech-app-intro", "1"); }, 3000);
    return () => { window.clearTimeout(hideTimer); window.removeEventListener("pointerdown", unlockAudio); window.removeEventListener("touchstart", unlockAudio); window.removeEventListener("keydown", unlockAudio); window.speechSynthesis?.cancel(); if (audioContextRef.current) { void audioContextRef.current.close(); audioContextRef.current = null; } };
  }, []);
  if (!visible) return null;
  return (<div className="utech-app-intro" role="status" aria-label="Opening UTECH"><div className="utech-intro-grid" aria-hidden="true" /><div className="utech-intro-orbit utech-intro-orbit-one" aria-hidden="true" /><div className="utech-intro-orbit utech-intro-orbit-two" aria-hidden="true" /><div className="utech-intro-node utech-intro-node-one" aria-hidden="true" /><div className="utech-intro-node utech-intro-node-two" aria-hidden="true" /><div className="utech-intro-node utech-intro-node-three" aria-hidden="true" /><div className="utech-intro-core"><div className="utech-intro-kicker">THE MARKETPLACE</div><div className="utech-intro-word" aria-hidden="true"><span>U</span><span>T</span><span>E</span><span>C</span><span>H</span></div><div className="utech-intro-tagline">SHOP WITH EASE</div><div className="utech-intro-progress" aria-hidden="true"><span /></div></div><span className="sr-only">UTECH. Shop with ease.</span></div>);
}
