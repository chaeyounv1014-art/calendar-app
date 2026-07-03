import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          borderRadius: 8,
          background: "linear-gradient(135deg, #4F46E5, #06B6D4)",
        }}
      >
        📅
      </div>
    ),
    { ...size }
  );
}
