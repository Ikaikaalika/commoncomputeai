import Foundation

// MARK: - Auth / Session

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct RegisterRequest: Encodable {
    let email: String
    let password: String
    let full_name: String
}

struct LoginResponse: Decodable {
    let token: String
    let userId: String
    let email: String
    let fullName: String
    let expiresIn: Int

    enum CodingKeys: String, CodingKey {
        case token
        case userId = "user_id"
        case email
        case fullName = "full_name"
        case expiresIn = "expires_in"
    }
}

struct UserSession: Codable {
    let token: String
    let userId: String
    let email: String
    let fullName: String
    let expiresAt: Date
}

// MARK: - Earnings (M6 placeholder; populated once Stripe is wired)

struct EarningsSummary: Codable, Equatable {
    let todayUSD: Decimal
    let last7USD: Decimal
    let pendingUSD: Decimal
    let payouts: [PayoutRow]
}

struct PayoutRow: Codable, Equatable, Identifiable {
    let id: String
    let date: Date
    let amountUSD: Decimal
    let status: String
}

// MARK: - Job history

struct JobRecord: Codable, Identifiable {
    let id: String
    let type: String
    let status: JobStatus
    let engineUsed: String?
    let startedAt: Date
    let completedAt: Date?
    let durationSeconds: Double?
    let failureReason: String?

    enum JobStatus: String, Codable {
        case completed, failed
    }
}

// MARK: - Routine config

struct RoutineConfig: Codable, Equatable {
    var acOnlyMode: Bool = true
    var idleOnlyMode: Bool = false
    var idleThresholdMinutes: Int = 5
    var scheduledWindow: ScheduleWindow? = nil
    var priorityFilter: PriorityFilter = .all
    var launchAtLogin: Bool = false

    struct ScheduleWindow: Codable, Equatable {
        var enabled: Bool = false
        var startHour: Int = 21
        var endHour: Int = 6
    }

    enum PriorityFilter: String, Codable, CaseIterable, Equatable {
        case all = "All tasks"
        case standardAndPriority = "Standard & Priority"
        case priorityOnly = "Priority only"
    }
}

// MARK: - Capability

struct CPUCapabilities: Codable {
    let performanceCores: Int
    let efficiencyCores: Int
    let logical: Int

    enum CodingKeys: String, CodingKey {
        case performanceCores = "performance_cores"
        case efficiencyCores = "efficiency_cores"
        case logical
    }
}

struct GPUCapabilities: Codable {
    let family: String
    let cores: Int
    let metal3: Bool
    let recommendedMaxWorkingSetGB: Int

    enum CodingKeys: String, CodingKey {
        case family, cores
        case metal3 = "metal_3"
        case recommendedMaxWorkingSetGB = "recommended_max_working_set_gb"
    }
}

struct ANECapabilities: Codable {
    let available: Bool
    let generation: Int
    let tops: Double
}

struct MediaCapabilities: Codable {
    let encoders: [String]
    let decoders: [String]
    let engines: Int
}

struct CapabilityProfile: Codable {
    let chip: String
    let cpu: CPUCapabilities
    let gpu: GPUCapabilities
    let ane: ANECapabilities
    let media: MediaCapabilities
    let memoryGB: Int
    let runtimes: [String]
    let os: String
    var cluster: ClusterCapabilities?

    enum CodingKeys: String, CodingKey {
        case chip, cpu, gpu, ane, media, cluster, os, runtimes
        case memoryGB = "memory_gb"
    }
}

struct ClusterCapabilities: Codable {
    let id: String
    let role: String
    let peers: [String]
    let interconnect: String
    let aggregateMemoryGB: Int
    let aggregateGPUCores: Int
    let peerBandwidthGbps: Double

    enum CodingKeys: String, CodingKey {
        case id, role, peers, interconnect
        case aggregateMemoryGB = "aggregate_memory_gb"
        case aggregateGPUCores = "aggregate_gpu_cores"
        case peerBandwidthGbps = "peer_bandwidth_gbps"
    }
}

// MARK: - Live telemetry

struct CPUTelemetry: Codable {
    let performanceUtilization: Double
    let efficiencyUtilization: Double

    enum CodingKeys: String, CodingKey {
        case performanceUtilization = "performance_utilization"
        case efficiencyUtilization = "efficiency_utilization"
    }
}

enum ThermalState: String, Codable {
    case nominal, fair, serious, critical
}

enum PowerSource: String, Codable {
    case ac, battery, unknown
}

struct LiveTelemetry: Codable {
    let cpu: CPUTelemetry
    let gpuUtilization: Double
    let memoryPressure: String
    let thermal: ThermalState
    let power: PowerSource
    let batteryPercent: Double?
    let userIdleSeconds: Double
    let engineInFlight: [String: Int]
    let aneUtilizationInferred: Double?
    let timestamp: Double

    enum CodingKeys: String, CodingKey {
        case cpu, thermal, power, timestamp
        case gpuUtilization = "gpu_utilization"
        case memoryPressure = "memory_pressure"
        case batteryPercent = "battery_percent"
        case userIdleSeconds = "user_idle_seconds"
        case engineInFlight = "engine_in_flight"
        case aneUtilizationInferred = "ane_utilization_inferred"
    }
}

// MARK: - Task assignment

enum TaskPriority: String, Codable {
    case batch, standard, priority
}

struct TaskRequirements: Codable {
    let runtime: String
    let prefersANE: Bool?
    let minReliability: Double?
    let minVRAMGB: Int?

    enum CodingKeys: String, CodingKey {
        case runtime
        case prefersANE = "prefers_ane"
        case minReliability = "min_reliability"
        case minVRAMGB = "min_vram_gb"
    }
}

struct TaskAssignment: Codable, Identifiable {
    let id: String
    let type: String
    let requirements: TaskRequirements
    let priority: TaskPriority
    let inputURI: String?
    let resultPutURL: String?
    let leaseExpiresAt: Double
    let attempt: Int

    enum CodingKeys: String, CodingKey {
        case id, type, requirements, priority, attempt
        case inputURI = "input_uri"
        case resultPutURL = "result_put_url"
        case leaseExpiresAt = "lease_expires_at"
    }
}

// MARK: - Runner progress + result

struct RunnerProgress: Codable {
    let taskId: String
    let fraction: Double
    let message: String?

    enum CodingKeys: String, CodingKey {
        case taskId = "task_id"
        case fraction, message
    }
}

struct RunnerResult: Codable {
    let taskId: String
    let resultURI: String
    let durationSeconds: Double
    let engineUsed: String

    enum CodingKeys: String, CodingKey {
        case taskId = "task_id"
        case resultURI = "result_uri"
        case durationSeconds = "duration_seconds"
        case engineUsed = "engine_used"
    }
}

// MARK: - Enroll

struct EnrollRequest: Encodable {
    let capability: CapabilityProfile
}

struct EnrollResponse: Decodable {
    let deviceId: String
    let wsURL: String

    enum CodingKeys: String, CodingKey {
        case deviceId = "device_id"
        case wsURL = "ws_url"
    }
}
