import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var vm: AppViewModel
    @State private var config: RoutineConfig = RoutineConfig()
    @State private var showSignOutConfirm = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                startupSection
                powerSection
                scheduleSection
                prioritySection
                accountSection
            }
            .padding(20)
        }
        .background(CC.bg)
        .onAppear {
            config = vm.routineConfig
        }
    }

    // MARK: - Sections

    private var startupSection: some View {
        section("STARTUP") {
            toggleRow("Launch at login", isOn: $config.launchAtLogin, onChange: { v in
                vm.setLaunchAtLogin(v)
            })
        }
    }

    private var powerSection: some View {
        section("POWER & ACTIVITY", footer: "When conditions aren’t met the app pauses accepting new jobs automatically.") {
            toggleRow("AC power only", isOn: $config.acOnlyMode, onChange: { _ in save() })
            dividerLine
            toggleRow("Run only when idle", isOn: $config.idleOnlyMode, onChange: { _ in save() })
            if config.idleOnlyMode {
                dividerLine
                HStack {
                    Text("Idle threshold")
                        .font(.ccDisplay(size: 13))
                        .foregroundStyle(CC.text)
                    Spacer()
                    Stepper("\(config.idleThresholdMinutes) min",
                            value: $config.idleThresholdMinutes, in: 1...60, step: 1)
                        .font(.ccMono(size: 12))
                        .foregroundStyle(CC.text2)
                        .onChange(of: config.idleThresholdMinutes) { _, _ in save() }
                }
                .padding(.vertical, 4)
            }
        }
    }

    private var scheduleSection: some View {
        section("SCHEDULE") {
            toggleRow("Time window", isOn: scheduleEnabled, onChange: { _ in save() })
            if config.scheduledWindow?.enabled == true {
                dividerLine
                HStack {
                    Text("Start")
                        .font(.ccDisplay(size: 13))
                        .foregroundStyle(CC.text)
                    Spacer()
                    Picker("", selection: scheduleStart) {
                        ForEach(0..<24, id: \.self) { h in Text(hourLabel(h)).tag(h) }
                    }
                    .labelsHidden()
                    .frame(width: 80)
                    .onChange(of: config.scheduledWindow?.startHour) { _, _ in save() }
                }
                .padding(.vertical, 4)
                dividerLine
                HStack {
                    Text("End")
                        .font(.ccDisplay(size: 13))
                        .foregroundStyle(CC.text)
                    Spacer()
                    Picker("", selection: scheduleEnd) {
                        ForEach(0..<24, id: \.self) { h in Text(hourLabel(h)).tag(h) }
                    }
                    .labelsHidden()
                    .frame(width: 80)
                    .onChange(of: config.scheduledWindow?.endHour) { _, _ in save() }
                }
                .padding(.vertical, 4)
            }
        }
    }

    private var prioritySection: some View {
        section("TASK ACCEPTANCE") {
            HStack {
                Text("Accept")
                    .font(.ccDisplay(size: 13))
                    .foregroundStyle(CC.text)
                Spacer()
                Picker("", selection: $config.priorityFilter) {
                    ForEach(RoutineConfig.PriorityFilter.allCases, id: \.self) { f in
                        Text(f.rawValue).tag(f)
                    }
                }
                .labelsHidden()
                .frame(width: 200)
                .onChange(of: config.priorityFilter) { _, _ in save() }
            }
            .padding(.vertical, 4)
        }
    }

    private var accountSection: some View {
        section("ACCOUNT") {
            if let session = vm.session {
                HStack {
                    Text("Signed in as")
                        .font(.ccDisplay(size: 13))
                        .foregroundStyle(CC.text2)
                    Spacer()
                    Text(session.email)
                        .font(.ccMono(size: 11))
                        .foregroundStyle(CC.text)
                }
                .padding(.vertical, 4)
                dividerLine
            }
            HStack {
                Spacer()
                Button("Sign out") {
                    showSignOutConfirm = true
                }
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
    }

    // MARK: - Section shell

    @ViewBuilder
    private func section<Content: View>(_ label: String, footer: String? = nil, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(label).eyebrow()
            VStack(alignment: .leading, spacing: 0) {
                content()
            }
            if let footer {
                Text(footer)
                    .font(.ccDisplay(size: 11))
                    .foregroundStyle(CC.text3)
                    .padding(.top, 2)
            }
        }
        .ccCard()
    }

    private func toggleRow(_ label: String, isOn: Binding<Bool>, onChange: @escaping (Bool) -> Void) -> some View {
        Toggle(isOn: isOn) {
            Text(label)
                .font(.ccDisplay(size: 13))
                .foregroundStyle(CC.text)
        }
        .tint(CC.blue)
        .onChange(of: isOn.wrappedValue) { _, v in onChange(v) }
        .padding(.vertical, 4)
    }

    private var dividerLine: some View {
        Rectangle().fill(CC.lineSoft).frame(height: 1)
    }

    // MARK: - Bindings helpers

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
        Binding(
            get: { config.scheduledWindow?.startHour ?? 21 },
            set: { config.scheduledWindow?.startHour = $0 }
        )
    }

    private var scheduleEnd: Binding<Int> {
        Binding(
            get: { config.scheduledWindow?.endHour ?? 6 },
            set: { config.scheduledWindow?.endHour = $0 }
        )
    }

    // MARK: - Save

    private func save() {
        vm.saveRoutineConfig(config)
    }

    private func hourLabel(_ h: Int) -> String {
        let fmt = DateFormatter()
        fmt.dateFormat = "ha"
        var c = DateComponents(); c.hour = h; c.minute = 0
        guard let date = Calendar.current.date(from: c) else { return "\(h):00" }
        return fmt.string(from: date).lowercased()
    }
}
