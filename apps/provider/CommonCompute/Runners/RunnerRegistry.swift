import Foundation

// Per-engine concurrency limits.
// Each engine gets one slot initially; widened when telemetry shows stable thermals.
private let engineCapacity: [EngineClass: Int] = [
    .ane:          1,
    .gpu:          1,
    .videoToolbox: 1,
    .cpu:          4,
]

// RunnerRegistry tracks in-flight tasks per engine and enforces concurrency caps.
// It also vends the runtime ID list for the CapabilityProfile advertisement.
actor RunnerRegistry {
    private var inFlight: [EngineClass: Int] = [:]
    private var continuations: [EngineClass: [CheckedContinuation<Void, Never>]] = [:]

    // MARK: - Acquire / release

    func acquire(engine: EngineClass) async {
        let cap = engineCapacity[engine] ?? 1
        if (inFlight[engine] ?? 0) < cap {
            inFlight[engine, default: 0] += 1
            return
        }
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            continuations[engine, default: []].append(cont)
        }
        inFlight[engine, default: 0] += 1
    }

    func release(engine: EngineClass) {
        inFlight[engine, default: 1] -= 1
        if var waiting = continuations[engine], !waiting.isEmpty {
            let cont = waiting.removeFirst()
            continuations[engine] = waiting
            cont.resume()
        }
    }

    // MARK: - Telemetry snapshot

    func inFlightCounts() -> [String: Int] {
        Dictionary(uniqueKeysWithValues: inFlight.map { (k, v) in (k.rawValue, v) })
    }

    // MARK: - Capability advertisement

    static func advertisedRuntimeIds(for profile: CapabilityProfile) -> [String] {
        var ids: [String] = []
        if WhisperANERunner.canRun(on: profile) { ids.append(WhisperANERunner.runtimeId) }
        if CoreMLEmbeddingRunner.canRun(on: profile) { ids.append(CoreMLEmbeddingRunner.runtimeId) }
        if CoreMLVisionRunner.canRun(on: profile) { ids.append(CoreMLVisionRunner.runtimeId) }
        if VideoToolboxRunner.canRun(on: profile) { ids.append(VideoToolboxRunner.runtimeId) }
        if MLXInferenceRunner.canRun(on: profile) { ids.append(MLXInferenceRunner.runtimeId) }
        if MLXImageRunner.canRun(on: profile) { ids.append(MLXImageRunner.runtimeId) }
        return ids
    }
}
