import SwiftUI

// Four-slide first-run tour. Non-technical users get a tight, friendly
// primer before they ever see the dashboard. Every slide ≤ 2 sentences;
// the last one requests notification permission.

struct OnboardingView: View {
    let onDone: () -> Void
    @EnvironmentObject private var vm: AppViewModel

    @State private var slide: Int = 0
    @State private var allowNotifications: Bool = true

    private let slides: [(title: String, body: String)] = [
        ("Welcome to Common Compute.",
         "Your Mac will help power AI tasks while you're not using it — and you'll get paid for the work."),
        ("You're always in control.",
         "The app pauses the moment you touch your keyboard or your Mac gets warm. You can also pause it yourself anytime from the menu bar."),
        ("You get paid weekly.",
         "Earnings land in your bank account every Friday in US dollars. You'll see the running total on the Earnings page."),
        ("You're set.",
         "We'll let you know when your Mac starts earning. Everything else lives in the Dashboard."),
    ]

    var body: some View {
        VStack(spacing: 0) {
            content
            footer
        }
        .frame(width: 520, height: 420)
        .background(CC.bg)
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 10) {
                NetworkLogo(size: 32)
                Wordmark(size: .small)
                Spacer()
                Text("\(slide + 1) / \(slides.count)")
                    .font(.ccMono(size: 11))
                    .foregroundStyle(CC.text3)
            }

            Spacer(minLength: 8)

            Text(slides[slide].title)
                .font(.ccDisplay(size: 28, weight: .medium))
                .tracking(-0.6)
                .foregroundStyle(CC.text)

            Text(slides[slide].body)
                .font(.ccDisplay(size: 14))
                .foregroundStyle(CC.text2)
                .fixedSize(horizontal: false, vertical: true)

            if slide == slides.count - 1 {
                Toggle(isOn: $allowNotifications) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Notify me about important things")
                            .font(.ccDisplay(size: 13, weight: .medium))
                            .foregroundStyle(CC.text)
                        Text("Only offline, paused, and first-payout alerts. No spam.")
                            .font(.ccDisplay(size: 11))
                            .foregroundStyle(CC.text3)
                    }
                }
                .toggleStyle(.switch)
                .tint(CC.blue)
                .padding(.top, 8)
            }

            Spacer(minLength: 8)
        }
        .padding(.horizontal, 32)
        .padding(.top, 28)
    }

    private var footer: some View {
        HStack {
            Button("Skip") { finish() }
                .buttonStyle(.plain)
                .font(.ccDisplay(size: 12, weight: .medium))
                .foregroundStyle(CC.text3)

            Spacer()

            if slide > 0 {
                Button("Back") { withAnimation { slide -= 1 } }
                    .buttonStyle(CCGhostButtonStyle())
            }

            Button(slide == slides.count - 1 ? "Get started" : "Next") {
                if slide == slides.count - 1 { finish() }
                else { withAnimation { slide += 1 } }
            }
            .buttonStyle(CCPrimaryButtonStyle())
            .frame(minWidth: 120)
        }
        .padding(20)
        .background(CC.panel)
        .overlay(alignment: .top) {
            Rectangle().fill(CC.line).frame(height: 1)
        }
    }

    private func finish() {
        if slide == slides.count - 1, allowNotifications {
            Task { await NotificationManager.shared.requestPermission() }
        }
        onDone()
    }
}
