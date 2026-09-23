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
      <div className="utech-app-intro-orbit" aria-hidden="true" />
      <div className="utech-app-intro-mark" aria-hidden="true">
        <span>U</span>
      </div>
      <div className="utech-app-intro-word">UTECH</div>
      <div className="utech-app-intro-line" aria-hidden="true" />
      <span className="sr-only">Opening UTECH Marketplace</span>
    </div>
  );
}
