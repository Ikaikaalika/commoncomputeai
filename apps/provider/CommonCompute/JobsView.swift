import SwiftUI

struct JobsView: View {
    @EnvironmentObject private var vm: AppViewModel

    var body: some View {
        VStack(spacing: 0) {
            statsBar
                .padding(20)
            Rectangle().fill(CC.line).frame(height: 1)
            if vm.jobHistory.isEmpty {
                emptyState
            } else {
                jobList
            }
        }
        .background(CC.bg)
    }

    // MARK: - Stats bar

    private var statsBar: some View {
        HStack(alignment: .top, spacing: 0) {
            statCell("COMPLETED", "\(vm.jobsToday)", CC.text)
            divider
            statCell("AVG TIME", vm.avgJobDuration, CC.text)
            divider
            statCell("FAILED", "\(vm.failedToday)", vm.failedToday > 0 ? CC.negative : CC.text)
            Spacer()
            Button(action: { vm.clearJobHistory() }) {
                Image(systemName: "trash")
                    .font(.system(size: 11))
                    .foregroundStyle(CC.text3)
                    .padding(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6).strokeBorder(CC.line, lineWidth: 1)
                    )
            }
            .buttonStyle(.plain)
        }
        .ccCard(padding: 20)
    }

    private var divider: some View {
        Rectangle().fill(CC.line).frame(width: 1, height: 36).padding(.horizontal, 16)
    }

    private func statCell(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).eyebrow()
            Text(value)
                .font(.ccMono(size: 20, weight: .medium))
                .foregroundStyle(color)
        }
    }

    // MARK: - List

    private var jobList: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(Array(vm.jobHistory.enumerated()), id: \.element.id) { idx, job in
                    JobRow(job: job, formatDuration: formatDuration, relativeTime: relativeTime)
                    if idx < vm.jobHistory.count - 1 {
                        Rectangle().fill(CC.lineSoft).frame(height: 1)
                    }
                }
            }
        }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 14) {
            NetworkLogo(size: 40, monochrome: true)
                .opacity(0.3)
            Text("Waiting for work")
                .font(.ccDisplay(size: 15, weight: .medium))
                .foregroundStyle(CC.text2)
            Text("Completed and failed jobs will appear here.")
                .font(.ccDisplay(size: 12))
                .foregroundStyle(CC.text3)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(24)
    }

    // MARK: - Formatters

    fileprivate func formatDuration(_ secs: Double) -> String {
        if secs < 1   { return "<1s" }
        if secs < 60  { return "\(Int(secs))s" }
        let m = Int(secs / 60)
        let s = Int(secs.truncatingRemainder(dividingBy: 60))
        return s > 0 ? "\(m)m \(s)s" : "\(m)m"
    }

    fileprivate func relativeTime(_ date: Date) -> String {
        let diff = Date().timeIntervalSince(date)
        if diff < 5    { return "just now" }
        if diff < 60   { return "\(Int(diff))s ago" }
        if diff < 3600 { return "\(Int(diff / 60))m ago" }
        return "\(Int(diff / 3600))h ago"
    }
}

// Row-scan hover effect mirrors the site's .cc-row-scan animation.
private struct JobRow: View {
    let job: JobRecord
    let formatDuration: (Double) -> String
    let relativeTime: (Date) -> String

    @State private var hovering = false

    var body: some View {
        HStack(spacing: 12) {
            Dot(color: job.status == .completed ? CC.positive : CC.negative, size: 6)

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(job.type)
                        .font(.ccDisplay(size: 13, weight: .medium))
                        .foregroundStyle(CC.text)
                    if let engine = job.engineUsed {
                        Text(engine.uppercased())
                            .font(.ccMono(size: 9, weight: .medium))
                            .tracking(0.6)
                            .padding(.horizontal, 5).padding(.vertical, 2)
                            .foregroundStyle(CC.text3)
                            .overlay(Capsule().strokeBorder(CC.line, lineWidth: 1))
                    }
                }
                if let reason = job.failureReason {
                    Text(reason)
                        .font(.ccDisplay(size: 11))
                        .foregroundStyle(CC.negative)
                        .lineLimit(1)
                } else if let dur = job.durationSeconds {
                    Text(formatDuration(dur))
                        .font(.ccMono(size: 10))
                        .foregroundStyle(CC.text3)
                }
            }

            Spacer()

            Text(job.id.prefix(8))
                .font(.ccMono(size: 10))
                .foregroundStyle(CC.text4)

            Text(relativeTime(job.completedAt ?? job.startedAt))
                .font(.ccMono(size: 10))
                .foregroundStyle(CC.text3)
                .frame(width: 72, alignment: .trailing)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(
            GeometryReader { geo in
                if hovering {
                    LinearGradient(
                        colors: [Color.clear, CC.blue.opacity(0.08), Color.clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(width: geo.size.width)
                }
            }
        )
        .contentShape(Rectangle())
        .onHover { h in
            withAnimation(.easeOut(duration: 0.25)) { hovering = h }
        }
    }
}
