import Foundation

// HTTP client for v1 API endpoints (enroll, auth).
// WebSocket connectivity is handled by Heartbeat.swift.
final class APIClient {
    let baseURL: URL

    init() {
        let env = ProcessInfo.processInfo.environment
        let raw = env["COMMONCOMPUTE_API_BASE_URL"] ?? env["API_BASE_URL"] ?? "http://127.0.0.1:8787"
        let trimmed = raw.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        baseURL = URL(string: trimmed)!
    }

    func send<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: Encodable? = nil,
        apiKey: String? = nil,
        responseType: T.Type
    ) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let key = apiKey {
            request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        let (data, raw) = try await URLSession.shared.data(for: request)
        if let http = raw as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            let msg = String(data: data, encoding: .utf8) ?? "HTTP \(http.statusCode)"
            throw APIError.httpError(http.statusCode, msg)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    func enroll(apiKey: String, capability: CapabilityProfile) async throws -> EnrollResponse {
        try await send(
            "v1/providers/enroll",
            method: "POST",
            body: EnrollRequest(capability: capability),
            apiKey: apiKey,
            responseType: EnrollResponse.self
        )
    }
}

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

enum APIError: LocalizedError {
    case httpError(Int, String)

    var errorDescription: String? {
        switch self {
        case .httpError(let code, let msg): return "HTTP \(code): \(msg)"
        }
    }
}
