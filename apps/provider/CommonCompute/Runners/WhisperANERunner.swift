import Foundation
import CoreML

// Whisper Large v3 via CoreML with MLComputeUnits.all (routes to ANE + GPU).
// Model bundle: whisper-large-v3.mlpackage (bundled with app, or downloaded on first run).
actor WhisperANERunner: WorkloadRunner {
    static let runtimeId = "whisper_ane"
    static let engine: EngineClass = .ane

    static func canRun(on profile: CapabilityProfile) -> Bool {
        profile.ane.available
    }

    private var task: TaskAssignment?
    private var inputURL: URL?

    func prepare(task: TaskAssignment) async throws {
        self.task = task
        guard let uriString = task.inputURI, let url = URL(string: uriString) else {
            throw RunnerError.notPrepared
        }
        inputURL = url
    }

    func execute(progress: @escaping (Double, String?) -> Void) async throws -> RunnerResult {
        guard let task, let inputURL else { throw RunnerError.notPrepared }
        let start = Date()

        // TODO Phase M2 implementation:
        // 1. Load whisper.cpp CoreML model from app bundle
        // 2. Decode audio input from R2 presigned GET URL
        // 3. Run VAD chunking (for >10 min files, delegate to API sharding layer)
        // 4. Transcribe chunks using MLComputeUnits.all; stream segments via progress()
        // 5. Stitch transcript segments, serialize to JSON
        // 6. Upload result JSON to task.resultPutURL
        // 7. Return RunnerResult with R2 result URI

        // Stub: simulate progress for now.
        for i in 1...10 {
            try? await Task.sleep(nanoseconds: 100_000_000)
            progress(Double(i) / 10.0, "Transcribing chunk \(i)/10")
        }

        return RunnerResult(
            taskId: task.id,
            resultURI: task.resultPutURL ?? "r2://stub/\(task.id).json",
            durationSeconds: Date().timeIntervalSince(start),
            engineUsed: Self.runtimeId
        )
    }

    func teardown() async {
        task = nil
        inputURL = nil
    }
}
