import Foundation

struct AuthResponse: Codable {
    let token: String
    let user_id: Int
    let role: String
    let full_name: String
}

struct Device: Codable, Identifiable {
    let id: Int
    let user_id: Int
    let name: String
    let cpu_cores: Int
    let memory_gb: Int
    let gpu_class: String
    let status: String
    let reputation: Double
}

struct PollResponse: Codable {
    let task: TaskPayload?
}

struct TaskPayload: Codable, Identifiable {
    let id: Int
    let job_id: Int
    let status: String
    let workload_type: String
    let payload_json: String
    let payout_cents: Int
}
