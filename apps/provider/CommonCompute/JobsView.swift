import SwiftUI

// Headline question: "What did my Mac do?"
// Filter chips + search + row list → click opens JobInspectorView.

struct JobsView: View {
    @EnvironmentObject private var vm: AppViewModel

    enum ResultFilter: String, CaseIterable { case all = "Everything", success = "Successful", failed = "Failed" }
    enum WhenFilter: String, CaseIterable {
        case today = "Today", week = "This week", month = "This month", all = "All time"
    }

    @State private var resultFilter: ResultFilter = .all
    @State private var whenFilter: WhenFilter = .all
    @State private var typeFilter: String? = nil  // nil = all
    @State private var search: String = ""
    @State private var selected: JobRecord? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            headerStrip
            filterBar
            if filtered.isEmpty { emptyState } else { list }
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(CC.bg)
        .sheet(item: $selected) { job in
            JobInspectorView(job: job, onDismiss: { selected = nil })
                .environmentObject(vm)
                .preferredColorScheme(.dark)
        }
    }

    // MARK: - Header / stats

    private var headerStrip: some View {
        HStack(spacing: 12) {
            statCard("COMPLETED", "\(vm.jobsToday)", CC.text)
            statCard("AVG TIME", vm.avgJobDuration, CC.text)
            statCard("FAILED", "\(vm.failedToday)", vm.failedToday > 0 ? CC.negative : CC.text)
            Spacer()
            Button(action: { vm.clearJobHistory() }) {
                HStack(spacing: 6) {
                    Image(systemName: "trash").font(.system(size: 10))
                    Text("Clear history").font(.ccDisplay(size: 12, weight: .medium))
                }
            }
            .buttonStyle(CCGhostButtonStyle())
        }
    }

    private func statCard(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).eyebrow()
            Text(value).font(.ccMono(size: 20, weight: .medium)).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .ccCard(padding: 16)
    }

    // MARK: - Filters

    private var filterBar: some View {
        HStack(spacing: 10) {
            Menu {
                Button("Everything") { typeFilter = nil }
                Divider()
                ForEach(Array(WorkloadLabels.table.keys.sorted()), id: \.self) { key in
                    Button(WorkloadLabels.title(for: key)) { typeFilter = key }
                }
            } label: {
                filterChip(typeFilter.map { WorkloadLabels.title(for: $0) } ?? "Any kind of work")
            }
            .menuStyle(.borderlessButton)
            .fixedSize()

            Picker("", selection: $resultFilter) {
                ForEach(ResultFilter.allCases, id: \.self) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            .fixedSize()

            Picker("", selection: $whenFilter) {
                ForEach(WhenFilter.allCases, id: \.self) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.menu)
            .labelsHidden()
            .fixedSize()

            TextField("Search by job ID", text: $search)
                .textFieldStyle(.plain)
                .font(.ccDisplay(size: 12))
                .foregroundStyle(CC.text)
                .padding(.horizontal, 10).padding(.vertical, 7)
                .background(CC.panel2, in: RoundedRectangle(cornerRadius: 6))
                .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(CC.line, lineWidth: 1))
                .frame(maxWidth: 240)
        }
    }

    private func filterChip(_ text: String) -> some View {
        HStack(spacing: 6) {
            Text(text).font(.ccDisplay(size: 12, weight: .medium)).foregroundStyle(CC.text)
            Image(systemName: "chevron.down").font(.system(size: 9)).foregroundStyle(CC.text3)
        }
        .padding(.horizontal, 12).padding(.vertical, 7)
        .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(CC.line, lineWidth: 1))
    }

    // MARK: - List

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(Array(filtered.enumerated()), id: \.element.id) { idx, job in
                    JobRow(job: job, onTap: { selected = job })
                    if idx < filtered.count - 1 {
                        Rectangle().fill(CC.lineSoft).frame(height: 1)
                    }
                }
            }
            .ccCard(padding: 0)
        }
    }

    private var filtered: [JobRecord] {
        vm.jobHistory.filter { job in
            if resultFilter == .success && job.status != .completed { return false }
            if resultFilter == .failed  && job.status != .failed    { return false }
            if let t = typeFilter, job.type != t { return false }
            if !search.isEmpty, !job.id.localizedCaseInsensitiveContains(search),
                                !job.type.localizedCaseInsensitiveContains(search) { return false }
            let cutoff: Date? = {
                switch whenFilter {
                case .today: return Calendar.current.startOfDay(for: Date())
                case .week:  return Date().addingTimeInterval(-7 * 86_400)
                case .month: return Date().addingTimeInterval(-30 * 86_400)
                case .all:   return nil
                }
            }()
            if let cutoff, job.startedAt < cutoff { return false }
            return true
        }
    }

    // MARK: - Empty

    private var emptyState: some View {
        VStack(spacing: 12) {
            NetworkLogo(size: 40, monochrome: true).opacity(0.3)
            Text(vm.jobHistory.isEmpty ? "You'll see your work history here." : "No jobs match those filters.")
                .font(.ccDisplay(size: 14, weight: .medium))
                .foregroundStyle(CC.text2)
            if vm.jobHistory.isEmpty {
                Text("New jobs arrive when your Mac is idle and plugged in.")
                    .font(.ccDisplay(size: 12))
                    .foregroundStyle(CC.text3)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(48)
    }
}

// Row with row-scan hover + friendly labels.
private struct JobRow: View {
    let job: JobRecord
    let onTap: () -> Void
    @State private var hovering = false

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Dot(color: job.status == .completed ? CC.positive : CC.negative, size: 6)
                VStack(alignment: .leading, spacing: 2) {
                    Text(WorkloadLabels.verb(for: job.type))
                        .font(.ccDisplay(size: 13, weight: .medium))
                        .foregroundStyle(CC.text)
                    if let reason = job.failureReason {
                        Text(ErrorPresenter.present(reason).userMessage)
                            .font(.ccDisplay(size: 11))
                            .foregroundStyle(CC.negative)
                            .lineLimit(1)
                    } else if let dur = job.durationSeconds {
                        Text("Took \(ActivityLog.formatDuration(dur))")
                            .font(.ccMono(size: 10))
                            .foregroundStyle(CC.text3)
                    }
                }
                Spacer()
                Text(job.id.prefix(8))
                    .font(.ccMono(size: 10))
                    .foregroundStyle(CC.text4)
                Text(relative(job.completedAt ?? job.startedAt))
                    .font(.ccMono(size: 10))
                    .foregroundStyle(CC.text3)
                    .frame(width: 72, alignment: .trailing)
                Image(systemName: "chevron.right")
                    .font(.system(size: 10))
                    .foregroundStyle(CC.text4)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                GeometryReader { geo in
                    if hovering {
                        LinearGradient(
                            colors: [Color.clear, CC.blue.opacity(0.08), Color.clear],
                            startPoint: .leading, endPoint: .trailing
                        ).frame(width: geo.size.width)
                    }
                }
            )
        }
        .buttonStyle(.plain)
        .contentShape(Rectangle())
        .onHover { h in withAnimation(.easeOut(duration: 0.2)) { hovering = h } }
    }

    private func relative(_ at: Date) -> String {
        let d = Date().timeIntervalSince(at)
        if d < 10   { return "just now" }
        if d < 60   { return "\(Int(d))s ago" }
        if d < 3600 { return "\(Int(d/60))m ago" }
        return "\(Int(d/3600))h ago"
    }
}
