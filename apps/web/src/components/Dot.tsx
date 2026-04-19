type Props = { color?: string; size?: number; pulse?: boolean };

export default function Dot({ color = "#7EE2A8", size = 6, pulse = false }: Props) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color,
        boxShadow: pulse ? `0 0 0 0 ${color}` : "none",
        animation: pulse ? "cc-pulse 1.8s ease-out infinite" : "none",
        flexShrink: 0,
      }}
    />
  );
}
