import Foundation
import MetricKit
import os.log

// Subscribes to MetricKit so we get crash + hang diagnostics without
// embedding a third-party SDK. Diagnostics arrive ~24 h after the fact
// (Apple's design), are forwarded to /v1/diag/crash, and logged locally
// via os_log so support can verify delivery.
//
// MXMetricManager is a macOS 14+ API; deployment target matches.

@MainActor
final class DiagnosticsReporter: NSObject, MXMetricManagerSubscriber {
    static let shared = DiagnosticsReporter()
    private let log = Logger(subsystem: "ai.commoncompute.app", category: "diagnostics")

    func start() {
        MXMetricManager.shared.add(self)
        log.info("Diagnostics subscriber registered")
    }

    nonisolated func didReceive(_ payloads: [MXMetricPayload]) {
        // Metrics — CPU/memory/hang usage; we mostly ignore but could
        // trend-analyze later.
        for p in payloads {
            Task { await self.sendMetricPayload(p.jsonRepresentation()) }
        }
    }

    nonisolated func didReceive(_ payloads: [MXDiagnosticPayload]) {
        // Crash / hang / disk write diagnostics — the interesting ones.
        for p in payloads {
            Task { await self.sendDiagnosticPayload(p.jsonRepresentation()) }
        }
    }

    private func sendMetricPayload(_ data: Data) async {
        await post(path: "/v1/diag/metric", body: data, kind: "metric")
    }

    private func sendDiagnosticPayload(_ data: Data) async {
        await post(path: "/v1/diag/crash", body: data, kind: "diagnostic")
    }

    private func post(path: String, body: Data, kind: String) async {
        let base = APIClient.baseURL
        guard let url = URL(string: "\(base)\(path)") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(Bundle.main.bundleIdentifier ?? "unknown", forHTTPHeaderField: "X-App-Bundle")
        req.setValue(
            (Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? "unknown",
            forHTTPHeaderField: "X-App-Version"
        )
        req.httpBody = body

        do {
            let (_, resp) = try await URLSession.shared.data(for: req)
            let code = (resp as? HTTPURLResponse)?.statusCode ?? 0
            log.info("Sent \(kind) diagnostic: HTTP \(code)")
        } catch {
            log.error("Failed to send \(kind) diagnostic: \(error.localizedDescription)")
        }
    }
}
