import type { DurableObjectState } from "@cloudflare/workers-types";

interface ProviderRuntimeState {
  provider_id: string;
  last_heartbeat_at: string | null;
  reserved_jobs: Record<string, number>;
}

interface ReservePayload {
  job_id: string;
  ttl_seconds: number;
}

interface HeartbeatPayload {
  provider_id: string;
}

export class ProviderDurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  private async loadState(): Promise<ProviderRuntimeState> {
    const current = await this.state.storage.get<ProviderRuntimeState>("provider-runtime-state");
    return (
      current ?? {
        provider_id: "",
        last_heartbeat_at: null,
        reserved_jobs: {}
      }
    );
  }

  private async saveState(nextState: ProviderRuntimeState): Promise<void> {
    await this.state.storage.put("provider-runtime-state", nextState);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/heartbeat") {
      const payload = (await request.json()) as HeartbeatPayload;
      const runtimeState = await this.loadState();
      runtimeState.provider_id = payload.provider_id;
      runtimeState.last_heartbeat_at = new Date().toISOString();
      await this.saveState(runtimeState);
      return Response.json({ ok: true, at: runtimeState.last_heartbeat_at });
    }

    if (request.method === "POST" && url.pathname === "/reserve") {
      const payload = (await request.json()) as ReservePayload;
      const runtimeState = await this.loadState();
      const now = Date.now();

      for (const [jobId, expiresAt] of Object.entries(runtimeState.reserved_jobs)) {
        if (expiresAt <= now) {
          delete runtimeState.reserved_jobs[jobId];
        }
      }

      if (Object.keys(runtimeState.reserved_jobs).length >= 1) {
        await this.saveState(runtimeState);
        return Response.json({ accepted: false, reason: "Provider already has reserved job" }, { status: 409 });
      }

      runtimeState.reserved_jobs[payload.job_id] = now + payload.ttl_seconds * 1000;
      await this.saveState(runtimeState);
      return Response.json({ accepted: true });
    }

    if (request.method === "POST" && url.pathname === "/release") {
      const payload = (await request.json()) as { job_id: string };
      const runtimeState = await this.loadState();
      delete runtimeState.reserved_jobs[payload.job_id];
      await this.saveState(runtimeState);
      return Response.json({ ok: true });
    }

    if (request.method === "GET" && url.pathname === "/status") {
      const runtimeState = await this.loadState();
      return Response.json(runtimeState);
    }

    return new Response("Not Found", { status: 404 });
  }
}
