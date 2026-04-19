import Foundation

// MARK: - DeviceState

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
    private var pendingJobs: [JobRecord] = []

    enum DeviceStatus: String {
        case disconnected, enrolling, connected, paused
    }

    func start(token: String, apiClient: APIClient) async {
        status = .enrolling
        statusError = nil
        let profile = CapabilityProber.probe(
            advertisedRuntimes: RunnerRegistry.advertisedRuntimeIds(for: CapabilityProber.probe(advertisedRuntimes: []))
        )
        capability = profile

        do {
            let enroll = try await apiClient.enroll(token: token, capability: profile)
            deviceId = enroll.deviceId
            guard let wsURL = URL(string: enroll.wsURL) else {
                statusError = "Invalid WS URL"
                status = .disconnected
                return
            }

            let hb = Heartbeat(
                deviceId: enroll.deviceId,
                token: token,
                routerWSURL: wsURL,
                capability: profile,
                telemetrySampler: telemetrySampler
            )
            await hb.setCallbacks(
                onAssigned: { [weak self] assignment in
                    Task { await self?.taskAssigned(assignment) }
                },
                onCancelled: { [weak self] taskId in
                    Task { await self?.taskCancelled(taskId) }
                }
            )
            heartbeat = hb
            status = .connected

            telemetryTask?.cancel()
            telemetryTask = Task {
                while !Task.isCancelled {
                    let t = await self.telemetrySampler.sample()
                    self.telemetry = t
                    if t.thermal == .serious || t.thermal == .critical {
                        if self.status == .connected { self.status = .paused }
                    } else if self.status == .paused {
                        // Resume only if not manually paused — AppViewModel owns that logic.
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

    func disconnect() {
        heartbeat = nil
        telemetryTask?.cancel()
        telemetryTask = nil
        activeTasks = [:]
        status = .disconnected
        statusError = nil
        capability = nil
        pendingJobs = []
    }

    func setPaused(_ paused: Bool) {
        if paused {
            if status == .connected { status = .paused }
        } else {
            if status == .paused { status = .connected }
        }
    }

    func drainPendingJobs() -> [JobRecord] {
        let jobs = pendingJobs
        pendingJobs = []
        return jobs
    }

    // MARK: - Task dispatch

    private func taskAssigned(_ assignment: TaskAssignment) {
        guard status == .connected else { return }
        activeTasks[assignment.id] = assignment
        Task { await dispatchTask(assignment) }
    }

    private func dispatchTask(_ assignment: TaskAssignment) async {
        let start = Date()
        guard let runner = await runnerRegistry.runner(for: assignment.type) else {
            await taskFailed(taskId: assignment.id, reason: "No runner for type: \(assignment.type)", startedAt: start)
            return
        }
        let engine = await runner.engineClass
        await runnerRegistry.acquire(engine: engine)
        defer { Task { await self.runnerRegistry.release(engine: engine) } }

        do {
            try await runner.prepare(task: assignment)
            let result = try await runner.execute { [weak self] fraction, message in
                guard let self else { return }
                let prog = RunnerProgress(taskId: assignment.id, fraction: fraction, message: message)
                Task { await self.heartbeat?.reportProgress(prog) }
            }
            pendingJobs.append(JobRecord(
                id: assignment.id,
                type: assignment.type,
                status: .completed,
                engineUsed: result.engineUsed,
                startedAt: start,
                completedAt: Date(),
                durationSeconds: result.durationSeconds,
                failureReason: nil
            ))
            await jobCompleted(result: result)
        } catch {
            await runner.teardown()
            await taskFailed(taskId: assignment.id, reason: error.localizedDescription, startedAt: start)
        }
    }

    private func taskCancelled(_ taskId: String) {
        activeTasks.removeValue(forKey: taskId)
    }

    private func jobCompleted(result: RunnerResult) async {
        activeTasks.removeValue(forKey: result.taskId)
        await heartbeat?.reportComplete(result)
    }

    private func taskFailed(taskId: String, reason: String, startedAt: Date) async {
        let taskType = activeTasks[taskId]?.type ?? "unknown"
        activeTasks.removeValue(forKey: taskId)
        pendingJobs.append(JobRecord(
            id: taskId,
            type: taskType,
            status: .failed,
            engineUsed: nil,
            startedAt: startedAt,
            completedAt: Date(),
            durationSeconds: nil,
            failureReason: reason
        ))
        await heartbeat?.reportFailed(taskId: taskId, reason: reason)
    }

    // Kept for external callers that don't track start time.
    func taskFailed(taskId: String, reason: String) async {
        await taskFailed(taskId: taskId, reason: reason, startedAt: Date())
    }
}

// MARK: - AppViewModel

@MainActor
final class AppViewModel: ObservableObject {

    enum ConnectionStatus: String {
        case disconnected, enrolling, reconnecting, connected, paused
    }

    // MARK: - Published

    @Published private(set) var session: UserSession?
    @Published private(set) var capability: CapabilityProfile?
    @Published private(set) var telemetry: LiveTelemetry?
    @Published private(set) var activeTasks: [TaskAssignment] = []
    @Published private(set) var connectionStatus: ConnectionStatus = .disconnected
    @Published private(set) var statusError: String?
    @Published private(set) var pauseReason: String?
    @Published private(set) var jobHistory: [JobRecord] = []
    @Published private(set) var earnings: EarningsSummary? = nil
    @Published var routineConfig: RoutineConfig = RoutineConfig()

    // Observable helpers the UI reads directly.
    let telemetryHistory = TelemetryHistory()
    let activityLog = ActivityLog()
    let router = AppRouter()

    // Track prior state so we only log/notify on transitions.
    private var lastConnectionStatus: ConnectionStatus = .disconnected
    private var lastPauseReason: String? = nil
    private var lastDisconnectAt: Date? = nil

    var statusLabel: String {
        switch connectionStatus {
        case .disconnected:  return "Disconnected"
        case .enrolling:     return "Connecting…"
        case .reconnecting:  return "Reconnecting…"
        case .connected:     return "Connected"
        case .paused:        return "Paused"
        }
    }

    // MARK: - Private

    let deviceState = DeviceState()
    let apiClient = APIClient()
    private var pollingTask: Task<Void, Never>?

    // MARK: - Init

    init() {
        session = KeychainStore.loadSession()
        if let data = UserDefaults.standard.data(forKey: "routineConfig"),
           let config = try? JSONDecoder().decode(RoutineConfig.self, from: data) {
            routineConfig = config
        }
        if let data = UserDefaults.standard.data(forKey: "jobHistory"),
           let jobs = try? JSONDecoder().decode([JobRecord].self, from: data) {
            jobHistory = jobs
        }
        if session != nil { connect() }
    }

    // MARK: - Auth

    func login(email: String, password: String) async throws {
        let response = try await apiClient.login(email: email, password: password)
        finishLogin(response)
    }

    func register(email: String, password: String, fullName: String) async throws {
        let response = try await apiClient.register(email: email, password: password, fullName: fullName)
        finishLogin(response)
    }

    private func finishLogin(_ response: LoginResponse) {
        let s = UserSession(
            token: response.token,
            userId: response.userId,
            email: response.email,
            fullName: response.fullName,
            expiresAt: Date().addingTimeInterval(Double(response.expiresIn))
        )
        KeychainStore.saveSession(s)
        session = s
        connect()
    }

    func signOut() {
        pollingTask?.cancel()
        pollingTask = nil
        KeychainStore.clearSession()
        session = nil
        capability = nil
        telemetry = nil
        activeTasks = []
        connectionStatus = .disconnected
        statusError = nil
        pauseReason = nil
        Task { await deviceState.disconnect() }
    }

    // MARK: - Connection

    func connect() {
        guard let session else { return }
        pollingTask?.cancel()
        pollingTask = Task {
            await deviceState.start(token: session.token, apiClient: apiClient)
            await pollLoop()
        }
    }

    func togglePause() {
        if connectionStatus == .paused {
            pauseReason = nil
            Task { await deviceState.setPaused(false) }
        } else {
            Task { await deviceState.setPaused(true) }
        }
    }

    // MARK: - Poll loop

    private func pollLoop() async {
        while !Task.isCancelled {
            async let cap = deviceState.capability
            async let tel = deviceState.telemetry
            async let tasks = Array(deviceState.activeTasks.values)
            async let st = deviceState.status
            async let err = deviceState.statusError
            async let newJobs = deviceState.drainPendingJobs()

            let (c, t, tk, s, e, jobs) = await (cap, tel, tasks, st, err, newJobs)
            capability = c
            telemetry = t
            activeTasks = tk
            statusError = e

            // Feed the history buffer so charts have data.
            if let t { telemetryHistory.record(t) }

            // Sync connection status + routine evaluation.
            switch s {
            case .disconnected:
                connectionStatus = .disconnected
            case .enrolling:
                connectionStatus = .enrolling
            case .connected:
                let (allowed, reason) = RoutineManager.shouldAcceptWork(config: routineConfig, telemetry: t)
                if allowed {
                    connectionStatus = .connected
                    pauseReason = nil
                    await deviceState.setPaused(false)
                } else {
                    connectionStatus = .paused
                    pauseReason = reason
                    await deviceState.setPaused(true)
                }
            case .paused:
                if pauseReason == nil { connectionStatus = .paused }
            }

            await noteStatusTransitions()

            for job in jobs { appendJob(job) }

            try? await Task.sleep(nanoseconds: 2_000_000_000)
        }
    }

    // MARK: - Status transition notifications + activity log

    private func noteStatusTransitions() async {
        defer {
            lastConnectionStatus = connectionStatus
            lastPauseReason = pauseReason
        }
        if connectionStatus != lastConnectionStatus {
            switch connectionStatus {
            case .connected:
                activityLog.connected()
                lastDisconnectAt = nil
            case .disconnected:
                activityLog.disconnected(reason: statusError)
                if lastDisconnectAt == nil { lastDisconnectAt = Date() }
            case .paused:
                if pauseReason != nil {
                    activityLog.paused(reason: pauseReason)
                    if routineConfig.enableNotifications, let reason = pauseReason {
                        await NotificationManager.shared.postPaused(reason: reason)
                    }
                }
            case .enrolling, .reconnecting:
                break
            }
        } else if connectionStatus == .paused, pauseReason != lastPauseReason {
            // Pause reason changed while still paused (e.g. thermal → schedule).
            if let reason = pauseReason {
                activityLog.paused(reason: reason)
            }
        }

        // Offline notification after 5 min disconnected.
        if connectionStatus == .disconnected,
           let since = lastDisconnectAt,
           Date().timeIntervalSince(since) > 5 * 60,
           routineConfig.enableNotifications {
            await NotificationManager.shared.postOfflineWarning()
            lastDisconnectAt = Date()  // suppress until next 5-min gap
        }
    }

    // MARK: - Job history

    private func appendJob(_ job: JobRecord) {
        jobHistory.insert(job, at: 0)
        if jobHistory.count > 200 { jobHistory = Array(jobHistory.prefix(200)) }

        // Feed the Dashboard activity feed.
        switch job.status {
        case .completed: activityLog.taskCompleted(type: job.type, duration: job.durationSeconds)
        case .failed:    activityLog.taskFailed(type: job.type, reason: job.failureReason ?? "Unknown error")
        }

        persistJobHistory()
    }

    func clearJobHistory() {
        jobHistory = []
        UserDefaults.standard.removeObject(forKey: "jobHistory")
    }

    var jobsToday: Int {
        let today = Calendar.current.startOfDay(for: Date())
        return jobHistory.filter { $0.startedAt >= today && $0.status == .completed }.count
    }

    var failedToday: Int {
        let today = Calendar.current.startOfDay(for: Date())
        return jobHistory.filter { $0.startedAt >= today && $0.status == .failed }.count
    }

    var avgJobDuration: String {
        let durations = jobHistory.prefix(50).compactMap { $0.durationSeconds }
        guard !durations.isEmpty else { return "–" }
        let avg = durations.reduce(0, +) / Double(durations.count)
        return avg < 60 ? "\(Int(avg))s" : "\(Int(avg / 60))m"
    }

    private func persistJobHistory() {
        if let data = try? JSONEncoder().encode(Array(jobHistory.prefix(100))) {
            UserDefaults.standard.set(data, forKey: "jobHistory")
        }
    }

    // MARK: - Routine config

    func saveRoutineConfig(_ config: RoutineConfig) {
        routineConfig = config
        if let data = try? JSONEncoder().encode(config) {
            UserDefaults.standard.set(data, forKey: "routineConfig")
        }
    }

    // MARK: - Launch at login

    func setLaunchAtLogin(_ enabled: Bool) {
        LaunchAtLoginManager.setEnabled(enabled)
        var updated = routineConfig
        updated.launchAtLogin = enabled
        saveRoutineConfig(updated)
    }
}
