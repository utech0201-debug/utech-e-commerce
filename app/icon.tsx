"use client";

import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0B1F3A",
        borderRadius: 112,
        color: "#FFFFFF",
        fontSize: 300,
        fontWeight: 800,
        fontFamily: "Arial",
      }}
    >
      <span style={{ color: "#2563EB" }}>U</span>
    </div>,
    size,
  );
}
