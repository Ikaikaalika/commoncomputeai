import SwiftUI

// Brand card: panel background, 1px CC.line border, 12pt radius.
// Default padding 16pt (compact for 400pt popover); site uses 28–36.
struct CCCardModifier: ViewModifier {
    var padding: CGFloat = 16
    var background: Color = CC.panel
    var radius: CGFloat = 12

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(background, in: RoundedRectangle(cornerRadius: radius))
            .overlay(
                RoundedRectangle(cornerRadius: radius)
                    .strokeBorder(CC.line, lineWidth: 1)
            )
    }
}

extension View {
    func ccCard(padding: CGFloat = 16, background: Color = CC.panel, radius: CGFloat = 12) -> some View {
        modifier(CCCardModifier(padding: padding, background: background, radius: radius))
    }
}
