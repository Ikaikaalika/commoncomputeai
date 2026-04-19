import SwiftUI
import AppKit

// Sheet-presented detail view for one JobRecord. Plain-English summary
// up top; technical fields tucked behind "Show technical details" so
// the default view stays clean for non-technical users.

struct JobInspectorView: View {
    let job: JobRecord
    let onDismiss: () -> Void

    @State private var showTechnical = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
            Divider().overlay(CC.line)
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    summary
                    facts
                    if let reason = job.failureReason { failureBlock(reason) }
                    technicalDetails
                }
                .padding(24)
            }
        }
        .frame(width: 520, height: 460)
        .background(CC.bg)
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 12) {
            statusBadge
            VStack(alignment: .leading, spacing: 2) {
                Text(WorkloadLabels.title(for: job.type))
                    .font(.ccDisplay(size: 16, weight: .medium))
                    .foregroundStyle(CC.text)
                Text(WorkloadLabels.description(for: job.type))
                    .font(.ccDisplay(size: 11))
                    .foregroundStyle(CC.text3)
            }
            Spacer()
            Button("Done") { onDismiss() }
                .buttonStyle(CCGhostButtonStyle())
        }
        .padding(20)
    }

    private var statusBadge: some View {
        let color: Color = job.status == .completed ? CC.positive : CC.negative
        let title = job.status == .completed ? "SUCCESS" : "FAILED"
        return Text(title)
            .font(.ccMono(size: 10, weight: .medium))
            .tracking(1.0)
            .foregroundStyle(color)
            .padding(.horizontal, 8).padding(.vertical, 4)
            .background(color.opacity(0.12), in: Capsule())
    }

    // MARK: - Plain-English summary

    private var summary: some View {
        Text(summaryText)
            .font(.ccDisplay(size: 13))
            .foregroundStyle(CC.text2)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var summaryText: String {
        let verb = WorkloadLabels.verb(for: job.type).lowercased()
        if job.status == .completed, let d = job.durationSeconds {
            return "Your Mac \(verb) in \(ActivityLog.formatDuration(d))."
        } else if job.status == .failed {
            return "Your Mac tried to handle a \(WorkloadLabels.title(for: job.type).lowercased()) task but something went wrong."
        } else {
            return "Your Mac \(verb)."
        }
    }

    // MARK: - Facts row

    private var facts: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("DETAILS").eyebrow()
            VStack(spacing: 0) {
                factRow("Started", dateString(job.startedAt))
                Rectangle().fill(CC.lineSoft).frame(height: 1)
                factRow("Finished", job.completedAt.map(dateString) ?? "—")
                Rectangle().fill(CC.lineSoft).frame(height: 1)
                factRow("Took", job.durationSeconds.map { ActivityLog.formatDuration($0) } ?? "—")
            }
        }
        .ccCard(padding: 18)
    }

    private func factRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).font(.ccDisplay(size: 12)).foregroundStyle(CC.text2)
            Spacer()
            Text(value).font(.ccMono(size: 12)).foregroundStyle(CC.text)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Failure block (friendly)

    private func failureBlock(_ raw: String) -> some View {
        let friendly = ErrorPresenter.present(raw)
        return VStack(alignment: .leading, spacing: 10) {
            Text("WHAT HAPPENED").eyebrow(color: CC.negative)
            Text(friendly.userMessage)
                .font(.ccDisplay(size: 13))
                .foregroundStyle(CC.text)
                .fixedSize(horizontal: false, vertical: true)
            Button("Copy support details") {
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(
                    "Job \(job.id)\nType: \(job.type)\nRaw: \(friendly.supportDetails)",
                    forType: .string
                )
            }
            .buttonStyle(CCGhostButtonStyle())
        }
        .ccCard(padding: 18, background: CC.panel)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(CC.negative.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - Technical details (collapsible)

    private var technicalDetails: some View {
        VStack(alignment: .leading, spacing: 10) {
            Button(action: { withAnimation(.easeOut(duration: 0.15)) { showTechnical.toggle() } }) {
                HStack(spacing: 6) {
                    Image(systemName: showTechnical ? "chevron.down" : "chevron.right")
                        .font(.system(size: 10))
                    Text(showTechnical ? "Hide technical details" : "Show technical details")
                        .font(.ccDisplay(size: 12, weight: .medium))
                }
                .foregroundStyle(CC.text3)
            }
            .buttonStyle(.plain)

            if showTechnical {
                VStack(spacing: 0) {
                    techRow("Job ID", job.id, copyable: true)
                    Rectangle().fill(CC.lineSoft).frame(height: 1)
                    techRow("Runner type", job.type)
                    Rectangle().fill(CC.lineSoft).frame(height: 1)
                    techRow("Engine used", job.engineUsed ?? "—")
                }
            }
        }
        .ccCard(padding: 18)
    }

    private func techRow(_ label: String, _ value: String, copyable: Bool = false) -> some View {
        HStack {
            Text(label).font(.ccDisplay(size: 11)).foregroundStyle(CC.text3)
            Spacer()
            Text(value).font(.ccMono(size: 11)).foregroundStyle(CC.text2).lineLimit(1)
            if copyable {
                Button(action: {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(value, forType: .string)
                }) {
                    Image(systemName: "doc.on.doc").font(.system(size: 10))
                }
                .buttonStyle(.plain)
                .foregroundStyle(CC.text3)
            }
        }
        .padding(.vertical, 8)
    }

    private func dateString(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateStyle = .medium; f.timeStyle = .short
        return f.string(from: d)
    }
}
