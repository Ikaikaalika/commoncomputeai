import Foundation
import Accelerate

// CPU benchmark runner — uses vDSP SGEMM to prove the CPU is being exercised.
// Returns a checksum so the result is verifiable.
actor CPUBenchRunner: WorkloadRunner {
    static let runtimeId = "cpu_bench"
    static let engine: EngineClass = .cpu

    static func canRun(on profile: CapabilityProfile) -> Bool { true }

    private var task: TaskAssignment?

    func prepare(task: TaskAssignment) async throws {
        self.task = task
    }

    func execute(progress: @escaping (Double, String?) -> Void) async throws -> RunnerResult {
        guard let task else { throw RunnerError.notPrepared }
        let start = Date()

        // 256×256 single-precision matrix multiply repeated 10 times via vDSP.
        let n = 256
        let count = n * n
        var a = [Float](repeating: 0, count: count)
        var b = [Float](repeating: 0, count: count)
        var c = [Float](repeating: 0, count: count)

        for i in 0..<count {
            a[i] = Float(i % n + 1) / Float(n)
            b[i] = Float(n - i % n) / Float(n)
        }

        progress(0.0, "CPU: 256×256 SGEMM ×10 (Accelerate/vDSP)")

        let iterations = 10
        for i in 0..<iterations {
            vDSP_mmul(a, 1, b, 1, &c, 1,
                      vDSP_Length(n), vDSP_Length(n), vDSP_Length(n))
            progress(Double(i + 1) / Double(iterations),
                     "Iteration \(i + 1)/\(iterations)")
        }

        var checksum: Float = 0
        vDSP_sve(c, 1, &checksum, vDSP_Length(count))

        progress(1.0, String(format: "Done — checksum %.4f", checksum))

        return RunnerResult(
            taskId: task.id,
            resultURI: task.resultPutURL ?? "cpu://bench/\(task.id)",
            durationSeconds: Date().timeIntervalSince(start),
            engineUsed: Self.runtimeId
        )
    }

    func teardown() async {
        task = nil
    }
}
