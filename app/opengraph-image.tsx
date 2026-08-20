import { ImageResponse } from "next/og";

export const alt = "Rank Northwestern Campus Dining";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        color: "#211B24",
        background: "#F7F4EF",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ width: 24, height: "100%", background: "#4E2A84" }} />
      <div style={{ flex: 1, padding: "58px 68px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#4E2A84", fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>
          <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", color: "white", background: "#4E2A84", borderRadius: 14, fontFamily: "Georgia, serif", fontSize: 32 }}>N</div>
          NORTHWESTERN
        </div>
        <div style={{ marginTop: 52, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", fontSize: 88, fontWeight: 700, lineHeight: .94, letterSpacing: -4 }}>
          <span>Rank your</span>
          <span style={{ color: "#4E2A84", fontStyle: "italic" }}>campus dining spots.</span>
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#6D6571", fontSize: 24 }}>
          <span>Eleven spots. A few quick choices.</span>
          <span style={{ padding: "14px 24px", color: "white", background: "#4E2A84", borderRadius: 999, fontWeight: 700 }}>Make your ranking →</span>
        </div>
      </div>
    </div>,
    size,
  );
}
