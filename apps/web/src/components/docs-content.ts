export type DocBlock =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "code"; lang: string; text: string }
  | { kind: "callout"; tone: "blue" | "green"; text: string };

export type DocEntry = {
  title: string;
  kicker: string;
  body: DocBlock[];
};

export type DocSection = {
  section: string;
  items: { id: string; label: string }[];
};

export const DOCS_NAV: DocSection[] = [
  {
    section: "Getting started",
    items: [
      { id: "intro", label: "Introduction" },
      { id: "install", label: "Install the SDK" },
      { id: "first-job", label: "Your first job" },
      { id: "auth", label: "Authentication" },
    ],
  },
  {
    section: "Workloads",
    items: [
      { id: "embeddings", label: "Embeddings" },
      { id: "transcription", label: "Transcription" },
      { id: "ocr", label: "OCR" },
      { id: "rerank", label: "Rerankers" },
      { id: "custom", label: "Custom containers" },
    ],
  },
  {
    section: "Guarantees",
    items: [
      { id: "quotes", label: "Deterministic quotes" },
      { id: "sandbox", label: "Sandboxing" },
      { id: "receipts", label: "Signed receipts" },
    ],
  },
  {
    section: "Providers",
    items: [
      { id: "provider-install", label: "Install the agent" },
      { id: "provider-earnings", label: "Earnings" },
      { id: "provider-payouts", label: "Payouts" },
    ],
  },
];

