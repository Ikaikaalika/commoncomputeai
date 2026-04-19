import SwiftUI

// Primary CTA: off-white on navy (site's N_btnPrimary).
struct CCPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.ccDisplay(size: 13, weight: .medium))
            .foregroundStyle(CC.bg)
            .padding(.vertical, 9)
            .padding(.horizontal, 14)
            .frame(maxWidth: .infinity)
            .background(CC.text.opacity(configuration.isPressed ? 0.85 : 1.0))
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .contentShape(RoundedRectangle(cornerRadius: 6))
    }
}

// Ghost: transparent with line border (site's N_btnGhost).
struct CCGhostButtonStyle: ButtonStyle {
    var destructive: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.ccDisplay(size: 13, weight: .medium))
            .foregroundStyle(destructive ? CC.negative : CC.text)
            .padding(.vertical, 9)
            .padding(.horizontal, 14)
            .background(
                Color.white.opacity(configuration.isPressed ? 0.06 : 0.0)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .strokeBorder(CC.line, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .contentShape(RoundedRectangle(cornerRadius: 6))
    }
}

// Accent: brand blue background.
struct CCAccentButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.ccDisplay(size: 13, weight: .medium))
            .foregroundStyle(CC.bg)
            .padding(.vertical, 9)
            .padding(.horizontal, 14)
            .background(CC.blue.opacity(configuration.isPressed ? 0.85 : 1.0))
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .contentShape(RoundedRectangle(cornerRadius: 6))
    }
}
