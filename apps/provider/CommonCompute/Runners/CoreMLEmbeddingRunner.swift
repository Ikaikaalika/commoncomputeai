import Foundation
import CoreML

// BGE-small / MiniLM / E5-base via CoreML with MLComputeUnits.all.
// Returns OpenAI-compatible embedding response {data:[{embedding, index}], model, usage}.
actor CoreMLEmbeddingRunner: WorkloadRunner {
    static let runtimeId = "coreml_embed"
    static let engine: EngineClass = .ane

    static func canRun(on profile: CapabilityProfile) -> Bool {
        profile.ane.available
    }

    private var task: TaskAssignment?

    func prepare(task: TaskAssignment) async throws {
        self.task = task
    }

    func execute(progress: @escaping (Double, String?) -> Void) async throws -> RunnerResult {
        guard let task else { throw RunnerError.notPrepared }
        let start = Date()

        // TODO Phase M2 implementation:
        // 1. Load model (BGE-small default; model name from task.requirements.runtime detail)
        // 2. Fetch input texts from R2 presigned GET (JSON array of strings)
        // 3. Batch inputs into groups of 32; tokenize with bundled tokenizer
        // 4. Run MLModel.prediction(from:) with MLComputeUnits.all
        // 5. Collect embeddings; assemble OpenAI-compatible response
        // 6. Upload JSON to task.resultPutURL
        // 7. Return RunnerResult

        progress(0.5, "Running embeddings…")
        try? await Task.sleep(nanoseconds: 200_000_000)
        progress(1.0, nil)

        return RunnerResult(
            taskId: task.id,
            resultURI: task.resultPutURL ?? "r2://stub/\(task.id).json",
            durationSeconds: Date().timeIntervalSince(start),
            engineUsed: Self.runtimeId
        )
    }

    func teardown() async {
        task = nil
    }
}
