import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0A",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Background grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(249,115,22,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Orange left bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            background: "#F97316",
          }}
        />

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span
            style={{
              color: "#F97316",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            PRANAY CHANDRA
          </span>
          <span
            style={{
              color: "white",
              fontSize: 96,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            EmberOS
          </span>
          <span
            style={{
              color: "#71717A",
              fontSize: 22,
              marginTop: 8,
            }}
          >
            Full Stack Engineer & Systems Builder
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
