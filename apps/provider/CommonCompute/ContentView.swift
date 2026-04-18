import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var vm: MenubarViewModel

    var body: some View {
        VStack(spacing: 0) {
            statusBar
            Divider()
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if vm.capability == nil {
                        setupCard
                    } else {
                        capabilityCard
                        engineDialsCard
                        tasksCard
                    }
                    if let err = vm.statusError {
                        errorBanner(err)
                    }
                }
                .padding(20)
            }
        }
        .frame(width: 400, height: 560)
    }

    // MARK: - Status bar

    private var statusBar: some View {
        HStack {
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
            Text(vm.statusLabel)
                .font(.system(.caption, weight: .medium))
            Spacer()
            if let cap = vm.capability {
                Text(cap.chip)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.bar)
    }

    private var statusColor: Color {
        switch vm.statusLabel {
        case "Connected": return .green
        case "Paused": return .orange
        case "Enrolling": return .yellow
        default: return .secondary
        }
    }

    // MARK: - Setup (no capability yet)

    private var setupCard: some View {
        GroupBox("Connect to Router") {
            VStack(alignment: .leading, spacing: 12) {
                Text("Enter your API key to start earning.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                SecureField("cc_live_…", text: $vm.apiKey)
                    .textFieldStyle(.roundedBorder)
                Button("Connect") { vm.connect() }
                    .buttonStyle(.borderedProminent)
                    .disabled(vm.apiKey.isEmpty)
            }
        }
    }

    // MARK: - Capability readout

    private var capabilityCard: some View {
        guard let cap = vm.capability else { return AnyView(EmptyView()) }
        return AnyView(GroupBox("This Mac") {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                stat("Chip", cap.chip)
                stat("Memory", "\(cap.memoryGB) GB")
                stat("CPU P/E", "\(cap.cpu.performanceCores)P + \(cap.cpu.efficiencyCores)E")
                stat("GPU cores", "\(cap.gpu.cores)")
                stat("ANE", cap.ane.available ? "\(Int(cap.ane.tops)) TOPS" : "–")
                stat("Media engines", "\(cap.media.engines)")
                stat("Encoders", cap.media.encoders.joined(separator: ", "))
                stat("Decoders", cap.media.decoders.prefix(3).joined(separator: ", "))
            }
        })
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.system(.caption, design: .monospaced))
                .lineLimit(1)
        }
    }

    // MARK: - Engine utilization dials

    private var engineDialsCard: some View {
        GroupBox("Live utilization") {
            HStack(spacing: 16) {
                utilDial(label: "CPU", value: vm.telemetry?.cpu.performanceUtilization ?? 0, color: .blue)
                utilDial(label: "GPU", value: vm.telemetry?.gpuUtilization ?? 0, color: .purple)
                utilDial(label: "ANE", value: vm.telemetry?.aneUtilizationInferred ?? 0, color: .orange)
                thermalIndicator
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func utilDial(label: String, value: Double, color: Color) -> some View {
        VStack(spacing: 4) {
            ZStack {
                Circle()
                    .stroke(color.opacity(0.2), lineWidth: 4)
                Circle()
                    .trim(from: 0, to: value)
                    .stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text("\(Int(value * 100))%")
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
            }
            .frame(width: 48, height: 48)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var thermalIndicator: some View {
        VStack(spacing: 4) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(thermalColor.opacity(0.15))
                    .frame(width: 48, height: 48)
                Image(systemName: "thermometer.medium")
                    .foregroundStyle(thermalColor)
            }
            Text("Thermal")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var thermalColor: Color {
        switch vm.telemetry?.thermal {
        case .nominal: return .green
        case .fair: return .yellow
        case .serious: return .orange
        case .critical: return .red
        default: return .secondary
        }
    }

    // MARK: - Active tasks

    private var tasksCard: some View {
        GroupBox("Active tasks (\(vm.activeTasks.count))") {
            if vm.activeTasks.isEmpty {
                Text("Waiting for work…")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 8)
            } else {
                VStack(spacing: 6) {
                    ForEach(vm.activeTasks) { task in
                        taskRow(task)
                    }
                }
            }
        }
    }

    private func taskRow(_ task: TaskAssignment) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(task.type)
                    .font(.system(.caption, weight: .medium))
                Text(task.id.prefix(12) + "…")
                    .font(.system(.caption2, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(task.priority.rawValue)
                .font(.caption2)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(priorityColor(task.priority).opacity(0.15))
                .foregroundStyle(priorityColor(task.priority))
                .clipShape(Capsule())
        }
        .padding(.vertical, 2)
    }

    private func priorityColor(_ p: TaskPriority) -> Color {
        switch p {
        case .priority: return .red
        case .standard: return .blue
        case .batch: return .secondary
        }
    }

    // MARK: - Error banner

    private func errorBanner(_ message: String) -> some View {
        HStack {
            Image(systemName: "exclamationmark.triangle")
            Text(message)
                .font(.caption)
        }
        .foregroundStyle(.red)
        .padding(10)
        .background(Color.red.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
