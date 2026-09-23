"use client";

import { useEffect, useState } from "react";

export default function AppIntro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = window.sessionStorage.getItem("utech-app-intro");
    if (seen) return;

    setVisible(true);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      window.sessionStorage.setItem("utech-app-intro", "1");
    }, 3000);

    return () => window.clearTimeout(hideTimer);
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
