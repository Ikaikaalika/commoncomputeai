import SwiftUI
import AppKit

// Compact status-at-a-glance popover. The main window is the full
// app; this popover's job is to answer "is my Mac earning right now?"
// in under 2 seconds and give the user Pause/Resume + Open Dashboard.

struct MenuBarPopoverView: View {
    @EnvironmentObject private var vm: AppViewModel
    @EnvironmentObject private var router: AppRouter
    @Environment(\.openWindow) private var openWindow

    var body: some View {
        if vm.session == nil {
            signInPrompt
        } else {
            signedIn
        }
    }

    private var signInPrompt: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                NetworkLogo(size: 20)
                Text("Common Compute")
                    .font(.ccDisplay(size: 13, weight: .medium))
                    .foregroundStyle(CC.text)
            }
            Text("Sign in to start earning.")
                .font(.ccDisplay(size: 12))
                .foregroundStyle(CC.text2)
            Button("Open app") {
                openWindow(id: "main")
                NSApp.activate(ignoringOtherApps: true)
            }
            .buttonStyle(CCPrimaryButtonStyle())
            Divider().overlay(CC.line)
            quitRow
        }
        .padding(16)
        .background(CC.bg)
    }

    private var signedIn: some View {
        VStack(alignment: .leading, spacing: 14) {
            statusRow
            todayStats
            activeTasksBlock
            actionButtons
            Divider().overlay(CC.line)
            quitRow
        }
        .padding(16)
        .background(CC.bg)
    }

    // MARK: - Status row

    private var statusRow: some View {
        HStack(spacing: 10) {
            Dot(color: statusColor, size: 8,
                pulse: vm.connectionStatus == .enrolling || vm.connectionStatus == .reconnecting)
            VStack(alignment: .leading, spacing: 2) {
                Text(statusSentence)
                    .font(.ccDisplay(size: 13, weight: .medium))
                    .foregroundStyle(CC.text)
                if let session = vm.session {
                    Text(session.email)
                        .font(.ccMono(size: 10))
                        .foregroundStyle(CC.text3)
                }
            }
            Spacer()
        }
    }

    private var statusColor: Color {
        switch vm.connectionStatus {
        case .connected:                return CC.positive
        case .paused:                   return CC.silver2
        case .enrolling, .reconnecting: return CC.blue
        case .disconnected:             return CC.text4
        }
    }

    private var statusSentence: String {
        switch vm.connectionStatus {
        case .connected:
            return vm.activeTasks.isEmpty ? "Waiting for work" : "Earning"
        case .paused:        return "Paused"
        case .enrolling:     return "Connecting…"
        case .reconnecting:  return "Reconnecting…"
        case .disconnected:  return "Offline"
        }
    }

    // MARK: - Today stats

    private var todayStats: some View {
        HStack(spacing: 12) {
            miniStat("JOBS", "\(vm.jobsToday)")
            miniStat("AVG", vm.avgJobDuration)
            miniStat("FAILED", "\(vm.failedToday)", tint: vm.failedToday > 0 ? CC.negative : CC.text)
        }
        .ccCard(padding: 12)
    }

    private func miniStat(_ label: String, _ value: String, tint: Color = CC.text) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).eyebrow()
            Text(value)
                .font(.ccMono(size: 13, weight: .medium))
                .foregroundStyle(tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Active tasks

    @ViewBuilder
    private var activeTasksBlock: some View {
        if !vm.activeTasks.isEmpty {
            VStack(alignment: .leading, spacing: 6) {
                Text("ACTIVE · \(vm.activeTasks.count)").eyebrow()
                ForEach(vm.activeTasks.prefix(2)) { task in
                    HStack(spacing: 8) {
                        Dot(color: CC.blue, size: 5)
                        Text(WorkloadLabels.title(for: task.type))
                            .font(.ccDisplay(size: 12))
                            .foregroundStyle(CC.text)
                            .lineLimit(1)
                        Spacer()
                        Text(PriorityLabels.title(for: task.priority))
                            .font(.ccMono(size: 9, weight: .medium))
                            .tracking(0.6)
                            .foregroundStyle(CC.text3)
                    }
                }
                if vm.activeTasks.count > 2 {
                    Text("…and \(vm.activeTasks.count - 2) more")
                        .font(.ccDisplay(size: 11))
                        .foregroundStyle(CC.text3)
                }
            }
        }
    }

    // MARK: - Action buttons

    private var actionButtons: some View {
        HStack(spacing: 8) {
            Button("Open Dashboard") {
                openWindow(id: "main")
                NSApp.activate(ignoringOtherApps: true)
            }
            .buttonStyle(CCPrimaryButtonStyle())
            .frame(maxWidth: .infinity)

            Button(vm.connectionStatus == .paused ? "Resume" : "Pause") {
                vm.togglePause()
            }
            .buttonStyle(CCGhostButtonStyle())
            .disabled(vm.connectionStatus == .disconnected || vm.connectionStatus == .enrolling)
        }
    }

    // MARK: - Quit row

    private var quitRow: some View {
        HStack {
            Button("Preferences…") {
                openWindow(id: "main")
                router.page = .settings
                NSApp.activate(ignoringOtherApps: true)
            }
            .buttonStyle(.plain)
            .font(.ccDisplay(size: 11))
            .foregroundStyle(CC.text2)

            Spacer()

            Text("v\((Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? "1.0")")
                .font(.ccMono(size: 10))
                .foregroundStyle(CC.text4)

            Spacer()

            Button("Quit") { NSApp.terminate(nil) }
                .buttonStyle(.plain)
                .font(.ccDisplay(size: 11))
                .foregroundStyle(CC.text2)
        }
    }
}
