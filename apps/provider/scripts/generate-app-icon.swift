#!/usr/bin/env swift
// Generates a 1024×1024 macOS app icon from the NetworkLogo brand mark.
//
// Run:
//   swift apps/provider/scripts/generate-app-icon.swift
//
// Writes: apps/provider/CommonCompute/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png
// Then use sips to derive the smaller variants.

import SwiftUI
import AppKit

// ── Brand colors (mirrors CC.* tokens) ────────────────────────────────────────
extension Color {
    static let ccBg      = Color(red: 0x0A/255, green: 0x0C/255, blue: 0x10/255)
    static let ccPanel   = Color(red: 0x10/255, green: 0x13/255, blue: 0x1A/255)
    static let ccBlue    = Color(red: 0x8E/255, green: 0xC9/255, blue: 0xF8/255)
    static let ccBlueDp  = Color(red: 0x5D/255, green: 0xA8/255, blue: 0xEC/255)
    static let ccLight   = Color(red: 0xDB/255, green: 0xF0/255, blue: 0xFF/255)
    static let ccRing    = Color(red: 0xDF/255, green: 0xF2/255, blue: 0xFF/255)
    static let ccSilver1 = Color(red: 0xF3/255, green: 0xF5/255, blue: 0xF8/255)
    static let ccSilver2 = Color(red: 0xB9/255, green: 0xC0/255, blue: 0xC8/255)
    static let ccSilver3 = Color(red: 0x6F/255, green: 0x76/255, blue: 0x82/255)
}

// ── Network mark at any canvas size ───────────────────────────────────────────
struct NetworkIcon: View {
    var body: some View {
        Canvas { ctx, sz in
            let s = sz.width / 48.0
            func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * s, y: y * s) }

            // Edge nodes + connection lines use the silver gradient from the site.
            let silver = GraphicsContext.Shading.linearGradient(
                Gradient(stops: [
                    .init(color: .ccSilver1, location: 0.0),
                    .init(color: .ccSilver2, location: 0.45),
                    .init(color: .ccSilver3, location: 1.0),
                ]),
                startPoint: p(8, 4),
                endPoint:   p(40, 44)
            )

            var lines = Path()
            lines.move(to: p(24, 10));   lines.addLine(to: p(24, 24))
            lines.move(to: p(10.5, 32)); lines.addLine(to: p(24, 24))
            lines.move(to: p(37.5, 32)); lines.addLine(to: p(24, 24))
            ctx.stroke(lines, with: silver, style: StrokeStyle(lineWidth: 1.8 * s, lineCap: .round))

            for (cx, cy) in [(24.0, 8.0), (10.0, 34.0), (38.0, 34.0)] {
                let r = 4.2 * s
                let rect = CGRect(x: cx*s - r, y: cy*s - r, width: r*2, height: r*2)
                ctx.fill(Path(ellipseIn: rect), with: silver)
            }

            // Outer glow + gradient core hub.
            let glow = 10.0 * s
            let glowRect = CGRect(x: 24*s - glow, y: 24*s - glow, width: glow*2, height: glow*2)
            ctx.fill(Path(ellipseIn: glowRect), with: .radialGradient(
                Gradient(stops: [
                    .init(color: Color.ccBlue.opacity(0.5), location: 0),
                    .init(color: Color.ccBlue.opacity(0.0), location: 1),
                ]),
                center: p(24, 24), startRadius: 0, endRadius: glow
            ))

            let core = 6.0 * s
            let coreRect = CGRect(x: 24*s - core, y: 24*s - core, width: core*2, height: core*2)
            ctx.fill(Path(ellipseIn: coreRect), with: .linearGradient(
                Gradient(stops: [
                    .init(color: .ccLight,  location: 0),
                    .init(color: .ccBlueDp, location: 1),
                ]),
                startPoint: p(18, 16), endPoint: p(32, 32)
            ))
            ctx.stroke(Path(ellipseIn: coreRect), with: .color(.ccRing.opacity(0.7)), lineWidth: 0.8 * s)
        }
    }
}

// ── Full icon composition: dark panel + centered mark ─────────────────────────
struct AppIconView: View {
    var body: some View {
        ZStack {
            // Background: deep navy with a subtle blue radial highlight, matching
            // the site's hero wash.
            Color.ccBg
            RadialGradient(
                colors: [Color.ccBlue.opacity(0.22), .clear],
                center: .init(x: 0.72, y: 0.22),
                startRadius: 0,
                endRadius: 700
            )
            NetworkIcon()
                .frame(width: 720, height: 720) // ~70% of canvas — safe area for squircle
        }
        .frame(width: 1024, height: 1024)
    }
}

// ── Render + write ────────────────────────────────────────────────────────────
@MainActor
func renderAndWrite() throws {
    let outURL = URL(fileURLWithPath: CommandLine.arguments.count > 1
        ? CommandLine.arguments[1]
        : "apps/provider/CommonCompute/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png")

    let renderer = ImageRenderer(content: AppIconView())
    renderer.scale = 1.0
    renderer.proposedSize = .init(width: 1024, height: 1024)

    guard let nsImage = renderer.nsImage else {
        FileHandle.standardError.write(Data("render failed\n".utf8))
        exit(1)
    }
    guard let tiff = nsImage.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else {
        FileHandle.standardError.write(Data("png encode failed\n".utf8))
        exit(1)
    }

    try FileManager.default.createDirectory(
        at: outURL.deletingLastPathComponent(),
        withIntermediateDirectories: true
    )
    try png.write(to: outURL)
    print("wrote \(outURL.path) — \(png.count) bytes")
}

Task { @MainActor in
    do { try renderAndWrite() } catch {
        FileHandle.standardError.write(Data("error: \(error)\n".utf8))
        exit(1)
    }
    exit(0)
}
RunLoop.main.run()
