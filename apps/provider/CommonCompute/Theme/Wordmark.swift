import SwiftUI

// "Common ● Compute" — the gradient dot is the brand mark between the two words.
// Sizes follow the site: hero (26px), header (17px).
struct Wordmark: View {
    enum Size {
        case hero, header, small

        var fontSize: CGFloat {
            switch self {
            case .hero:   return 20
            case .header: return 17
            case .small:  return 15
            }
        }

        var dotSize: CGFloat {
            // Site uses 22% of the wordmark font size for the dot diameter.
            fontSize * 0.55
        }
    }

    var size: Size = .header

    var body: some View {
        HStack(spacing: size.fontSize * 0.32) {
            Text("Common")
                .font(.ccDisplay(size: size.fontSize, weight: .medium))
                .foregroundStyle(CC.text)
            Circle()
                .fill(
                    LinearGradient(
                        colors: [Color(hex: 0xDBF0FF), Color(hex: 0x5DA8EC)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: size.dotSize, height: size.dotSize)
            Text("Compute")
                .font(.ccDisplay(size: size.fontSize, weight: .medium))
                .foregroundStyle(CC.text)
        }
        .tracking(-0.2)
    }
}
