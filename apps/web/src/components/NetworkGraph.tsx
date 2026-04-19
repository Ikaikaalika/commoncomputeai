"use client";

import { useEffect, useMemo, useState } from "react";
import { NT } from "./tokens";

const W = 620;
const H = 460;

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickLabel(_i: number, rng: () => number) {
  const kinds = ["mac-studio", "mac-mini", "macbook"];
  const cities = ["SF", "NYC", "TYO", "AMS", "BER", "SEA", "LDN"];
  return `${kinds[Math.floor(rng() * 3)]}·${cities[Math.floor(rng() * cities.length)]}`;
}

type Packet = { id: number; x1: number; y1: number; x2: number; y2: number };

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 4,
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${NT.line}`,
        color: NT.text2,
        letterSpacing: 0.5,
      }}
    >
      {children}
    </span>
  );
}

function PacketAnim({ p }: { p: Packet }) {
  return (
    <g>
      <circle r="2.4" fill={NT.blue} opacity="0.95">
        <animate attributeName="cx" from={p.x1} to={p.x2} dur="1.2s" fill="freeze" />
        <animate attributeName="cy" from={p.y1} to={p.y2} dur="1.2s" fill="freeze" />
        <animate attributeName="opacity" values="0;1;1;0" dur="1.2s" fill="freeze" />
      </circle>
    </g>
  );
}

export default function NetworkGraph() {
  const nodes = useMemo(() => {
    const rng = mulberry32(7);
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: 60 + rng() * (W - 120),
      y: 50 + rng() * (H - 100),
      r: 3.5 + rng() * 2.5,
      label: pickLabel(i, rng),
    }));
  }, []);

  const edges = useMemo(() => {
    const out: Array<{ a: number; b: number }> = [];
    for (let i = 0; i < nodes.length; i++) {
      const dists = nodes
        .map((n, j) => ({ j, d: Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y) }))
        .filter((e) => e.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      dists.forEach((e) => out.push({ a: i, b: e.j }));
    }
    return out;
  }, [nodes]);

  const [packets, setPackets] = useState<Packet[]>([]);

  useEffect(() => {
    let alive = true;
    let id = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const spawn = () => {
      if (!alive) return;
      const e = edges[Math.floor(Math.random() * edges.length)];
      const na = nodes[e.a];
      const nb = nodes[e.b];
      const pid = ++id;
      setPackets((p) => [...p, { id: pid, x1: na.x, y1: na.y, x2: nb.x, y2: nb.y }]);
      setTimeout(() => setPackets((p) => p.filter((x) => x.id !== pid)), 1400);
      timer = setTimeout(spawn, 180 + Math.random() * 350);
    };
    timer = setTimeout(spawn, 600);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [edges, nodes]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${NT.line}`,
        background: `radial-gradient(circle at 30% 20%, rgba(142,201,248,0.08), transparent 60%), ${NT.panel}`,
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto" }}>
        <defs>
          <radialGradient id="ng-nodeGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#DBF0FF" stopOpacity="1" />
            <stop offset="1" stopColor="#8EC9F8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ng-silverEdge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={NT.silver1} stopOpacity="0.28" />
            <stop offset="1" stopColor={NT.silver3} stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {edges.map((e, i) => {
          const a = nodes[e.a];
          const b = nodes[e.b];
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#ng-silverEdge)" strokeWidth="1" />;
        })}

        {packets.map((p) => (
          <PacketAnim key={p.id} p={p} />
        ))}

        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={n.r * 3.2} fill="url(#ng-nodeGlow)" opacity="0.5" />
            <circle cx={n.x} cy={n.y} r={n.r} fill={NT.blue} stroke="#DFF2FF" strokeOpacity="0.6" strokeWidth="0.6" />
          </g>
        ))}

        {nodes.slice(0, 5).map((n) => (
          <g key={n.id}>
            <line x1={n.x + 6} y1={n.y} x2={n.x + 22} y2={n.y - 14} stroke={NT.text4} strokeWidth="0.6" />
            <text x={n.x + 24} y={n.y - 14} fontFamily={NT.mono} fontSize="8.5" fill={NT.text3}>
              {n.label}
            </text>
          </g>
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          display: "flex",
          gap: 6,
          fontFamily: NT.mono,
          fontSize: 10.5,
          color: NT.text2,
        }}
      >
        <Chip>LIVE</Chip>
        <Chip>[N] NODES</Chip>
        <Chip>[N] JOBS/MIN</Chip>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 14,
          right: 14,
          fontFamily: NT.mono,
          fontSize: 10,
          color: NT.text4,
          letterSpacing: 0.3,
        }}
      >
        simulated topology · real network at /status
      </div>
    </div>
  );
}
