import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var vm: AppViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                statusCard
                if let cap = vm.capability {
                    deviceCard(cap)
                    telemetryCard
                }
                tasksCard
                if let reason = vm.pauseReason {
                    infoBar(reason, icon: "pause.circle", color: CC.silver2)
                }
                if let err = vm.statusError {
                    infoBar(err, icon: "exclamationmark.triangle", color: CC.negative)
                }
            }
            .padding(20)
        }
        .background(CC.bg)
    }

    // MARK: - Status card

    private var statusCard: some View {
        HStack(spacing: 12) {
            Dot(color: statusColor, size: 8, pulse: vm.connectionStatus == .enrolling || vm.connectionStatus == .reconnecting)
            VStack(alignment: .leading, spacing: 2) {
                Text(vm.statusLabel)
                    .font(.ccDisplay(size: 15, weight: .medium))
                    .foregroundStyle(CC.text)
                if let session = vm.session {
                    Text(session.email)
                        .font(.ccMono(size: 11))
                        .foregroundStyle(CC.text3)
                }
            }
            Spacer()
            Button(vm.connectionStatus == .paused ? "Resume" : "Pause") {
                vm.togglePause()
            }
            .buttonStyle(CCGhostButtonStyle())
            .disabled(vm.connectionStatus == .disconnected || vm.connectionStatus == .enrolling)
            .opacity((vm.connectionStatus == .disconnected || vm.connectionStatus == .enrolling) ? 0.4 : 1.0)
        }
        .ccCard()
    }

    private var statusColor: Color {
        switch vm.connectionStatus {
        case .connected:                return CC.positive
        case .paused:                   return CC.silver2
        case .enrolling, .reconnecting: return CC.blue
        case .disconnected:             return CC.text4
        }
    }

    // MARK: - Device card

    private func deviceCard(_ cap: CapabilityProfile) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("THIS MAC · \(cap.chip.uppercased())").eyebrow()
                Spacer()
            }
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                statCell("MEMORY", "\(cap.memoryGB) GB")
                statCell("CPU", "\(cap.cpu.performanceCores)P · \(cap.cpu.efficiencyCores)E")
                statCell("GPU", "\(cap.gpu.cores) cores")
                statCell("ANE", cap.ane.available ? "\(Int(cap.ane.tops)) TOPS" : "—")
                statCell("MEDIA", "\(cap.media.engines) engine\(cap.media.engines == 1 ? "" : "s")")
                statCell("OS", cap.os)
            }
        }
        .ccCard()
    }

    private func statCell(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).eyebrow()
            Text(value)
                .font(.ccMono(size: 12, weight: .medium))
                .foregroundStyle(CC.text)
                .lineLimit(1)
        }
    }

    // MARK: - Telemetry card

    private var telemetryCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("LIVE UTILIZATION").eyebrow()
            HStack(spacing: 16) {
                dial("CPU", vm.telemetry?.cpu.performanceUtilization ?? 0, CC.blue)
                dial("GPU", vm.telemetry?.gpuUtilization ?? 0, CC.silver1)
                dial("ANE", vm.telemetry?.aneUtilizationInferred ?? 0, CC.blueDeep)
                thermalCell
            }
            .frame(maxWidth: .infinity)
        }
        .ccCard()
    }

    private func dial(_ label: String, _ value: Double, _ color: Color) -> some View {
        VStack(spacing: 6) {
            ZStack {
                Circle().stroke(color.opacity(0.12), lineWidth: 5)
                Circle()
                    .trim(from: 0, to: value)
                    .stroke(color, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text("\(Int(value * 100))")
                    .font(.ccMono(size: 11, weight: .medium))
                    .foregroundStyle(CC.text)
            }
            .frame(width: 54, height: 54)
            Text(label).eyebrow()
        }
        .frame(maxWidth: .infinity)
    }

    private var thermalCell: some View {
        VStack(spacing: 6) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(thermalColor.opacity(0.12))
                    .frame(width: 54, height: 54)
                Image(systemName: thermalIcon)
                    .font(.title3)
                    .foregroundStyle(thermalColor)
            }
            Text("THERMAL").eyebrow()
        }
        .frame(maxWidth: .infinity)
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

    private var thermalIcon: String {
        switch vm.telemetry?.thermal {
        case .nominal:               return "thermometer.low"
        case .fair:                  return "thermometer.medium"
        case .serious, .critical:    return "thermometer.high"
        default:                     return "thermometer.medium"
        }
    }

    // MARK: - Active tasks

    private var tasksCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("ACTIVE TASKS · \(vm.activeTasks.count)").eyebrow()
            if vm.activeTasks.isEmpty {
                HStack {
                    Spacer()
                    Text("Waiting for work…")
                        .font(.ccDisplay(size: 13))
                        .foregroundStyle(CC.text2)
                    Spacer()
                }
                .padding(.vertical, 4)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(vm.activeTasks.enumerated()), id: \.element.id) { idx, task in
                        taskRow(task)
                        if idx < vm.activeTasks.count - 1 {
                            Rectangle().fill(CC.lineSoft).frame(height: 1)
                        }
                    }
                }
            }
        }
        .ccCard()
    }

    private func taskRow(_ task: TaskAssignment) -> some View {
        HStack(spacing: 10) {
            Dot(color: CC.blue, size: 6)
            VStack(alignment: .leading, spacing: 2) {
                Text(task.type)
                    .font(.ccDisplay(size: 13, weight: .medium))
                    .foregroundStyle(CC.text)
                Text(task.id.prefix(10) + "…")
                    .font(.ccMono(size: 10))
                    .foregroundStyle(CC.text3)
            }
            Spacer()
            priorityBadge(task.priority)
        }
        .padding(.vertical, 8)
    }

    private func priorityBadge(_ p: TaskPriority) -> some View {
        let color: Color = p == .priority ? CC.blue : (p == .standard ? CC.silver2 : CC.text3)
        let filled = p != .batch
        return Text(p.rawValue.uppercased())
            .font(.ccMono(size: 9, weight: .medium))
            .tracking(0.8)
            .padding(.horizontal, 7).padding(.vertical, 3)
            .background(filled ? color.opacity(0.12) : Color.clear)
            .foregroundStyle(color)
            .overlay(
                Capsule().strokeBorder(color.opacity(filled ? 0.0 : 0.4), lineWidth: 1)
            )
            .clipShape(Capsule())
    }

    // MARK: - Info bar

    private func infoBar(_ msg: String, icon: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 11))
            Text(msg)
                .font(.ccDisplay(size: 12))
                .lineLimit(3)
        }
        .foregroundStyle(color)
        .padding(.horizontal, 12).padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8).strokeBorder(color.opacity(0.2), lineWidth: 1)
        )
    }
}
