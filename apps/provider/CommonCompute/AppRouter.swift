import SwiftUI

// Page selection shared across the sidebar, the menu commands, and
// the menu bar popover. Single source of truth so `⌘2` from the
// keyboard and a sidebar click stay in sync.

@MainActor
final class AppRouter: ObservableObject {
    enum Page: Hashable, CaseIterable {
        case dashboard, earnings, jobs, settings, help

        var title: String {
            switch self {
            case .dashboard: return "Dashboard"
            case .earnings:  return "Earnings"
            case .jobs:      return "Jobs"
            case .settings:  return "Settings"
            case .help:      return "Help"
            }
        }

        var icon: String {
            switch self {
            case .dashboard: return "gauge.medium"
            case .earnings:  return "dollarsign.circle"
            case .jobs:      return "list.bullet.rectangle"
            case .settings:  return "gearshape"
            case .help:      return "questionmark.circle"
            }
        }
    }

    @Published var page: Page = .dashboard
}
