import Foundation

// DeviceState owns all runtime state: capability, telemetry, tasks, and connectivity.
actor DeviceState {
    private(set) var capability: CapabilityProfile?
    let runnerRegistry = RunnerRegistry()
    private(set) var telemetry: LiveTelemetry?
    private(set) var activeTasks: [String: TaskAssignment] = [:]
    private(set) var deviceId: String?
    private(set) var status: DeviceStatus = .disconnected
    private(set) var statusError: String?

    private let telemetrySampler = LiveTelemetrySampler()
    private var heartbeat: Heartbeat?
    private var telemetryTask: Task<Void, Never>?

    enum DeviceStatus: String {
        case disconnected, enrolling, connected, paused
    }

    func start(apiKey: String, apiClient: APIClient) async {
        status = .enrolling
        statusError = nil
        let profile = CapabilityProber.probe(advertisedRuntimes: RunnerRegistry.advertisedRuntimeIds(for: CapabilityProber.probe(advertisedRuntimes: [])))
        capability = profile

        do {
            let enroll = try await apiClient.enroll(apiKey: apiKey, capability: profile)
            deviceId = enroll.deviceId
            guard let wsURL = URL(string: enroll.wsURL) else {
                statusError = "Invalid WS URL"
                status = .disconnected
                return
            }

            let hb = Heartbeat(
                deviceId: enroll.deviceId,
                apiKey: apiKey,
                routerWSURL: wsURL,
                capability: profile,
                telemetrySampler: telemetrySampler
            )
            await hb.onTaskAssigned = { [weak self] assignment in
                Task { await self?.taskAssigned(assignment) }
            }
            await hb.onTaskCancelled = { [weak self] taskId in
                Task { await self?.taskCancelled(taskId) }
            }
            heartbeat = hb
            status = .connected

            telemetryTask?.cancel()
            telemetryTask = Task {
                while !Task.isCancelled {
                    let t = await self.telemetrySampler.sample()
                    self.telemetry = t
                    if t.thermal == .serious || t.thermal == .critical {
                        self.status = .paused
                    } else if self.status == .paused {
                        self.status = .connected
                    }
                    try? await Task.sleep(nanoseconds: 2_000_000_000)
                }
            }

            await hb.connect()
        } catch {
            status = .disconnected
            statusError = error.localizedDescription
        }
    }

    private func taskAssigned(_ assignment: TaskAssignment) {
        activeTasks[assignment.id] = assignment
    }

    private func taskCancelled(_ taskId: String) {
        activeTasks.removeValue(forKey: taskId)
    }

    func taskCompleted(result: RunnerResult) async {
        activeTasks.removeValue(forKey: result.taskId)
        await heartbeat?.reportComplete(result)
    }

    func taskFailed(taskId: String, reason: String) async {
        activeTasks.removeValue(forKey: taskId)
        await heartbeat?.reportFailed(taskId: taskId, reason: reason)
    }
}

// MARK: - MenubarViewModel

// Thin @MainActor bridge exposing DeviceState to SwiftUI.
@MainActor
final class MenubarViewModel: ObservableObject {
    @Published private(set) var capability: CapabilityProfile?
    @Published private(set) var telemetry: LiveTelemetry?
    @Published private(set) var activeTasks: [TaskAssignment] = []
    @Published private(set) var statusLabel: String = "Disconnected"
    @Published private(set) var statusError: String?
    @Published var apiKey: String = ""

    let deviceState = DeviceState()
    let apiClient = APIClient()
    private var pollingTask: Task<Void, Never>?

    func connect() {
        guard !apiKey.isEmpty else { return }
        pollingTask?.cancel()
        pollingTask = Task {
            await deviceState.start(apiKey: apiKey, apiClient: apiClient)
            await pollLoop()
        }
    }

    private func pollLoop() async {
        while !Task.isCancelled {
            async let cap = deviceState.capability
            async let tel = deviceState.telemetry
            async let tasks = Array(deviceState.activeTasks.values)
            async let st = deviceState.status
            async let err = deviceState.statusError

            let (c, t, tk, s, e) = await (cap, tel, tasks, st, err)
            self.capability = c
            self.telemetry = t
            self.activeTasks = tk
            self.statusLabel = s.rawValue.capitalized
            self.statusError = e
            try? await Task.sleep(nanoseconds: 2_000_000_000)
        }
    }
}
