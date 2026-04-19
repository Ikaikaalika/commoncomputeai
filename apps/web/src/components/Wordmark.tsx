import { NT } from "./tokens";

type Props = { size?: number; color?: string };

export default function Wordmark({ size = 18, color = NT.text }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.28,
        fontFamily: NT.display,
        fontWeight: 500,
        letterSpacing: -size * 0.04,
        color,
        fontSize: size,
        lineHeight: 1,
      }}
    >
      <span>Common</span>
      <span
        style={{
          display: "inline-block",
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #DBF0FF, #5DA8EC)",
        }}
      />
      <span>Compute</span>
    </div>
  );
}