export const DOCS_CONTENT: Record<string, DocEntry> = {
  intro: {
    title: "Introduction",
    kicker: "Getting started",
    body: [
      { kind: "p", text: "Common Compute is a distributed network for batch AI workloads. You ship tasks — embeddings, transcription, OCR, reranking — and get back deterministic quotes before any GPU runs. Tasks execute in sandboxed containers on idle Apple Silicon across thousands of machines." },
      { kind: "p", text: "This guide walks you from install to your first production job in under ten minutes. If you already have an OpenAI, Cohere, or AWS Transcribe integration, you can port in a single line change." },
      { kind: "callout", tone: "blue", text: "New: drop-in OpenAI compatibility is now GA. See the compatibility guide." },
      { kind: "h", text: "What this is good for" },
      { kind: "ul", items: [
        "High-volume batch inference where seconds of latency is acceptable",
        "Workloads that dominate your AI bill today",
        "Pipelines with deterministic compute needs and tolerances for retries",
      ]},
      { kind: "h", text: "What this is not good for" },
      { kind: "ul", items: [
        "Sub-100ms realtime inference (use your existing provider)",
        "Training large models (we dispatch inference only)",
        "Stateful, long-running processes (tasks are bounded)",
      ]},
    ],
  },
  install: {
    title: "Install the SDK",
    kicker: "Getting started",
    body: [
      { kind: "p", text: "SDKs are available for Python and TypeScript. Both follow the same resource-oriented shape." },
      { kind: "code", lang: "bash", text: "pip install commoncompute\n# or\nnpm install @commoncompute/sdk" },
      { kind: "h", text: "Create a client" },
      { kind: "code", lang: "python", text: 'from commoncompute import Client\n\ncc = Client(api_key="cc_live_…")' },
      { kind: "p", text: "API keys are created in the dashboard. Test keys prefix cc_test_, live keys prefix cc_live_." },
    ],
  },
  "first-job": {
    title: "Your first job",
    kicker: "Getting started",
    body: [
      { kind: "p", text: "The simplest possible job: embed a few strings." },
      { kind: "code", lang: "python", text: 'job = cc.embeddings.create(\n    model="bge-large-en-v1.5",\n    inputs=["hello", "world"],\n)\nprint(job.vectors[0][:5])' },
      { kind: "p", text: "For anything larger than a handful of inputs, use the batch API — it streams and parallelises, and it's 3–6× cheaper than realtime pricing." },
      { kind: "code", lang: "python", text: 'job = cc.embeddings.batch(\n    model="bge-large-en-v1.5",\n    inputs=open("docs.jsonl"),\n    priority="batch",\n    max_spend_usd=50,\n)\n\nfor result in job.stream():\n    db.upsert(result.id, result.vector)' },
      { kind: "callout", tone: "green", text: "Every batch job is priced before it runs. If the quote exceeds max_spend_usd, submission fails rather than silently billing." },
    ],
  },
  auth: {
    title: "Authentication",
    kicker: "Getting started",
    body: [
      { kind: "p", text: "Every request is authenticated with a bearer token — your API key. Keys are scoped per-project, and each carries a configurable spend cap." },
      { kind: "code", lang: "bash", text: 'curl https://api.commoncompute.dev/v1/embeddings \\\n  -H "Authorization: Bearer $CC_API_KEY" \\\n  -d \'{"model":"bge-large-en-v1.5","inputs":["hi"]}\'' },
      { kind: "p", text: "Rotate keys from the dashboard. Old keys keep working for a 10-minute grace window to avoid deploy disruption." },
    ],
  },
  embeddings: {
    title: "Embeddings",
    kicker: "Workloads",
    body: [
      { kind: "p", text: "Bulk vector generation for search, RAG, clustering, and deduplication. Common Compute hosts open-weight models; no request touches a third-party API." },
      { kind: "h", text: "Supported models" },
      { kind: "ul", items: [
        "bge-large-en-v1.5 — best general-purpose English",
        "bge-m3 — multilingual, hybrid dense+sparse",
        "e5-mistral-7b-instruct — instruction-tuned",
        "nomic-embed-text-v1.5 — long context (8k)",
      ]},
      { kind: "code", lang: "python", text: 'job = cc.embeddings.batch(\n    model="bge-large-en-v1.5",\n    inputs=stream_from_pg("products"),\n)' },
    ],
  },
  transcription: {
    title: "Transcription",
    kicker: "Workloads",
    body: [
      { kind: "p", text: "Whisper-large and distil-whisper on bulk audio. Speaker diarisation, word timestamps, and language detection are optional." },
      { kind: "code", lang: "python", text: 'job = cc.transcribe.batch(\n    model="whisper-large-v3",\n    inputs=s3_glob("s3://calls/2025-10/*.wav"),\n    diarize=True,\n    word_timestamps=True,\n)' },
    ],
  },
  ocr: {
    title: "OCR",
    kicker: "Workloads",
    body: [
      { kind: "p", text: "Convert PDFs, scans, and images into structured JSON with layout preservation." },
      { kind: "code", lang: "python", text: 'job = cc.ocr.batch(\n    model="surya",\n    inputs=gcs_prefix("gs://legal/scans/"),\n    output="structured_json",\n)' },
    ],
  },
  rerank: {
    title: "Rerankers",
    kicker: "Workloads",
    body: [
      { kind: "p", text: "Tighten retrieval on existing RAG pipelines without touching your vector store." },
      { kind: "code", lang: "python", text: 'res = cc.rerank(\n    model="bge-reranker-v2",\n    query=user_query,\n    documents=candidates,\n    top_k=10,\n)' },
    ],
  },
  custom: {
    title: "Custom containers",
    kicker: "Workloads",
    body: [
      { kind: "p", text: "Bring any deterministic inference workload. Ship a CoreML or MLX-compiled container; we shard, dispatch, and settle." },
      { kind: "code", lang: "bash", text: "cc containers push ./my-model.cc\ncc jobs run my-model --input data.jsonl" },
    ],
  },
  quotes: {
    title: "Deterministic quotes",
    kicker: "Guarantees",
    body: [
      { kind: "p", text: "Every job is priced at submission. The number you see is the number you pay — no per-second billing, no surprise egress fees." },
      { kind: "p", text: "Quotes are computed from input size, model, and priority. Batch prices are 3–6× cheaper than realtime. Both are locked before any GPU runs." },
    ],
  },
  sandbox: {
    title: "Sandboxing",
    kicker: "Guarantees",
    body: [
      { kind: "p", text: "Tasks execute in signed, ephemeral containers on provider machines. No shared state between tenants. No network access except to our task gateway." },
      { kind: "ul", items: [
        "Per-task container lifecycle — spawned, executed, destroyed",
        "Filesystem isolated to a tmpfs scratch dir",
        "Outbound network blocked by default; allowlist per-job",
        "Zero logs retained by default; opt-in retention for debugging",
      ]},
    ],
  },
  receipts: {
    title: "Signed receipts",
    kicker: "Guarantees",
    body: [
      { kind: "p", text: "Every completed task produces a cryptographic receipt: hash of inputs, hash of outputs, signature from the executing node, and a co-signature from our coordinator. Receipts are streamed to your account and exportable as JSONL." },
      { kind: "code", lang: "bash", text: "cc receipts export --job=job_a1b2c3 --format=jsonl > audit.jsonl" },
    ],
  },
  "provider-install": {
    title: "Install the agent",
    kicker: "Providers",
    body: [
      { kind: "p", text: "The provider agent is a signed, notarised macOS menu-bar app. Download, drag into /Applications, sign in. No terminal required." },
      { kind: "callout", tone: "blue", text: "Requires macOS 14 Sonoma or newer and an M1 or later Apple Silicon chip." },
    ],
  },
  "provider-earnings": {
    title: "Earnings",
    kicker: "Providers",
    body: [
      { kind: "p", text: "You earn a per-task share of every job you complete. Rates scale with model size, throughput, and reliability. Your earnings dashboard shows realtime dollars-per-hour across the last 7, 30, and 90 days." },
      { kind: "p", text: "Electricity costs are subtracted automatically using measured wall-power draw and your local utility rate. The number you see is net." },
    ],
  },
  "provider-payouts": {
    title: "Payouts",
    kicker: "Providers",
    body: [
      { kind: "p", text: "Weekly payouts in USD via ACH (US), Wise (international), or USDC. Minimum payout is $10. No fees." },
    ],
  },
};
