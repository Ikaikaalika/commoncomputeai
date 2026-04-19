import SwiftUI
import AppKit

// Headline question: "What if something's wrong?"
// Friendly second-person copy + one-click health check + copyable
// system info for support.

struct HelpView: View {
    @EnvironmentObject private var vm: AppViewModel
    @AppStorage("onboardingComplete") private var onboardingComplete: Bool = false
    @State private var healthCheckResult: String? = nil
    @State private var healthChecking = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                howItWorksCard
                commonQuestionsCard
                healthCheckCard
                systemInfoCard
                linksRow
                Button("See the quick tour again") { onboardingComplete = false }
                    .buttonStyle(CCGhostButtonStyle())
            }
            .padding(24)
            .frame(maxWidth: 900)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(CC.bg)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("HELP").eyebrow()
            Text("What if something's wrong?")
                .font(.ccDisplay(size: 22, weight: .medium))
                .foregroundStyle(CC.text)
                .tracking(-0.4)
        }
    }

    // MARK: - How it works

    private var howItWorksCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("HOW IT WORKS").eyebrow()
            step("1", "Your Mac quietly runs AI tasks when it's idle and plugged in.")
            step("2", "It pauses the moment you touch the keyboard or your Mac gets warm.")
            step("3", "You get paid every Friday in US dollars.")
        }
        .ccCard(padding: 18)
    }

    private func step(_ n: String, _ body: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(n)
                .font(.ccMono(size: 13, weight: .medium))
                .foregroundStyle(CC.blue)
                .frame(width: 18, alignment: .leading)
            Text(body)
                .font(.ccDisplay(size: 13))
                .foregroundStyle(CC.text)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 4)
    }

    // MARK: - Common questions

    private var commonQuestionsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("COMMON QUESTIONS").eyebrow()
            qa(
                "The app says \"Not connected\"",
                "Check your internet. If it's working, click Pause then Resume from the menu bar. Still stuck? Use the health check below."
            )
            Rectangle().fill(CC.lineSoft).frame(height: 1)
            qa(
                "My Mac got warm and paused",
                "That's by design. Common Compute waits until your Mac cools down before taking new work."
            )
            Rectangle().fill(CC.lineSoft).frame(height: 1)
            qa(
                "I haven't been paid yet",
                "Payouts land every Friday for the work your Mac did the previous week. Billing goes live with our next release."
            )
            Rectangle().fill(CC.lineSoft).frame(height: 1)
            qa(
                "How do I stop it running?",
                "Click Pause in the menu bar to pause instantly. To sign out completely, go to Settings → Account."
            )
        }
        .ccCard(padding: 18)
    }

    private func qa(_ q: String, _ a: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(q)
                .font(.ccDisplay(size: 13, weight: .medium))
                .foregroundStyle(CC.text)
            Text(a)
                .font(.ccDisplay(size: 12))
                .foregroundStyle(CC.text2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 6)
    }

    // MARK: - Health check

    private var healthCheckCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("HEALTH CHECK").eyebrow()
            HStack {
                Button(action: runHealthCheck) {
                    if healthChecking {
                        ProgressView().controlSize(.small).frame(maxWidth: .infinity)
                    } else {
                        Text("Check everything").frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(CCGhostButtonStyle())
                .frame(maxWidth: 200)
                .disabled(healthChecking)
                Spacer()
            }
            if let result = healthCheckResult {
                Text(result)
                    .font(.ccDisplay(size: 12))
                    .foregroundStyle(CC.text)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(CC.panel2, in: RoundedRectangle(cornerRadius: 8))
            }
        }
        .ccCard(padding: 18)
    }

    private func runHealthCheck() {
        healthChecking = true
        healthCheckResult = nil
        Task {
            var parts: [String] = []
            let signedIn = vm.session != nil
            parts.append(signedIn ? "✅ You're signed in." : "❌ Not signed in.")
            let connected = vm.connectionStatus == .connected
            parts.append(connected ? "✅ Connected to the network." : "⚠️ Not connected (\(vm.connectionStatus.rawValue)).")
            let hasCap = vm.capability != nil
            parts.append(hasCap ? "✅ This Mac's capabilities are registered." : "⚠️ Capabilities not probed yet.")
            let hasTel = vm.telemetry != nil
            parts.append(hasTel ? "✅ Live telemetry is streaming." : "⚠️ No live telemetry yet — try again in a few seconds.")
            healthCheckResult = parts.joined(separator: "\n")
            healthChecking = false
        }
    }

    // MARK: - System info

    private var systemInfoCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("SYSTEM INFO").eyebrow()
            VStack(spacing: 0) {
                info("App version", appVersion)
                Rectangle().fill(CC.lineSoft).frame(height: 1)
                info("macOS", ProcessInfo.processInfo.operatingSystemVersionString)
                if let cap = vm.capability {
                    Rectangle().fill(CC.lineSoft).frame(height: 1)
                    info("Mac model", cap.chip)
                    Rectangle().fill(CC.lineSoft).frame(height: 1)
                    info("Memory", "\(cap.memoryGB) GB")
                }
                if let session = vm.session {
                    Rectangle().fill(CC.lineSoft).frame(height: 1)
                    info("Signed in as", session.email)
                }
            }
            Button("Copy for support") { copySystemInfo() }
                .buttonStyle(CCGhostButtonStyle())
        }
        .ccCard(padding: 18)
    }

    private func info(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).font(.ccDisplay(size: 12)).foregroundStyle(CC.text3)
            Spacer()
            Text(value).font(.ccMono(size: 11)).foregroundStyle(CC.text).lineLimit(1)
        }
        .padding(.vertical, 8)
    }

    private func copySystemInfo() {
        var lines: [String] = []
        lines.append("Common Compute — support info")
        lines.append("App version: \(appVersion)")
        lines.append("macOS: \(ProcessInfo.processInfo.operatingSystemVersionString)")
        if let cap = vm.capability {
            lines.append("Chip: \(cap.chip) · \(cap.memoryGB) GB")
        }
        if let session = vm.session {
            lines.append("Email: \(session.email)")
        }
        lines.append("Status: \(vm.connectionStatus.rawValue)")
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(lines.joined(separator: "\n"), forType: .string)
    }

    private var appVersion: String {
        (Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? "unknown"
    }

    // MARK: - Links

    private var linksRow: some View {
        HStack(spacing: 10) {
            Button("Provider guide") { open("https://commoncompute.ai/providers") }
                .buttonStyle(CCGhostButtonStyle())
            Button("Contact support") { open("mailto:support@commoncompute.ai") }
                .buttonStyle(CCGhostButtonStyle())
            Button("Privacy") { open("https://commoncompute.ai/privacy") }
                .buttonStyle(CCGhostButtonStyle())
            Spacer()
        }
    }

    private func open(_ s: String) {
        if let url = URL(string: s) { NSWorkspace.shared.open(url) }
    }
}
