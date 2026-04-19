export type PricingRow = {
  task: string;
  unit: string;
  batch: number | null;
  realtime: number | null;
  vs: string;
  savings: string;
};

export const PRICING: PricingRow[] = [
  { task: "Embeddings",       unit: "per 1M tokens",  batch: 0.009, realtime: 0.027, vs: "OpenAI text-embedding-3-small @ $0.02", savings: "55%" },
  { task: "Transcription",    unit: "per audio hour", batch: 0.18,  realtime: 0.54,  vs: "OpenAI Whisper API @ $0.36",            savings: "50%" },
  { task: "OCR",              unit: "per 1k pages",   batch: 0.85,  realtime: 2.50,  vs: "AWS Textract @ $1.50",                  savings: "43%" },
  { task: "Rerankers",        unit: "per 1k pairs",   batch: 0.04,  realtime: 0.12,  vs: "Cohere Rerank @ $0.10",                 savings: "60%" },
  { task: "Image captioning", unit: "per 1k images",  batch: 0.22,  realtime: 0.66,  vs: "GPT-4o vision @ ~$0.50",                savings: "56%" },
  { task: "Custom batch",     unit: "quoted",         batch: null,  realtime: null,  vs: "Bring-your-own model",                   savings: "—" },
];
