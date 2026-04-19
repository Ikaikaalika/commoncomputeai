import SwiftUI

// Brand tokens mirroring apps/web/src/components/tokens.ts (NT.*).
// Naming stays short (`CC.bg`, `CC.text`) so call-sites read like the web.
enum CC {
    static let bg        = Color(hex: 0x0A0C10)
    static let panel     = Color(hex: 0x10131A)
    static let panel2    = Color(hex: 0x151923)
    static let line      = Color.white.opacity(0.08)
    static let lineSoft  = Color.white.opacity(0.05)

    static let text      = Color(hex: 0xECEEF1)
    static let text2     = Color(hex: 0xB4B9C2)
    static let text3     = Color(hex: 0x7F8590)
    static let text4     = Color(hex: 0x555A64)

    static let silver1   = Color(hex: 0xD5DCE4)
    static let silver2   = Color(hex: 0xAEB5BE)
    static let silver3   = Color(hex: 0x868E97)

    static let blue      = Color(hex: 0x8EC9F8)
    static let blueDeep  = Color(hex: 0x5DA8EC)
    static let positive  = Color(hex: 0x7EE2A8)

    // Muted brand red — site uses red sparingly for errors; tuned to sit on #0A0C10.
    static let negative  = Color(red: 0.93, green: 0.46, blue: 0.46)
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red:   Double((hex >> 16) & 0xFF) / 255.0,
            green: Double((hex >>  8) & 0xFF) / 255.0,
            blue:  Double( hex        & 0xFF) / 255.0
        )
    }
}
