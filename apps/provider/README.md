# Common Compute — Provider App (Swift, macOS 14+, Apple Silicon)

SwiftUI menubar app + LaunchAgent daemon for Mac providers. Requires Apple Silicon.

## Generate the Xcode project

```bash
brew install xcodegen
cd apps/provider
xcodegen generate
open CommonCompute.xcodeproj
```

## Current features (legacy shell — Phase M1 rewrites this)
- Provider login / register
- Device enrollment
- Task polling via HTTP
- Task completion reporting

## Planned (Phase M1+)
- `CapabilityProfile` — exhaustive Apple Silicon introspection
- `LiveTelemetry` — real-time engine utilization
- `Heartbeat` — persistent WebSocket to Router Durable Object
- 6 workload runners: WhisperANE, CoreMLEmbedding, CoreMLVision, VideoToolbox, MLXInference, MLXImage
- LaunchAgent daemon (`ai.commoncompute.worker`) with XPC bridge to menubar app
