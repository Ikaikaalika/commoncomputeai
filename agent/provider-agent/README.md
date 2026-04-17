# Provider Agent (Rust)

Cross-platform provider agent for Windows, Linux, and macOS.

## What it does

- Registers provider capabilities with the control plane.
- Sends heartbeat status updates.
- Polls for reserved jobs.
- Starts, runs, and completes/fails jobs.
- Uses per-platform runtime adapters:
  - Linux: rootless container runtime (stub)
  - Windows: WSL2-backed adapter (stub)
  - macOS: limited Metal profile (stub)

## Quick start

```bash
cd /Users/tylergee/Documents/commoncomputeai/agent/provider-agent
cargo run -- \
  --api-base http://127.0.0.1:8787 \
  --api-token <PROVIDER_BEARER_TOKEN> \
  --provider-id <PROVIDER_ID>
```

Environment variables are supported via `COMMONCOMPUTE_*` settings in `src/config.rs`.
