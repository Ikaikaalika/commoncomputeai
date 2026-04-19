import SwiftUI

@main
struct CommonComputeApp: App {
    @StateObject private var vm = AppViewModel()

    var body: some Scene {
        MenuBarExtra {
            ContentView()
                .environmentObject(vm)
                .preferredColorScheme(.dark)
                .background(CC.bg)
        } label: {
            MenuBarIconView(status: vm.connectionStatus)
        }
        .menuBarExtraStyle(.window)
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
