import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
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
        color: "white",
        background: "#4E2A84",
        borderRadius: 16,
        fontFamily: "Georgia, serif",
        fontSize: 44,
        fontWeight: 800,
      }}
    >
      N
    </div>,
    size,
  );
}
