import SwiftUI

// The real app surface: sidebar nav + routed detail pane.
// Wraps the whole thing in a first-run onboarding sheet.

struct MainWindowView: View {
    @EnvironmentObject private var vm: AppViewModel
    @EnvironmentObject private var router: AppRouter
    @AppStorage("onboardingComplete") private var onboardingComplete: Bool = false

    var body: some View {
        NavigationSplitView {
            sidebar
        } detail: {
            detail
        }
        .navigationSplitViewStyle(.balanced)
        .background(CC.bg)
        .sheet(isPresented: .init(
            get: { !onboardingComplete },
            set: { if !$0 { onboardingComplete = true } }
        )) {
            OnboardingView(onDone: { onboardingComplete = true })
                .environmentObject(vm)
                .preferredColorScheme(.dark)
        }
    }

    // MARK: - Sidebar

    private var sidebar: some View {
        VStack(spacing: 0) {
            // Brand chip at the top — plays the role of a window title.
            HStack(spacing: 8) {
                NetworkLogo(size: 20)
                Text("Common Compute")
                    .font(.ccDisplay(size: 13, weight: .medium))
                    .foregroundStyle(CC.text)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 18)

            // Nav items.
            VStack(spacing: 2) {
                ForEach(AppRouter.Page.allCases, id: \.self) { page in
                    sidebarRow(page)
                }
            }
            .padding(.horizontal, 8)

            Spacer()

            // Status footer — always visible so the user can glance and see health.
            statusFooter
                .padding(.horizontal, 14)
                .padding(.bottom, 14)
        }
        .frame(minWidth: 200, idealWidth: 220, maxWidth: 260)
        .background(CC.panel)
    }

    private func sidebarRow(_ page: AppRouter.Page) -> some View {
        Button(action: { router.page = page }) {
            HStack(spacing: 10) {
                Image(systemName: page.icon)
                    .frame(width: 18)
                Text(page.title)
                    .font(.ccDisplay(size: 13, weight: router.page == page ? .medium : .regular))
                Spacer()
            }
            .foregroundStyle(router.page == page ? CC.text : CC.text2)
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(router.page == page ? CC.panel2 : Color.clear)
            )
            .overlay(alignment: .leading) {
                if router.page == page {
                    RoundedRectangle(cornerRadius: 1)
                        .fill(CC.blue)
                        .frame(width: 2, height: 16)
                        .offset(x: -6)
                }
            }
        }
        .buttonStyle(.plain)
        .contentShape(Rectangle())
    }

    private var statusFooter: some View {
        HStack(spacing: 8) {
            Dot(color: dotColor, size: 6,
                pulse: vm.connectionStatus == .enrolling || vm.connectionStatus == .reconnecting)
            VStack(alignment: .leading, spacing: 1) {
                Text(humanStatus)
                    .font(.ccDisplay(size: 11, weight: .medium))
                    .foregroundStyle(CC.text)
                    .lineLimit(1)
                if let session = vm.session {
                    Text(session.email)
                        .font(.ccMono(size: 10))
                        .foregroundStyle(CC.text3)
                        .lineLimit(1)
                }
            }
        }
        .padding(10)
        .background(CC.panel2, in: RoundedRectangle(cornerRadius: 8))
    }

    private var dotColor: Color {
        switch vm.connectionStatus {
        case .connected:                return CC.positive
        case .paused:                   return CC.silver2
        case .enrolling, .reconnecting: return CC.blue
        case .disconnected:             return CC.text4
        }
    }

    private var humanStatus: String {
        switch vm.connectionStatus {
        case .connected:     return "Earning"
        case .paused:        return "Paused"
        case .enrolling:     return "Connecting…"
        case .reconnecting:  return "Reconnecting…"
        case .disconnected:  return "Offline"
        }
    }

    // MARK: - Detail

    @ViewBuilder
    private var detail: some View {
        switch router.page {
        case .dashboard: DashboardView()
        case .earnings:  EarningsView()
        case .jobs:      JobsView()
        case .settings:  SettingsView()
        case .help:      HelpView()
        }
    }
}

// Reused by Settings scene (⌘,) — Preferences opens Settings page in a
// dedicated window.
struct PreferencesWindow: View {
    var body: some View {
        ScrollView { SettingsView() }
            .background(CC.bg)
    }
}
