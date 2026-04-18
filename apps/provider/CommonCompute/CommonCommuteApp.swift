import SwiftUI

@main
struct CommonComputeApp: App {
    @StateObject private var vm = MenubarViewModel()

    var body: some Scene {
        // Menubar-style window: compact popover anchored to status item.
        // Full daemon split (LaunchAgent + XPC) arrives in Phase M2.
        WindowGroup("Common Compute") {
            ContentView()
                .environmentObject(vm)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
    }
}
