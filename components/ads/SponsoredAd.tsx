"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./SponsoredAd.module.css";

type Ad = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  href: string;
  placement: string;
};

export default function SponsoredAd({ ad }: { ad: Ad }) {
  useEffect(() => {
    const key = `utech-ad-viewed-${ad.id}-${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    void fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId: ad.id, eventType: "impression" }),
    }).catch(() => undefined);
  }, [ad.id]);

  return (
    <article className={styles.ad}>
      <div className={styles.copy}>
        <span className={styles.label}>SPONSORED</span>
        <h3>{ad.title}</h3>
        {ad.body ? <p>{ad.body}</p> : null}
        <Link
          href={ad.href}
          className="button button-primary"
          onClick={() => {
            void fetch("/api/ads/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adId: ad.id, eventType: "click" }),
            }).catch(() => undefined);
          }}
        >
          View offer →
        </Link>
      </div>
      {ad.image_url ? (
        <Link href={ad.href} className={styles.imageWrap} aria-label={ad.title}>
          <img src={ad.image_url} alt="" />
        </Link>
      ) : null}
    </article>
  );
}
