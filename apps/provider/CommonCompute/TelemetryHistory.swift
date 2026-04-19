import Foundation

// Ring buffer of recent telemetry samples, used by the Dashboard
// utilization charts. Capped to the last 30 minutes at the 2-second
// sampling cadence = 900 points, which is cheap to hold in memory
// and still gives a usable timeline.
//
// @MainActor so SwiftUI can read `snapshot()` directly from the UI
// thread without hopping actors — telemetry is written infrequently
// relative to render rate so the cost is negligible.

@MainActor
final class TelemetryHistory: ObservableObject {
    struct Point: Identifiable {
        let id = UUID()
        let t: Date
        let cpu: Double
        let gpu: Double
        let ane: Double
        let thermal: ThermalState
    }

    @Published private(set) var points: [Point] = []
    private let cap = 900

    func record(_ sample: LiveTelemetry) {
        let p = Point(
            t: Date(),
            cpu: sample.cpu.performanceUtilization,
            gpu: sample.gpuUtilization,
            ane: sample.aneUtilizationInferred ?? 0,
            thermal: sample.thermal
        )
        points.append(p)
        if points.count > cap { points.removeFirst(points.count - cap) }
    }

    func clear() { points.removeAll() }
}
