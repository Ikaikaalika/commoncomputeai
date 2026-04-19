import type { ReactNode } from "react";
import { NT } from "./tokens";
import Dot from "./Dot";

type Props = { children: ReactNode; dot?: boolean };

export default function Eyebrow({ children, dot }: Props) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: NT.mono,
        fontSize: 10.5,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: NT.text3,
      }}
    >
      {dot && <Dot color={NT.positive} size={6} pulse />}
      {children}
    </div>
  );
}
