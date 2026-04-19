import Foundation

// Human-readable event feed for the Dashboard.
// Events go in with plain-English sentences already formatted — the
// view just renders timestamp + text. Keeps the UI layer simple and
// the translation logic centralized here.

@MainActor
final class ActivityLog: ObservableObject {
    enum Kind {
        case started, completed, failed, paused, resumed, connected, disconnected, info
    }

    struct Entry: Identifiable {
        let id = UUID()
        let at: Date
        let kind: Kind
        let message: String
    }

    @Published private(set) var entries: [Entry] = []
    private let cap = 50

    func log(_ kind: Kind, _ message: String) {
        entries.insert(Entry(at: Date(), kind: kind, message: message), at: 0)
        if entries.count > cap { entries = Array(entries.prefix(cap)) }
    }

    // Convenience helpers so callers don't have to remember the exact wording.
    func taskStarted(type: String)   { log(.started,   "Started " + WorkloadLabels.title(for: type).lowercased()) }
    func taskCompleted(type: String, duration: Double?) {
        let dur = duration.map { Self.formatDuration($0) }
        let tail = dur.map { " (took \($0))" } ?? ""
        log(.completed, WorkloadLabels.verb(for: type) + tail)
    }
    func taskFailed(type: String, reason: String) {
        log(.failed, WorkloadLabels.verb(for: type) + " — failed: " + ErrorPresenter.present(reason).userMessage)
    }
    func paused(reason: String?)   { log(.paused,   reason.map { "Paused: \($0)" } ?? "Paused") }
    func resumed()                 { log(.resumed,  "Resumed") }
    func connected()               { log(.connected, "Connected to the network") }
    func disconnected(reason: String?) {
        log(.disconnected, reason.map { "Disconnected — \($0)" } ?? "Disconnected")
    }

    static func formatDuration(_ s: Double) -> String {
        if s < 1 { return "<1s" }
        if s < 60 { return "\(Int(s))s" }
        let m = Int(s / 60); let rem = Int(s.truncatingRemainder(dividingBy: 60))
        return rem > 0 ? "\(m)m \(rem)s" : "\(m)m"
    }
}
