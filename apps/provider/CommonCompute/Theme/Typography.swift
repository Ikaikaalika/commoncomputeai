import SwiftUI

// Brand fonts — PostScript family names match the variable TTFs in Resources/Fonts.
// Variable-axis weight is applied via SwiftUI's .weight() modifier.
enum CCFontFamily {
    static let display = "InterTight-Regular"
    static let mono    = "JetBrainsMono-Regular"
}

extension Font {
    static func ccDisplay(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        Font.custom(CCFontFamily.display, size: size).weight(weight)
    }

    static func ccMono(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        Font.custom(CCFontFamily.mono, size: size).weight(weight)
    }
}

// Eyebrow: small uppercase mono label, wide tracking, tertiary text.
// Matches the site's .ccUpperLabel pattern.
struct EyebrowModifier: ViewModifier {
    var color: Color = CC.text3
    func body(content: Content) -> some View {
        content
            .font(.ccMono(size: 10.5, weight: .medium))
            .tracking(1.2)
            .textCase(.uppercase)
            .foregroundStyle(color)
    }
}

extension View {
    func eyebrow(color: Color = CC.text3) -> some View {
        modifier(EyebrowModifier(color: color))
    }
}
