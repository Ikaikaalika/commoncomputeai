import Foundation
import UserNotifications

// UNUserNotificationCenter wrapper. Posts only the three allowlisted
// alerts defined in the plan — nothing else. Each alert is rate-limited
// with a timestamp in UserDefaults so the user can't get spammed.
//
// Permission is requested explicitly (from the onboarding tour) or
// implicitly the first time a post attempt is made.

@MainActor
final class NotificationManager: ObservableObject {
    static let shared = NotificationManager()
    private let center = UNUserNotificationCenter.current()

    @Published var authorized: Bool = false

    private init() {
        Task { await refreshAuthStatus() }
    }

    // Explicit permission prompt — called from the onboarding sheet.
    func requestPermission() async {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound])
            authorized = granted
        } catch {
            authorized = false
        }
    }

    func refreshAuthStatus() async {
        let settings = await center.notificationSettings()
        authorized = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
    }

    // ── Allowlisted alerts ───────────────────────────────────────────
    // Each alert has a stable id so macOS can replace pending copies,
    // and a cooldown so we never fire the same thing twice in a row.

    enum Alert: String {
        case offline = "cc.offline"
        case paused  = "cc.paused"
        case milestone = "cc.milestone"

        var cooldown: TimeInterval {
            switch self {
            case .offline:   return 30 * 60       // 30 min
            case .paused:    return 10 * 60       // 10 min
            case .milestone: return 0              // dedup per-threshold
            }
        }
    }

    func postOfflineWarning() async {
        await post(.offline,
            title: "Common Compute is offline",
            body: "Your Mac isn't earning right now. Open the app to see why.")
    }

    func postPaused(reason: String) async {
        await post(.paused,
            title: "Paused",
            body: reason)
    }

    func postMilestone(dollars: Int) async {
        let key = "milestone_\(dollars)"
        if UserDefaults.standard.bool(forKey: key) { return }
        UserDefaults.standard.set(true, forKey: key)
        await post(.milestone,
            title: "You just made $\(dollars)",
            body: "Common Compute is paying out for the work your Mac has been doing.",
            idSuffix: String(dollars))
    }

    // ── internals ────────────────────────────────────────────────────

    private func post(_ kind: Alert, title: String, body: String, idSuffix: String = "") async {
        if !authorized {
            await refreshAuthStatus()
            if !authorized { return }
        }
        if let last = UserDefaults.standard.object(forKey: "notif_last_\(kind.rawValue)") as? Date,
           kind.cooldown > 0, Date().timeIntervalSince(last) < kind.cooldown {
            return
        }
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        let req = UNNotificationRequest(
            identifier: kind.rawValue + (idSuffix.isEmpty ? "" : ".\(idSuffix)"),
            content: content,
            trigger: nil
        )
        do {
            try await center.add(req)
            UserDefaults.standard.set(Date(), forKey: "notif_last_\(kind.rawValue)")
        } catch {
            // Silent — notifications are never critical to core flow.
        }
    }
}
