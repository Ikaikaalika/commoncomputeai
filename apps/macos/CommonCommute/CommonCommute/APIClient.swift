import Foundation

final class APIClient {
    var baseURL: URL
    var token: String?

    init() {
        let environment = ProcessInfo.processInfo.environment
        let configuredBase = environment["COMMONCOMMUTE_API_BASE_URL"] ?? environment["API_BASE_URL"] ?? "http://127.0.0.1:8000"
        let trimmedBase = configuredBase.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        baseURL = URL(string: trimmedBase)!
    }

    func send<T: Decodable>(_ path: String, method: String = "GET", body: Data? = nil, response: T.Type) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, rawResponse) = try await URLSession.shared.data(for: request)
        if let httpResponse = rawResponse as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
            throw NSError(domain: "API", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: String(data: data, encoding: .utf8) ?? "Unknown API error"])
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
