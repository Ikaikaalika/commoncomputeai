import SwiftUI

// Port of apps/web/src/components/NetworkLogo.tsx
// Three silver nodes at top + two bottom corners, connected to a glowing
// blue core hub. 48x48 source grid, scaled to `size`.
struct NetworkLogo: View {
    var size: CGFloat = 26
    var monochrome: Bool = false

    var body: some View {
        Canvas { ctx, canvasSize in
            let s = canvasSize.width / 48.0
            func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * s, y: y * s) }

            let silverShading = GraphicsContext.Shading.linearGradient(
                Gradient(stops: [
                    .init(color: monochrome ? .primary.opacity(0.95) : Color(hex: 0xF3F5F8), location: 0.0),
                    .init(color: monochrome ? .primary.opacity(0.70) : Color(hex: 0xB9C0C8), location: 0.45),
                    .init(color: monochrome ? .primary.opacity(0.55) : Color(hex: 0x6F7682), location: 1.0),
                ]),
                startPoint: p(8, 4),
                endPoint:   p(40, 44)
            )

            // Connection lines
            var lines = Path()
            lines.move(to: p(24, 10));    lines.addLine(to: p(24, 24))
            lines.move(to: p(10.5, 32));  lines.addLine(to: p(24, 24))
            lines.move(to: p(37.5, 32));  lines.addLine(to: p(24, 24))
            ctx.stroke(
                lines,
                with: silverShading,
                style: StrokeStyle(lineWidth: 1.8 * s, lineCap: .round)
            )

            // Outer nodes
            for (cx, cy) in [(24.0, 8.0), (10.0, 34.0), (38.0, 34.0)] {
                let r = 4.2 * s
                let rect = CGRect(x: cx * s - r, y: cy * s - r, width: r * 2, height: r * 2)
                ctx.fill(Path(ellipseIn: rect), with: silverShading)
            }

            // Glow halo
            let glowRadius = 10.0 * s
            let glowRect = CGRect(
                x: 24 * s - glowRadius,
                y: 24 * s - glowRadius,
                width: glowRadius * 2,
                height: glowRadius * 2
            )
            if !monochrome {
                ctx.fill(
                    Path(ellipseIn: glowRect),
                    with: .radialGradient(
                        Gradient(stops: [
                            .init(color: Color(hex: 0x8EC9F8).opacity(0.5), location: 0),
                            .init(color: Color(hex: 0x8EC9F8).opacity(0.0), location: 1),
                        ]),
                        center: p(24, 24),
                        startRadius: 0,
                        endRadius: glowRadius
                    )
                )
            }

            // Core hub
            let coreRadius = 6.0 * s
            let coreRect = CGRect(
                x: 24 * s - coreRadius,
                y: 24 * s - coreRadius,
                width: coreRadius * 2,
                height: coreRadius * 2
            )
            if monochrome {
                ctx.fill(Path(ellipseIn: coreRect), with: .color(.primary))
            } else {
                ctx.fill(
                    Path(ellipseIn: coreRect),
                    with: .linearGradient(
                        Gradient(stops: [
                            .init(color: Color(hex: 0xDBF0FF), location: 0),
                            .init(color: Color(hex: 0x5DA8EC), location: 1),
                        ]),
                        startPoint: p(18, 16),
                        endPoint: p(32, 32)
                    )
                )
                ctx.stroke(
                    Path(ellipseIn: coreRect),
                    with: .color(Color(hex: 0xDFF2FF).opacity(0.7)),
                    lineWidth: 0.8 * s
                )
            }
        }
        .frame(width: size, height: size)
    }
}
