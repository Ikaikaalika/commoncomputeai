import SwiftUI

// Native macOS app menu (App / File / Edit / View / Window / Help).
// Keyboard shortcuts let power users move without the mouse, but the
// menu items also double as self-documenting discovery for newcomers
// — the View menu IS the sitemap.

struct CommonComputeCommands: Commands {
    @ObservedObject var vm: AppViewModel

    var body: some Commands {
        // App menu → Preferences is handled automatically by the Settings scene.

        // File → New / Close.
        CommandGroup(replacing: .newItem) {
            Button("New Dashboard Window") {
                if let url = URL(string: "commoncompute://main") {
                    NSWorkspace.shared.open(url)
                }
                NSApp.activate(ignoringOtherApps: true)
            }
            .keyboardShortcut("n", modifiers: .command)
        }

        // View → page switching.
        CommandMenu("View") {
            ForEach(Array(AppRouter.Page.allCases.enumerated()), id: \.element) { idx, page in
                Button(page.title) { vm.router.page = page }
                    .keyboardShortcut(
                        KeyEquivalent(Character(String(idx + 1))),
                        modifiers: .command
                    )
            }
            Divider()
            Button("Toggle Sidebar") {
                NSApp.keyWindow?.firstResponder?
                    .tryToPerform(#selector(NSSplitViewController.toggleSidebar(_:)), with: nil)
            }
            .keyboardShortcut("s", modifiers: [.command, .option])
        }

        // Help → docs + support.
        CommandGroup(replacing: .help) {
            Button("Common Compute Docs") {
                if let url = URL(string: "https://commoncompute.ai/docs") {
                    NSWorkspace.shared.open(url)
                }
            }
            Button("Provider Guide") {
                if let url = URL(string: "https://commoncompute.ai/providers") {
                    NSWorkspace.shared.open(url)
                }
            }
            Divider()
            Button("Report an Issue") {
                if let url = URL(string: "mailto:support@commoncompute.ai") {
                    NSWorkspace.shared.open(url)
                }
            }
        }
    }
}
