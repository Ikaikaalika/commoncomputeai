import SwiftUI
import AppKit

@main
struct CommonComputeApp: App {
    @StateObject private var vm = AppViewModel()
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        // Main dock-resident window — the real app surface.
        WindowGroup(id: "main") {
            RootView()
                .environmentObject(vm)
                .environmentObject(vm.router)
                .preferredColorScheme(.dark)
                .frame(minWidth: 800, minHeight: 520)
                .background(CC.bg)
        }
        .defaultSize(width: 960, height: 620)
        .windowResizability(.contentMinSize)
        .commands {
            CommonComputeCommands(vm: vm)
        }

        // Menu bar extra — status at a glance + open dashboard.
        MenuBarExtra {
            MenuBarPopoverView()
                .environmentObject(vm)
                .environmentObject(vm.router)
                .preferredColorScheme(.dark)
                .frame(width: 320)
        } label: {
            MenuBarIconView(status: vm.connectionStatus)
        }
        .menuBarExtraStyle(.window)

        // Native Preferences scene (⌘,).
        Settings {
            PreferencesWindow()
                .environmentObject(vm)
                .environmentObject(vm.router)
                .preferredColorScheme(.dark)
                .frame(minWidth: 520, minHeight: 520)
        }
    }
}

// MARK: - NSApplicationDelegate

// AppKit hooks for things SwiftUI's Scene API doesn't cover:
//   • activation policy (dock icon visibility)
//   • dock-icon-click re-opens the main window
final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        Task { @MainActor in
            DiagnosticsReporter.shared.start()
        }
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag {
            // Ask any closed WindowGroup to restore.
            NSApp.sendAction(Selector(("showMainWindow:")), to: nil, from: nil)
            for window in NSApp.windows where window.identifier?.rawValue.contains("main") == true {
                window.makeKeyAndOrderFront(nil)
            }
        }
        return true
    }
}

// Root router: Login → MainWindowView when signed in.
struct RootView: View {
    @EnvironmentObject private var vm: AppViewModel

    var body: some View {
        Group {
            if vm.session == nil {
                LoginView()
            } else {
                MainWindowView()
            }
        }
    }
}

// Menu bar icon: monochrome network mark (template, tinted by macOS) + status dot.
private struct MenuBarIconView: View {
    let status: AppViewModel.ConnectionStatus

    var body: some View {
        HStack(spacing: 3) {
            NetworkLogo(size: 16, monochrome: true)
            Circle()
                .fill(dotColor)
                .frame(width: 5, height: 5)
        }
    }

    private var dotColor: Color {
        switch status {
        case .connected:                return CC.positive
        case .paused:                   return CC.silver2
        case .enrolling, .reconnecting: return CC.blue
        case .disconnected:             return CC.text4
        }
    }
}
