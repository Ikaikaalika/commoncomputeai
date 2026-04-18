import Foundation
import VideoToolbox
import CoreMedia
import AVFoundation

// Hardware H.264 / HEVC / ProRes encode+decode via VideoToolbox.
// For >1 min clips the API sharding layer pre-splits at GOP boundaries;
// this runner receives a single segment.
actor VideoToolboxRunner: WorkloadRunner {
    static let runtimeId = "vt_transcode"
    static let engine: EngineClass = .videoToolbox

    static func canRun(on profile: CapabilityProfile) -> Bool {
        !profile.media.encoders.isEmpty && profile.media.engines > 0
    }

    private var task: TaskAssignment?

    func prepare(task: TaskAssignment) async throws {
        self.task = task
    }

    func execute(progress: @escaping (Double, String?) -> Void) async throws -> RunnerResult {
        guard let task else { throw RunnerError.notPrepared }
        let start = Date()

        // TODO Phase M2 implementation:
        // 1. Fetch codec + bitrate + preset from task requirements JSON
        // 2. Validate hardware codec support via VTIsHardwareDecodeSupported / encoder query
        // 3. Download source segment from R2 presigned GET → temp file
        // 4. Create AVAssetReader → VTCompressionSession (hardware encoder)
        // 5. Feed CMSampleBuffers from reader to compression session
        // 6. Report progress by tracking processed duration / total duration
        // 7. Mux compressed frames + audio to output container (mp4 / mov)
        // 8. Upload to task.resultPutURL
        // 9. Return RunnerResult

        for i in 1...5 {
            try? await Task.sleep(nanoseconds: 100_000_000)
            progress(Double(i) / 5.0, "Transcoding \(i * 20)%")
        }

        return RunnerResult(
            taskId: task.id,
            resultURI: task.resultPutURL ?? "r2://stub/\(task.id).mp4",
            durationSeconds: Date().timeIntervalSince(start),
            engineUsed: Self.runtimeId
        )
    }

    func teardown() async {
        task = nil
    }
}
