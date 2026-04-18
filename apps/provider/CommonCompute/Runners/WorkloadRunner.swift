import Foundation

// Engine class determines which hardware block a runner targets.
// Multiple runners with different engines can execute concurrently on the same Mac.
enum EngineClass: String, Codable {
    case ane              // Apple Neural Engine — CoreML, Whisper
    case gpu              // Metal / MLX — GPU-backed inference
    case videoToolbox     // Hardware media engines (VT)
    case cpu              // Fallback / CPU-only work
}

// All runners implement this protocol.
// Runners are Swift actors so their internal state is automatically isolated.
protocol WorkloadRunner: Actor {
    /// Stable identifier sent in the device capability advertisement.
    static var runtimeId: String { get }
    /// Which hardware block this runner uses.
    static var engine: EngineClass { get }
    /// Returns true if the host's capability profile satisfies runner requirements.
    static func canRun(on profile: CapabilityProfile) -> Bool

    /// Called once before execute; download model weights, allocate session, etc.
    func prepare(task: TaskAssignment) async throws
    /// Run the workload. Call `progress` periodically with (0…1, optional log message).
    func execute(progress: @escaping (Double, String?) -> Void) async throws -> RunnerResult
    /// Clean up after execute (success or failure).
    func teardown() async
}

// MARK: - Runner errors

enum RunnerError: LocalizedError {
    case notPrepared
    case unsupportedCodec(String)
    case modelLoadFailed(String)
    case executionFailed(String)
    case cancelled

    var errorDescription: String? {
        switch self {
        case .notPrepared: return "Runner not prepared"
        case .unsupportedCodec(let c): return "Unsupported codec: \(c)"
        case .modelLoadFailed(let m): return "Model load failed: \(m)"
        case .executionFailed(let r): return "Execution failed: \(r)"
        case .cancelled: return "Task cancelled"
        }
    }
}
