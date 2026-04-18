import type { Env } from './types';

// One DeviceSession Durable Object per connected provider device.
// Holds a hibernatable WebSocket; proxies task assignments from RouterShard to device.
export class DeviceSession implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private ws: WebSocket | null = null;
  private deviceId: string | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade from the provider app.
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request);
    }

    // Internal push from RouterShard.
    if (url.pathname === '/push' && request.method === 'POST') {
      return this.handlePush(request);
    }

    return new Response('Not found', { status: 404 });
  }

  // MARK: - WebSocket

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

    this.state.acceptWebSocket(server);
    this.ws = server;
    this.deviceId = request.headers.get('X-Device-Id');

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const text = typeof message === 'string' ? message : new TextDecoder().decode(message);
    let envelope: { type: string; payload?: unknown; active_task_ids?: string[] };
    try {
      envelope = JSON.parse(text);
    } catch {
      return;
    }

    switch (envelope.type) {
      case 'capability':
        await this.handleCapabilityUpdate(envelope.payload);
        break;
      case 'heartbeat':
        await this.handleHeartbeat(envelope);
        break;
      case 'progress':
        await this.handleProgress(envelope.payload);
        break;
      case 'complete':
        await this.handleComplete(envelope.payload);
        break;
      case 'failed':
        await this.handleFailed(envelope.payload);
        break;
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    this.ws = null;
    // Mark device as inactive; leases will expire naturally.
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    this.ws = null;
  }

  // MARK: - Message handlers

  private async handleCapabilityUpdate(capabilities: unknown): Promise<void> {
    if (!this.deviceId) return;
    await this.env.DB.prepare(
      `UPDATE devices SET capabilities = ?, last_heartbeat_at = ? WHERE id = ?`
    )
      .bind(JSON.stringify(capabilities), Date.now(), this.deviceId)
      .run();
  }

  private async handleHeartbeat(envelope: {
    payload?: unknown;
    active_task_ids?: string[];
  }): Promise<void> {
    if (!this.deviceId) return;
    const taskType = await this.getDeviceTaskType();
    if (!taskType) return;

    const shardId = this.env.ROUTER_SHARD.idFromName(taskType);
    const shard = this.env.ROUTER_SHARD.get(shardId);
    await shard.fetch('http://internal/heartbeat', {
      method: 'POST',
      body: JSON.stringify({
        device_id: this.deviceId,
        active_task_ids: envelope.active_task_ids ?? [],
        telemetry: envelope.payload,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleProgress(payload: unknown): Promise<void> {
    // Fan out progress to any customer WebSocket subscribers (Phase M4).
  }

  private async handleComplete(payload: unknown): Promise<void> {
    if (!this.deviceId) return;
    const result = payload as { task_id: string; result_uri: string; engine_used: string };
    const taskType = await this.getTaskType(result.task_id);
    if (!taskType) return;

    const shardId = this.env.ROUTER_SHARD.idFromName(taskType);
    const shard = this.env.ROUTER_SHARD.get(shardId);
    await shard.fetch('http://internal/complete', {
      method: 'POST',
      body: JSON.stringify({ task_id: result.task_id, device_id: this.deviceId, result_uri: result.result_uri }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleFailed(payload: unknown): Promise<void> {
    const { task_id } = payload as { task_id: string; reason: string };
    const taskType = await this.getTaskType(task_id);
    if (!taskType) return;

    const shardId = this.env.ROUTER_SHARD.idFromName(taskType);
    const shard = this.env.ROUTER_SHARD.get(shardId);
    await shard.fetch('http://internal/fail', {
      method: 'POST',
      body: JSON.stringify({ task_id }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // MARK: - Push from RouterShard

  private async handlePush(request: Request): Promise<Response> {
    const { message } = await request.json<{ device_id: string; message: unknown }>();
    const ws = this.state.getWebSockets()[0];
    if (ws) {
      ws.send(JSON.stringify(message));
    }
    return Response.json({ ok: true });
  }

  // MARK: - Helpers

  private async getDeviceTaskType(): Promise<string | null> {
    if (!this.deviceId) return null;
    const task = await this.env.DB.prepare(
      `SELECT t.type FROM task_leases tl
       JOIN tasks t ON t.id = tl.task_id
       WHERE tl.device_id = ? LIMIT 1`
    )
      .bind(this.deviceId)
      .first<{ type: string }>();
    return task?.type ?? null;
  }

  private async getTaskType(taskId: string): Promise<string | null> {
    const task = await this.env.DB.prepare(`SELECT type FROM tasks WHERE id = ?`)
      .bind(taskId)
      .first<{ type: string }>();
    return task?.type ?? null;
  }
}
