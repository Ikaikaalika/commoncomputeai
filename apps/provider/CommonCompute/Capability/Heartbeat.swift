import Foundation

// Persistent WebSocket connection from provider to the Router's DeviceSession Durable Object.
// Sends capability + telemetry on connect; heartbeats every 10s.
// Reconnects with exponential backoff (1s → 30s cap).
actor Heartbeat {
    private let deviceId: String
    private let apiKey: String
    private let routerWSURL: URL
    private let capability: CapabilityProfile
    private let telemetrySampler: LiveTelemetrySampler

    private var task: URLSessionWebSocketTask?
    private var heartbeatTimer: Task<Void, Never>?
    private var reconnectDelay: Double = 1.0
    private var activeTaskIds: [String] = []

    var onTaskAssigned: ((TaskAssignment) -> Void)?
    var onTaskCancelled: ((String) -> Void)?

    init(
        deviceId: String,
        apiKey: String,
        routerWSURL: URL,
        capability: CapabilityProfile,
        telemetrySampler: LiveTelemetrySampler
    ) {
        self.deviceId = deviceId
        self.apiKey = apiKey
        self.routerWSURL = routerWSURL
        self.capability = capability
        self.telemetrySampler = telemetrySampler
    }

    func setCallbacks(
        onAssigned: @escaping (TaskAssignment) -> Void,
        onCancelled: @escaping (String) -> Void
    ) {
        self.onTaskAssigned = onAssigned
        self.onTaskCancelled = onCancelled
    }

    // MARK: - Connect

    func connect() async {
        var request = URLRequest(url: routerWSURL)
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue(deviceId, forHTTPHeaderField: "X-Device-Id")

        let ws = URLSession.shared.webSocketTask(with: request)
        self.task = ws
        ws.resume()

        // Send capability profile immediately on connect.
        await sendJSON(["type": "capability", "payload": encodable(capability)])

        // Start heartbeat loop.
        heartbeatTimer?.cancel()
        heartbeatTimer = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 10_000_000_000)
                await sendHeartbeat()
            }
        }

        // Listen for incoming messages.
        await receiveLoop(ws: ws)
    }

    // MARK: - Reconnect

    private func scheduleReconnect() async {
        task = nil
        heartbeatTimer?.cancel()
        let delay = reconnectDelay
        reconnectDelay = min(reconnectDelay * 2, 30)
        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        await connect()
    }

    // MARK: - Heartbeat

    private func sendHeartbeat() async {
        let telemetry = await telemetrySampler.sample()
        await sendJSON([
            "type": "heartbeat",
            "payload": encodable(telemetry),
            "active_task_ids": activeTaskIds as Any
        ])
    }

    // MARK: - Task state updates

    func reportProgress(_ progress: RunnerProgress) async {
        await sendJSON(["type": "progress", "payload": encodable(progress)])
    }

    func reportComplete(_ result: RunnerResult) async {
        activeTaskIds.removeAll { $0 == result.taskId }
        await sendJSON(["type": "complete", "payload": encodable(result)])
    }

    func reportFailed(taskId: String, reason: String) async {
        activeTaskIds.removeAll { $0 == taskId }
        await sendJSON(["type": "failed", "payload": ["task_id": taskId, "reason": reason]])
    }

    // MARK: - Receive loop

    private func receiveLoop(ws: URLSessionWebSocketTask) async {
        while !Task.isCancelled {
            do {
                let message = try await ws.receive()
                switch message {
                case .string(let text):
                    handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        handleMessage(text)
                    }
                @unknown default:
                    break
                }
            } catch {
                // WebSocket closed or errored; reconnect.
                reconnectDelay = 1.0
                await scheduleReconnect()
                return
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let envelope = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = envelope["type"] as? String
        else { return }

        let payload = envelope["payload"] as? [String: Any]

        switch type {
        case "assign":
            if let payloadDict = payload,
               let assignData = try? JSONSerialization.data(withJSONObject: payloadDict),
               let assignment = try? JSONDecoder().decode(TaskAssignment.self, from: assignData) {
                activeTaskIds.append(assignment.id)
                onTaskAssigned?(assignment)
            }
        case "cancel":
            if let taskId = payload?["task_id"] as? String {
                onTaskCancelled?(taskId)
            }
        default:
            break
        }
    }

    // MARK: - Send helpers

    private func sendJSON(_ dict: [String: Any]) async {
        guard let task, task.state == .running,
              let data = try? JSONSerialization.data(withJSONObject: dict),
              let text = String(data: data, encoding: .utf8)
        else { return }
        try? await task.send(.string(text))
    }

    private func encodable<T: Encodable>(_ value: T) -> Any {
        guard let data = try? JSONEncoder().encode(value),
              let obj = try? JSONSerialization.jsonObject(with: data)
        else { return [:] }
        return obj
    }
}

// MARK: - Long-poll fallback

// Used when WebSocket is unavailable. Polls /v1/providers/poll every 5s.
actor LongPollFallback {
    private let baseURL: URL
    private let apiKey: String
    private let deviceId: String
    var onTaskAssigned: ((TaskAssignment) -> Void)?

    init(baseURL: URL, apiKey: String, deviceId: String) {
        self.baseURL = baseURL
        self.apiKey = apiKey
        self.deviceId = deviceId
    }

    func start() async {
        while !Task.isCancelled {
            await pollOnce()
            try? await Task.sleep(nanoseconds: 5_000_000_000)
        }
    }

    private func pollOnce() async {
        var req = URLRequest(url: baseURL.appendingPathComponent("v1/providers/poll"))
        req.httpMethod = "POST"
        req.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["device_id": deviceId])

        guard let (data, _) = try? await URLSession.shared.data(for: req),
              let assignment = try? JSONDecoder().decode(TaskAssignment.self, from: data)
        else { return }
        onTaskAssigned?(assignment)
    }
}
