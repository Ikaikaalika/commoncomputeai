import Foundation

@MainActor
final class AppViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var fullName = ""
    @Published var deviceName = Host.current().localizedName ?? "My Mac"
    @Published var cpuCores = max(ProcessInfo.processInfo.processorCount, 4)
    @Published var memoryGB = 16
    @Published var gpuClass = "Apple Silicon"
    @Published var output = "Welcome to Common Compute"
    @Published var token = ""
    @Published var deviceID: Int?
    @Published var currentTask: TaskPayload?
    @Published var accruedEarningsCents = 0

    private let api = APIClient()

    func registerProvider() async {
        do {
            let payload: [String: Any] = [
                "email": email,
                "password": password,
                "full_name": fullName,
                "role": "provider"
            ]
            let data = try JSONSerialization.data(withJSONObject: payload)
            let response = try await api.send("auth/register", method: "POST", body: data, response: AuthResponse.self)
            token = response.token
            api.token = response.token
            output = "Registered provider \(response.full_name)"
        } catch {
            output = error.localizedDescription
        }
    }

    func loginProvider() async {
        do {
            let payload: [String: Any] = ["email": email, "password": password]
            let data = try JSONSerialization.data(withJSONObject: payload)
            let response = try await api.send("auth/login", method: "POST", body: data, response: AuthResponse.self)
            token = response.token
            api.token = response.token
            output = "Logged in as \(response.full_name)"
        } catch {
            output = error.localizedDescription
        }
    }

    func enrollDevice() async {
        do {
            let payload: [String: Any] = [
                "name": deviceName,
                "cpu_cores": cpuCores,
                "memory_gb": memoryGB,
                "gpu_class": gpuClass
            ]
            let data = try JSONSerialization.data(withJSONObject: payload)
            let response = try await api.send("providers/devices", method: "POST", body: data, response: Device.self)
            deviceID = response.id
            output = "Enrolled device \(response.name)"
        } catch {
            output = error.localizedDescription
        }
    }

    func pollTask() async {
        guard let deviceID else {
            output = "Enroll a device first"
            return
        }
        do {
            let payload: [String: Any] = ["device_id": deviceID]
            let data = try JSONSerialization.data(withJSONObject: payload)
            let response = try await api.send("worker/poll", method: "POST", body: data, response: PollResponse.self)
            currentTask = response.task
            output = response.task.map { "Claimed task #\($0.id)" } ?? "No tasks available"
        } catch {
            output = error.localizedDescription
        }
    }

    func completeTask() async {
        guard let currentTask else {
            output = "No current task"
            return
        }
        do {
            let payload: [String: Any] = ["result_uri": "local://result/\(currentTask.id)"]
            let data = try JSONSerialization.data(withJSONObject: payload)
            _ = try await api.send("worker/tasks/\(currentTask.id)/complete", method: "POST", body: data, response: TaskPayload.self)
            accruedEarningsCents += currentTask.payout_cents
            output = "Completed task #\(currentTask.id)"
            self.currentTask = nil
        } catch {
            output = error.localizedDescription
        }
    }
}
