import SwiftUI
import Charts

// Headline question: "Is my Mac helping right now?"
// Full-width rewrite of the popover dashboard — plain-English status,
// live utilization charts, today's earnings at a glance, active task
// labels translated via WorkloadLabels, and a recent activity feed.

struct DashboardView: View {
    @EnvironmentObject private var vm: AppViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                hero
                todayStrip
                if vm.capability != nil {
                    utilizationCard
                    thisMacCard
                }
                activeTasksCard
                activityCard
            }
            .padding(24)
            .frame(maxWidth: 900)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(CC.bg)
    }

    // MARK: - Hero

    private var hero: some View {
        HStack(alignment: .top, spacing: 16) {
            Dot(color: statusColor, size: 12,
                pulse: vm.connectionStatus == .enrolling || vm.connectionStatus == .reconnecting)
            VStack(alignment: .leading, spacing: 4) {
                Text(statusSentence)
                    .font(.ccDisplay(size: 22, weight: .medium))
                    .foregroundStyle(CC.text)
                    .tracking(-0.4)
                if let session = vm.session {
                    Text(session.email)
                        .font(.ccMono(size: 11))
                        .foregroundStyle(CC.text3)
                }
            }
            Spacer()
            Button(vm.connectionStatus == .paused ? "Resume" : "Pause") { vm.togglePause() }
                .buttonStyle(CCGhostButtonStyle())
                .disabled(vm.connectionStatus == .disconnected || vm.connectionStatus == .enrolling)
                .opacity((vm.connectionStatus == .disconnected || vm.connectionStatus == .enrolling) ? 0.4 : 1.0)
        }
        .padding(.top, 4)
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
            if vm.activeTasks.isEmpty { return "Your Mac is ready and waiting for work." }
            return "Your Mac is earning right now."
        case .paused:
            return vm.pauseReason.map { "Paused — \($0.lowercased())." } ?? "Paused."
        case .enrolling:    return "Connecting to the network…"
        case .reconnecting: return "Reconnecting…"
        case .disconnected: return "Not connected."
        }
    }

    // MARK: - Today strip

    private var todayStrip: some View {
        HStack(spacing: 12) {
            todayTile("EARNED TODAY", vm.earningsTodayString, CC.positive)
            todayTile("JOBS DONE", "\(vm.jobsToday)", CC.text)
            todayTile("AVG TIME", vm.avgJobDuration, CC.text)
        }
    }

    private func todayTile(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).eyebrow()
            Text(value)
                .font(.ccMono(size: 22, weight: .medium))
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .ccCard(padding: 18)
    }

    // MARK: - Utilization

    private var utilizationCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                Text("LIVE UTILIZATION").eyebrow()
                InfoBubble(text: "Shows how hard each part of your Mac has worked in the last 30 minutes. Peaks mean it was actively running a task.")
            }
            HStack(spacing: 16) {
                chart("Main processor (CPU)", color: CC.blue) { $0.cpu }
                chart("Graphics chip (GPU)",  color: CC.silver1) { $0.gpu }
                chart("AI chip",               color: CC.blueDeep) { $0.ane }
            }
            thermalRow
        }
        .ccCard(padding: 18)
    }

    private func chart(_ label: String, color: Color, value: @escaping (TelemetryHistory.Point) -> Double) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.ccDisplay(size: 11, weight: .medium))
                .foregroundStyle(CC.text2)
            Chart(vm.telemetryHistory.points) { p in
                AreaMark(x: .value("t", p.t), y: .value("v", value(p)))
                    .interpolationMethod(.monotone)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [color.opacity(0.35), color.opacity(0.0)],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                LineMark(x: .value("t", p.t), y: .value("v", value(p)))
                    .interpolationMethod(.monotone)
                    .foregroundStyle(color)
                    .lineStyle(StrokeStyle(lineWidth: 1.5))
            }
            .chartXAxis(.hidden)
            .chartYAxis(.hidden)
            .chartYScale(domain: 0...1)
            .frame(height: 56)
            .background(CC.panel2, in: RoundedRectangle(cornerRadius: 8))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var thermalRow: some View {
        HStack(spacing: 10) {
            Image(systemName: "thermometer.medium")
                .foregroundStyle(thermalColor)
            Text("Temperature: \(thermalWord)")
                .font(.ccDisplay(size: 12))
                .foregroundStyle(CC.text2)
            InfoBubble(text: "We auto-pause if your Mac gets too warm so it stays safe.")
            Spacer()
        }
        .padding(.top, 4)
    }

    private var thermalColor: Color {
        switch vm.telemetry?.thermal {
        case .nominal:  return CC.positive
        case .fair:     return CC.silver2
        case .serious:  return CC.blue
        case .critical: return CC.negative
        default:        return CC.text3
        }
    }

    private var thermalWord: String {
        switch vm.telemetry?.thermal {
        case .nominal:  return "cool"
        case .fair:     return "warm"
        case .serious:  return "hot — auto-paused"
        case .critical: return "very hot — auto-paused"
        default:        return "—"
        }
    }

    // MARK: - This Mac

    private var thisMacCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("THIS MAC").eyebrow()
                Spacer()
            }
            Text(humanizedMacSummary)
                .font(.ccDisplay(size: 13))
                .foregroundStyle(CC.text)
        }
        .ccCard(padding: 18)
    }

    private var humanizedMacSummary: String {
        guard let cap = vm.capability else { return "—" }
        var parts: [String] = [cap.chip]
        parts.append("\(cap.memoryGB) GB memory")
        parts.append("\(cap.gpu.cores)-core GPU")
        if cap.ane.available { parts.append("AI chip (\(Int(cap.ane.tops)) TOPS)") }
        parts.append("\(cap.media.engines) media engine\(cap.media.engines == 1 ? "" : "s")")
        return parts.joined(separator: " · ")
    }

    // MARK: - Active tasks

    private var activeTasksCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("ACTIVE · \(vm.activeTasks.count)").eyebrow()
            if vm.activeTasks.isEmpty {
                Text("Waiting for work. New jobs arrive when your Mac is idle and plugged in.")
                    .font(.ccDisplay(size: 12))
                    .foregroundStyle(CC.text2)
                    .padding(.vertical, 4)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(vm.activeTasks.enumerated()), id: \.element.id) { idx, task in
                        HStack(spacing: 10) {
                            Dot(color: CC.blue, size: 6)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(WorkloadLabels.title(for: task.type))
                                    .font(.ccDisplay(size: 13, weight: .medium))
                                    .foregroundStyle(CC.text)
                                Text(PriorityLabels.title(for: task.priority))
                                    .font(.ccMono(size: 10))
                                    .foregroundStyle(CC.text3)
                            }
                            Spacer()
                            Text(task.id.prefix(8))
                                .font(.ccMono(size: 10))
                                .foregroundStyle(CC.text4)
                        }
                        .padding(.vertical, 8)
                        if idx < vm.activeTasks.count - 1 {
                            Rectangle().fill(CC.lineSoft).frame(height: 1)
                        }
                    }
                }
            }
        }
        .ccCard(padding: 18)
    }

    // MARK: - Recent activity

    private var activityCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("RECENT ACTIVITY").eyebrow()
            if vm.activityLog.entries.isEmpty {
                Text("Nothing yet. You'll see a feed of what your Mac has been doing here.")
                    .font(.ccDisplay(size: 12))
                    .foregroundStyle(CC.text2)
                    .padding(.vertical, 4)
            } else {
                VStack(spacing: 0) {
                    ForEach(vm.activityLog.entries.prefix(20)) { entry in
                        HStack(alignment: .top, spacing: 10) {
                            Text(relative(entry.at))
                                .font(.ccMono(size: 10))
                                .foregroundStyle(CC.text3)
                                .frame(width: 70, alignment: .leading)
                            Text(entry.message)
                                .font(.ccDisplay(size: 12))
                                .foregroundStyle(color(for: entry.kind))
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.vertical, 6)
                    }
                }
            }
        }
        .ccCard(padding: 18)
    }

    private func color(for kind: ActivityLog.Kind) -> Color {
        switch kind {
        case .completed, .connected, .resumed: return CC.text
        case .failed, .disconnected:           return CC.negative
        case .paused:                          return CC.silver2
        case .started, .info:                  return CC.text2
        }
    }

    private func relative(_ at: Date) -> String {
        let d = Date().timeIntervalSince(at)
        if d < 10   { return "just now" }
        if d < 60   { return "\(Int(d))s ago" }
        if d < 3600 { return "\(Int(d/60))m ago" }
        return "\(Int(d/3600))h ago"
    }
}

private extension AppViewModel {
    var earningsTodayString: String {
        // M6 placeholder: no data yet.
        if let today = earnings?.todayUSD {
            let fmt = NumberFormatter()
            fmt.numberStyle = .currency; fmt.currencyCode = "USD"
            return fmt.string(from: today as NSDecimalNumber) ?? "$0.00"
        }
        return "—"
    }
}
