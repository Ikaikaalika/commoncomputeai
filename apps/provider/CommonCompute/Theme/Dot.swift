import SwiftUI

// Pulsing status dot used in eyebrows and the menu bar icon.
// Matches the site's live-status dot (e.g. hero "LIVE" chip).
struct Dot: View {
    var color: Color
    var size: CGFloat = 6
    var pulse: Bool = false

    @State private var animating = false

    var body: some View {
        ZStack {
            if pulse {
                Circle()
                    .fill(color.opacity(0.35))
                    .frame(width: size * (animating ? 2.2 : 1.0),
                           height: size * (animating ? 2.2 : 1.0))
                    .opacity(animating ? 0.0 : 0.6)
            }
            Circle()
                .fill(color)
                .frame(width: size, height: size)
        }
        .frame(width: size * 2.2, height: size * 2.2)
        .onAppear {
            guard pulse else { return }
            withAnimation(.easeOut(duration: 1.1).repeatForever(autoreverses: false)) {
                animating = true
            }
        }
    }
}
