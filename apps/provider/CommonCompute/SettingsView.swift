import SwiftUI
import AppKit

// Headline question: "How do I control this?"
// Basic (always visible) + Advanced (progressive disclosure).
// Every row has a one-line explanation so nothing is mysterious.

struct SettingsView: View {
    @EnvironmentObject private var vm: AppViewModel
    @State private var config: RoutineConfig = RoutineConfig()
    @State private var showSignOutConfirm = false
    @State private var showAdvanced = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                basicCard
                quietHoursCard
                notificationsCard
                advancedToggleRow
                if showAdvanced {
                    runtimesCard
                    priorityCard
                    thermalCard
                }
                accountCard
            }
            .padding(24)
            .frame(maxWidth: 900)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(CC.bg)
        .onAppear { config = vm.routineConfig }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("SETTINGS").eyebrow()
            Text("How do I control this?")
                .font(.ccDisplay(size: 22, weight: .medium))
                .foregroundStyle(CC.text)
                .tracking(-0.4)
        }
    }

    // MARK: - Basic

    private var basicCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("BASIC").eyebrow()
                .padding(.bottom, 12)

            explainedToggle(
                "Start Common Compute when I log in",
                subtitle: "The app launches automatically with your Mac.",
                isOn: $config.launchAtLogin
            ) { v in vm.setLaunchAtLogin(v) }

            Rectangle().fill(CC.lineSoft).frame(height: 1)

            explainedToggle(
                "Only run when plugged in",
                subtitle: "Prevents draining your battery.",
                isOn: $config.acOnlyMode
            ) { _ in save() }

            Rectangle().fill(CC.lineSoft).frame(height: 1)

            explainedToggle(
                "Only run when I'm not using my Mac",
                subtitle: "Waits until you stop typing for a few minutes.",
                isOn: $config.idleOnlyMode
            ) { _ in save() }

            if config.idleOnlyMode {
                HStack {
                    Text("Wait time")
                        .font(.ccDisplay(size: 12))
                        .foregroundStyle(CC.text2)
                    Spacer()
                    Stepper("\(config.idleThresholdMinutes) min",
                            value: $config.idleThresholdMinutes, in: 1...60)
                        .font(.ccMono(size: 11))
                        .foregroundStyle(CC.text2)
                        .onChange(of: config.idleThresholdMinutes) { _, _ in save() }
                }
                .padding(.top, 10)
            }
        }
        .ccCard(padding: 18)
    }

    // MARK: - Quiet hours

    private var quietHoursCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("QUIET HOURS").eyebrow()
                .padding(.bottom, 12)
            explainedToggle(
                "Only accept work during these hours",
                subtitle: "Great for overnight earning.",
                isOn: scheduleEnabled
            ) { _ in save() }

            if config.scheduledWindow?.enabled == true {
                Rectangle().fill(CC.lineSoft).frame(height: 1).padding(.vertical, 6)
                HStack {
                    Text("Start").font(.ccDisplay(size: 12)).foregroundStyle(CC.text2)
                    Spacer()
                    Picker("", selection: scheduleStart) {
                        ForEach(0..<24, id: \.self) { Text(hourLabel($0)).tag($0) }
                    }
                    .labelsHidden().frame(width: 90)
                    .onChange(of: config.scheduledWindow?.startHour) { _, _ in save() }
                }
                .padding(.vertical, 4)
                HStack {
                    Text("End").font(.ccDisplay(size: 12)).foregroundStyle(CC.text2)
                    Spacer()
                    Picker("", selection: scheduleEnd) {
                        ForEach(0..<24, id: \.self) { Text(hourLabel($0)).tag($0) }
                    }
                    .labelsHidden().frame(width: 90)
                    .onChange(of: config.scheduledWindow?.endHour) { _, _ in save() }
                }
                .padding(.vertical, 4)
            }
        }
        .ccCard(padding: 18)
    }

    // MARK: - Notifications

    private var notificationsCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("NOTIFICATIONS").eyebrow()
                .padding(.bottom, 12)
            explainedToggle(
                "Send me notifications",
                subtitle: "Only for the important stuff — offline, paused, first payout.",
                isOn: $config.enableNotifications
            ) { v in
                save()
                if v { Task { await NotificationManager.shared.requestPermission() } }
            }
        }
        .ccCard(padding: 18)
    }

    // MARK: - Advanced toggle

    private var advancedToggleRow: some View {
        Button(action: { withAnimation(.easeOut(duration: 0.15)) { showAdvanced.toggle() } }) {
            HStack(spacing: 6) {
                Image(systemName: showAdvanced ? "chevron.down" : "chevron.right")
                    .font(.system(size: 10))
                Text(showAdvanced ? "Hide advanced" : "Show advanced")
                    .font(.ccDisplay(size: 12, weight: .medium))
            }
            .foregroundStyle(CC.text3)
        }
        .buttonStyle(.plain)
        .padding(.top, 4)
    }

    // MARK: - Advanced: Runtimes

    private var runtimesCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("TYPES OF WORK").eyebrow()
                Spacer()
                InfoBubble(text: "Turn off any kind of work you don't want your Mac to accept.")
            }
            .padding(.bottom, 8)
            Text("Your Mac can accept any of these. Leave them on unless you have a reason to opt out.")
                .font(.ccDisplay(size: 11))
                .foregroundStyle(CC.text3)
                .padding(.bottom, 10)

            ForEach(Array(WorkloadLabels.table.keys.sorted()), id: \.self) { key in
                runtimeToggle(key)
                if key != WorkloadLabels.table.keys.sorted().last {
                    Rectangle().fill(CC.lineSoft).frame(height: 1)
                }
            }
        }
        .ccCard(padding: 18)
    }

    private func runtimeToggle(_ key: String) -> some View {
        let enabled = Binding<Bool>(
            get: { !config.disabledRuntimes.contains(key) },
            set: { v in
                if v { config.disabledRuntimes.remove(key) }
                else { config.disabledRuntimes.insert(key) }
                save()
            }
        )
        return HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(WorkloadLabels.title(for: key))
                    .font(.ccDisplay(size: 13, weight: .medium))
                    .foregroundStyle(CC.text)
                Text(WorkloadLabels.description(for: key))
                    .font(.ccDisplay(size: 11))
                    .foregroundStyle(CC.text3)
            }
            Spacer()
            Toggle("", isOn: enabled).labelsHidden().tint(CC.blue)
        }
        .padding(.vertical, 10)
    }

    // MARK: - Advanced: Priority

    private var priorityCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("JOB PRIORITY").eyebrow()
            Text("Controls which kinds of jobs your Mac accepts.")
                .font(.ccDisplay(size: 11))
                .foregroundStyle(CC.text3)
            Picker("", selection: $config.priorityFilter) {
                Text("Let Common Compute choose (recommended)").tag(RoutineConfig.PriorityFilter.all)
                Text("Only urgent work").tag(RoutineConfig.PriorityFilter.priorityOnly)
                Text("Everything including background").tag(RoutineConfig.PriorityFilter.standardAndPriority)
            }
            .pickerStyle(.menu)
            .labelsHidden()
            .onChange(of: config.priorityFilter) { _, _ in save() }
        }
        .ccCard(padding: 18)
    }

    // MARK: - Advanced: Thermal

    private var thermalCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("THERMAL PROTECTION").eyebrow()
            Text("Your Mac is always protected. If it gets warm, Common Compute auto-pauses and waits until things cool down — no setting to change.")
                .font(.ccDisplay(size: 12))
                .foregroundStyle(CC.text2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .ccCard(padding: 18)
    }

    // MARK: - Account

    private var accountCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ACCOUNT").eyebrow()
            if let session = vm.session {
                HStack {
                    Text(session.fullName.isEmpty ? session.email : session.fullName)
                        .font(.ccDisplay(size: 13, weight: .medium))
                        .foregroundStyle(CC.text)
                    Spacer()
                    Text("PROVIDER")
                        .font(.ccMono(size: 9, weight: .medium)).tracking(1.0)
                        .foregroundStyle(CC.text3)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .overlay(Capsule().strokeBorder(CC.line, lineWidth: 1))
                }
                Text(session.email)
                    .font(.ccMono(size: 11))
                    .foregroundStyle(CC.text3)
            }
            HStack {
                Button("Change password") {
                    if let url = URL(string: "https://commoncompute.ai/account") {
                        NSWorkspace.shared.open(url)
                    }
                }
                .buttonStyle(CCGhostButtonStyle())
                Spacer()
                Button("Sign out") { showSignOutConfirm = true }
                    .buttonStyle(CCGhostButtonStyle(destructive: true))
                    .confirmationDialog("Sign out?", isPresented: $showSignOutConfirm, titleVisibility: .visible) {
                        Button("Sign Out", role: .destructive) { vm.signOut() }
                        Button("Cancel", role: .cancel) {}
                    } message: {
                        Text("You'll need to sign in again to contribute compute.")
                    }
            }
            .padding(.top, 4)
        }
        .ccCard(padding: 18)
    }

    // MARK: - Helpers

    private func explainedToggle(
        _ title: String,
        subtitle: String,
        isOn: Binding<Bool>,
        onChange: @escaping (Bool) -> Void
    ) -> some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.ccDisplay(size: 13, weight: .medium))
                    .foregroundStyle(CC.text)
                Text(subtitle)
                    .font(.ccDisplay(size: 11))
                    .foregroundStyle(CC.text3)
            }
            Spacer()
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(CC.blue)
                .onChange(of: isOn.wrappedValue) { _, v in onChange(v) }
        }
        .padding(.vertical, 10)
    }

    private var scheduleEnabled: Binding<Bool> {
        Binding(
            get: { config.scheduledWindow?.enabled ?? false },
            set: { v in
                if config.scheduledWindow == nil { config.scheduledWindow = RoutineConfig.ScheduleWindow() }
                config.scheduledWindow?.enabled = v
            }
        )
    }
    private var scheduleStart: Binding<Int> {
        Binding(get: { config.scheduledWindow?.startHour ?? 21 },
                set: { config.scheduledWindow?.startHour = $0 })
    }
    private var scheduleEnd: Binding<Int> {
        Binding(get: { config.scheduledWindow?.endHour ?? 6 },
                set: { config.scheduledWindow?.endHour = $0 })
    }
    private func save() { vm.saveRoutineConfig(config) }
    private func hourLabel(_ h: Int) -> String {
        let fmt = DateFormatter(); fmt.dateFormat = "ha"
        var c = DateComponents(); c.hour = h; c.minute = 0
        guard let d = Calendar.current.date(from: c) else { return "\(h):00" }
        return fmt.string(from: d).lowercased()
    }
}
