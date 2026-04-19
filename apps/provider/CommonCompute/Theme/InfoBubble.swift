import SwiftUI

// `ⓘ` hover-popover for jargon. Sits next to a technical label and
// opens a small panel with a one-line explanation when the user
// hovers the icon — lets us keep plain-English labels as the primary
// UI text while still offering depth for curious users.

struct InfoBubble: View {
    var text: String
    @State private var hovering = false

    var body: some View {
        Image(systemName: "info.circle")
            .font(.system(size: 11))
            .foregroundStyle(CC.text3)
            .onHover { hovering = $0 }
            .overlay(alignment: .topLeading) {
                if hovering {
                    Text(text)
                        .font(.ccDisplay(size: 11))
                        .foregroundStyle(CC.text2)
                        .padding(10)
                        .frame(maxWidth: 240, alignment: .leading)
                        .background(CC.panel2, in: RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8).strokeBorder(CC.line, lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.35), radius: 14, y: 4)
                        .offset(x: 16, y: -4)
                        .zIndex(100)
                        .allowsHitTesting(false)
                }
            }
    }
}
