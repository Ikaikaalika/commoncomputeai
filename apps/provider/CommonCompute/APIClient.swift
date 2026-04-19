import Foundation

final class APIClient {
    let baseURL: URL

    init() {
        let env = ProcessInfo.processInfo.environment
        let raw = env["COMMONCOMPUTE_API_BASE_URL"] ?? env["API_BASE_URL"] ?? "https://api.commoncompute.ai"
        let trimmed = raw.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        baseURL = URL(string: trimmed)!
    }

    // MARK: - Generic request

    func send<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: Encodable? = nil,
        token: String? = nil,
        responseType: T.Type
    ) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = token {
            request.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        let (data, raw) = try await URLSession.shared.data(for: request)
        if let http = raw as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            let msg = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
                ?? String(data: data, encoding: .utf8)
                ?? "HTTP \(http.statusCode)"
            throw APIError.httpError(http.statusCode, msg)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - Auth

    func login(email: String, password: String) async throws -> LoginResponse {
        try await send(
            "v1/auth/login",
            method: "POST",
            body: LoginRequest(email: email, password: password),
            responseType: LoginResponse.self
        )
    }

    func register(email: String, password: String, fullName: String) async throws -> LoginResponse {
        try await send(
            "v1/auth/register",
            method: "POST",
            body: RegisterRequest(email: email, password: password, full_name: fullName),
            responseType: LoginResponse.self
        )
    }

    // MARK: - Provider

    func enroll(token: String, capability: CapabilityProfile) async throws -> EnrollResponse {
        try await send(
            "v1/providers/enroll",
            method: "POST",
            body: EnrollRequest(capability: capability),
            token: token,
            responseType: EnrollResponse.self
        )
    }
}

enum APIError: LocalizedError {
    case httpError(Int, String)

    var errorDescription: String? {
        switch self {
        case .httpError(let code, let msg): return "\(msg) (HTTP \(code))"
        }
    }
}
