import Foundation
import Security

enum KeychainStore {
    private static let service = "ai.commoncompute.app"

    static func save(_ data: Data, account: String) {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
        ]
        SecItemDelete(query as CFDictionary)
        var insert = query
        insert[kSecValueData] = data
        SecItemAdd(insert as CFDictionary, nil)
    }

    static func load(account: String) -> Data? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess else { return nil }
        return result as? Data
    }

    static func delete(account: String) {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
        ]
        SecItemDelete(query as CFDictionary)
    }

    static func saveSession(_ session: UserSession) {
        guard let data = try? JSONEncoder().encode(session) else { return }
        save(data, account: "user_session")
    }

    static func loadSession() -> UserSession? {
        guard let data = load(account: "user_session") else { return nil }
        return try? JSONDecoder().decode(UserSession.self, from: data)
    }

    static func clearSession() {
        delete(account: "user_session")
    }
}
