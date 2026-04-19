"use client";

import { useState } from "react";
import { NT } from "./tokens";
import Eyebrow from "./Eyebrow";
import { PRICING } from "./pricing-data";

export default function Estimator() {
  const [taskIdx, setTaskIdx] = useState(0);
  const [mode, setMode] = useState<"batch" | "realtime">("batch");
  const [volume, setVolume] = useState(10);
  const p = PRICING[taskIdx];
  const unitPrice = p[mode] ?? 0;
  const cost = unitPrice * volume;
  return (
    <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.panel }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
        <Eyebrow>Estimator</Eyebrow>
        <h2
          style={{
            fontSize: 44,
            letterSpacing: -1.8,
            fontWeight: 500,
            color: NT.text,
            margin: "14px 0 40px",
            lineHeight: 1.05,
          }}
        >
          How much would your workload cost?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div
                style={{
                  fontFamily: NT.mono,
                  fontSize: 10.5,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: NT.text3,
                  marginBottom: 10,
                }}
              >
                Workload
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PRICING.filter((x) => x.batch !== null).map((t) => {
                  const idx = PRICING.indexOf(t);
                  const active = taskIdx === idx;
                  return (
                    <button
                      key={t.task}
                      onClick={() => setTaskIdx(idx)}
                      style={{
                        background: active ? NT.text : "transparent",
                        color: active ? NT.bg : NT.text2,
                        border: `1px solid ${NT.line}`,
                        borderRadius: 6,
                        padding: "8px 12px",
                        fontFamily: NT.display,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {t.task}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: NT.mono,
                  fontSize: 10.5,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: NT.text3,
                  marginBottom: 10,
                }}
              >
                Priority
              </div>
              <div style={{ display: "inline-flex", background: NT.bg, border: `1px solid ${NT.line}`, borderRadius: 6, padding: 3 }}>
                {(["batch", "realtime"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      background: mode === m ? NT.panel2 : "transparent",
                      color: mode === m ? NT.text : NT.text3,
                      border: "none",
                      borderRadius: 4,
                      padding: "8px 16px",
                      fontFamily: NT.display,
                      fontSize: 13,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div
                  style={{
                    fontFamily: NT.mono,
                    fontSize: 10.5,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: NT.text3,
                  }}
                >
                  Volume
                </div>
                <div style={{ fontFamily: NT.mono, fontSize: 14, color: NT.text }}>
                  {volume.toLocaleString()}{" "}
                  <span style={{ color: NT.text3 }}>{p.unit.replace("per ", "")}</span>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={10000}
                value={volume}
                onChange={(e) => setVolume(+e.target.value)}
                style={{ width: "100%", accentColor: NT.blue }}
              />
            </div>
          </div>
          <div style={{ border: `1px solid ${NT.line}`, borderRadius: 10, background: NT.bg, padding: 32 }}>
            <div
              style={{
                fontFamily: NT.mono,
                fontSize: 10.5,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: NT.text3,
              }}
            >
              Estimated cost
            </div>
            <div
              style={{
                fontFamily: NT.display,
                fontSize: 64,
                fontWeight: 500,
                letterSpacing: -2.2,
                color: NT.text,
                margin: "12px 0 4px",
                background: `linear-gradient(180deg, ${NT.text}, ${NT.silver2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ${cost.toFixed(2)}
            </div>
            <div style={{ fontSize: 13, color: NT.text2 }}>
              {p.task} · {mode} · {volume.toLocaleString()} {p.unit.replace("per ", "")}
            </div>
            <div style={{ height: 1, background: NT.line, margin: "22px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: NT.mono, fontSize: 12, color: NT.text3 }}>
              <span>Unit price</span>
              <span>
                ${unitPrice.toFixed(3)} <span style={{ color: NT.text4 }}>/ {p.unit.replace("per ", "")}</span>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: NT.mono, fontSize: 12, color: NT.text3, marginTop: 8 }}>
              <span>vs. hyperscaler</span>
              <span style={{ color: NT.positive }}>save {p.savings}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
