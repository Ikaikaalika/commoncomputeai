import type { DurableObjectState } from "@cloudflare/workers-types";
import type { AllocationRequest, AllocationResult, CandidateScore, ProviderSnapshot, WorkerEnv } from "../env";
import { hardFilterProviders, rankProviders } from "../lib/scoring";

interface RegisterProviderPayload {
  provider: ProviderSnapshot;
}

interface OfflineProviderPayload {
  provider_id: string;
  reason?: string;
}

interface MarketState {
  providers: Record<string, ProviderSnapshot>;
}

export class MarketDurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  private async loadState(): Promise<MarketState> {
    const current = await this.state.storage.get<MarketState>("market-state");
    return current ?? { providers: {} };
  }

  private async saveState(nextState: MarketState): Promise<void> {
    await this.state.storage.put("market-state", nextState);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/providers/register") {
      const payload = (await request.json()) as RegisterProviderPayload;
      const marketState = await this.loadState();
      marketState.providers[payload.provider.provider_id] = payload.provider;
      await this.saveState(marketState);
      return Response.json({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/providers/offline") {
      const payload = (await request.json()) as OfflineProviderPayload;
      const marketState = await this.loadState();
      if (marketState.providers[payload.provider_id]) {
        marketState.providers[payload.provider_id].status = "offline";
      }
      await this.saveState(marketState);
      return Response.json({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/allocate") {
      const payload = (await request.json()) as AllocationRequest;
      const marketState = await this.loadState();
      const providerPool = payload.candidates.length > 0 ? payload.candidates : Object.values(marketState.providers);
      const filtered = hardFilterProviders(payload.job_spec, providerPool);
      const ranked = rankProviders(payload.job_spec, filtered);

      if (ranked.length === 0) {
        const result: AllocationResult = {
          accepted: false,
          reason: "No compatible providers"
        };
        return Response.json(result, { status: 200 });
      }

      const primary = ranked[0];
      const standby = ranked[1] ?? null;
      const decision: AllocationResult["decision"] = {
        job_id: payload.job_id,
        selected_provider_id: primary.provider.provider_id,
        standby_provider_id: standby?.provider.provider_id ?? null,
        reservation_ttl_seconds: 30,
        score_breakdown: {
          reliability: primary.reliability,
          benchmark_fit: primary.benchmark_fit,
          price: primary.price,
          latency: primary.latency,
          uptime: primary.uptime,
          total: primary.total
        },
        price_per_gpu_hour_usd: primary.provider.price_per_gpu_hour_usd
      };

      const result: AllocationResult = {
        accepted: true,
        decision
      };

      return Response.json(result);
    }

    if (request.method === "GET" && url.pathname === "/providers") {
      const marketState = await this.loadState();
      const scoredProviders = Object.values(marketState.providers)
        .map((provider) => ({
          provider,
          score: provider.reliability_score
        }))
        .sort((a, b) => b.score - a.score);

      return Response.json({ providers: scoredProviders });
    }

    return new Response("Not Found", { status: 404 });
  }
}
