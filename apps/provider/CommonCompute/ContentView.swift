import SwiftUI

// Root view: routes between Login and the main tabbed interface.
struct ContentView: View {
    @EnvironmentObject private var vm: AppViewModel

    var body: some View {
        Group {
            if vm.session == nil {
                LoginView()
                    .environmentObject(vm)
            } else {
                MainTabView()
                    .environmentObject(vm)
            }
        }
        .background(CC.bg)
    }
}

// MARK: - MainTabView

struct MainTabView: View {
    @EnvironmentObject private var vm: AppViewModel
    @State private var selectedTab: Tab = .dashboard

    enum Tab: String, CaseIterable {
        case dashboard = "Dashboard"
        case jobs      = "Jobs"
        case earnings  = "Earnings"
        case settings  = "Settings"

        var icon: String {
            switch self {
            case .dashboard: return "gauge.medium"
            case .jobs:      return "list.bullet.rectangle"
            case .earnings:  return "dollarsign.circle"
            case .settings:  return "gearshape"
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            tabContent
                .frame(width: 420, height: 520)
                .background(CC.bg)
            tabBar
        }
        .frame(width: 420)
    }

    @ViewBuilder
    private var tabContent: some View {
        switch selectedTab {
        case .dashboard: DashboardView().environmentObject(vm)
        case .jobs:      JobsView().environmentObject(vm)
        case .earnings:  EarningsView().environmentObject(vm)
        case .settings:  SettingsView().environmentObject(vm)
        }
    }

    private var tabBar: some View {
        HStack(spacing: 0) {
            ForEach(Tab.allCases, id: \.self) { tab in
                Button(action: { selectedTab = tab }) {
                    VStack(spacing: 4) {
                        Image(systemName: tab.icon)
                            .font(.system(size: 13, weight: .regular))
                        Text(tab.rawValue.uppercased())
                            .font(.ccMono(size: 9, weight: .medium))
                            .tracking(1.0)
                    }
                    .foregroundStyle(selectedTab == tab ? CC.text : CC.text3)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .overlay(alignment: .top) {
                        Rectangle()
                            .fill(selectedTab == tab ? CC.blue : Color.clear)
                            .frame(height: 1)
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .background(CC.panel2)
        .overlay(alignment: .top) {
            Rectangle().fill(CC.line).frame(height: 1)
        }
    }
}
