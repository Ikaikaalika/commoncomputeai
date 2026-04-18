import Foundation
import Vision
import CoreML

// Vision tasks via ANE: CLIP ViT-B/32 embeddings, VNRecognizeTextRequest OCR,
// ImageNet classification. All use MLComputeUnits.all for ANE routing.
actor CoreMLVisionRunner: WorkloadRunner {
    static let runtimeId = "coreml_vision"
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
        // Dispatch on task type (from requirements.runtime detail):
        // - "clip_embed": load CLIP ViT-B/32 mlpackage; batch images; return embeddings
        // - "ocr": VNRecognizeTextRequest with revision .version3; return recognized text blocks
        // - "classify": ImageNet classifier; return top-5 labels + confidences
        // All upload JSON result to task.resultPutURL

        progress(0.5, "Running Vision model…")
        try? await Task.sleep(nanoseconds: 150_000_000)
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
