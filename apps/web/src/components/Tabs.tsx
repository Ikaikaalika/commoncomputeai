"use client";

import { useState } from "react";
import { NT } from "./tokens";
import CodeBlock, { clr, hl } from "./CodeBlock";

const EXAMPLES: Record<string, { sub: string; lines: string[] }> = {
  Embeddings: {
    sub: "Bulk vector generation for search, RAG, clustering.",
    lines: [
      hl([["# Nightly re-embed of 10M product descriptions", clr.com]]),
      hl([["job ", null], ["= ", clr.kw], ["cc.embeddings.batch", clr.fn], ["(", null]]),
      hl([["    model=", null], ['"bge-large-en-v1.5"', clr.str], [",", null]]),
      hl([["    inputs=", null], ["stream_from_pg", clr.fn], ["(", null], ['"products"', clr.str], ["),", null]]),
      hl([["    priority=", null], ['"batch"', clr.str], [",", null]]),
      hl([[")", null]]),
    ],
  },
  Transcription: {
    sub: "Whisper-large on call recordings, meetings, podcasts.",
    lines: [
      hl([["# Transcribe last month of support calls", clr.com]]),
      hl([["job ", null], ["= ", clr.kw], ["cc.transcribe.batch", clr.fn], ["(", null]]),
      hl([["    model=", null], ['"whisper-large-v3"', clr.str], [",", null]]),
      hl([["    inputs=", null], ["s3_glob", clr.fn], ["(", null], ['"s3://calls/2025-10/*.wav"', clr.str], ["),", null]]),
      hl([["    diarize=", null], ["True", clr.kw], [",", null]]),
      hl([[")", null]]),
    ],
  },
  OCR: {
    sub: "Turn PDF archives and scans into structured JSON.",
    lines: [
      hl([["# OCR 80k scanned contracts", clr.com]]),
      hl([["job ", null], ["= ", clr.kw], ["cc.ocr.batch", clr.fn], ["(", null]]),
      hl([["    model=", null], ['"surya"', clr.str], [",", null]]),
      hl([["    inputs=", null], ["gcs_prefix", clr.fn], ["(", null], ['"gs://legal/scans/"', clr.str], ["),", null]]),
      hl([["    output=", null], ['"structured_json"', clr.str], [",", null]]),
      hl([[")", null]]),
    ],
  },
  Rerank: {
    sub: "Tighten retrieval on existing RAG pipelines.",
    lines: [
      hl([["# Rerank top-100 retrievals into top-10", clr.com]]),
      hl([["res ", null], ["= ", clr.kw], ["cc.rerank", clr.fn], ["(", null]]),
      hl([["    model=", null], ['"bge-reranker-v2"', clr.str], [",", null]]),
      hl([["    query=", null], ["user_query", null], [",", null]]),
      hl([["    documents=", null], ["candidates", null], [",", null]]),
      hl([["    top_k=", null], ["10", clr.num], [",", null]]),
      hl([[")", null]]),
    ],
  },
  Captioning: {
    sub: "Caption product catalogs and media libraries.",
    lines: [
      hl([["# Caption 200k product images", clr.com]]),
      hl([["job ", null], ["= ", clr.kw], ["cc.vision.caption", clr.fn], ["(", null]]),
      hl([["    model=", null], ['"florence-2-large"', clr.str], [",", null]]),
      hl([["    inputs=", null], ["db.query", clr.fn], ["(", null], ['"SELECT url FROM products"', clr.str], ["),", null]]),
      hl([[")", null]]),
    ],
  },
};

export default function DevExamples() {
  const [tab, setTab] = useState<keyof typeof EXAMPLES>("Embeddings");
  const ex = EXAMPLES[tab];
  return (
    <div>
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${NT.line}`, marginBottom: 24 }}>
        {(Object.keys(EXAMPLES) as Array<keyof typeof EXAMPLES>).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === k ? `1.5px solid ${NT.blue}` : "1.5px solid transparent",
              padding: "12px 18px",
              color: tab === k ? NT.text : NT.text3,
              fontFamily: NT.display,
              fontSize: 14,
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 40, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 22, color: NT.text, fontWeight: 500, letterSpacing: -0.6, marginBottom: 10 }}>
            {tab}
          </div>
          <p style={{ fontSize: 14, color: NT.text2, lineHeight: 1.6 }}>{ex.sub}</p>
        </div>
        <CodeBlock lang="python" title={`${String(tab).toLowerCase()}.py`} lines={ex.lines} />
      </div>
    </div>
  );
}
