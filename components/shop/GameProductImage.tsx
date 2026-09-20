"use client";

import Image from "next/image";
import { useState } from "react";

export default function GameProductImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="game-image-fallback" role="img" aria-label={alt}>
        <span className="game-image-fallback-mark">U</span>
        <strong>{alt}</strong>
        <small>GAME ART UNAVAILABLE</small>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes="(max-width:700px) 100vw, (max-width:1000px) 50vw, 33vw"
      onError={() => setFailed(true)}
    />
  );
}
