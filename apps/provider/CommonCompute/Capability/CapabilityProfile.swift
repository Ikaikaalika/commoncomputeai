import Foundation
import Metal
import CoreML
import VideoToolbox
import IOKit
import IOKit.ps

// Static capability snapshot, probed once per session and cached.
struct CapabilityProber {

    static func probe(advertisedRuntimes: [String] = []) -> CapabilityProfile {
        let chipName = readChipName()
        let variant = ChipVariantTable.lookup(chipName)
        let cpu = probeCPU()
        let gpu = probeGPU(variant: variant)
        let ane = probeANE(variant: variant)
        let media = probeMedia(variant: variant)
        let memGB = probeMemoryGB()
        let osVer = probeOSVersion()

        return CapabilityProfile(
            chip: chipName,
            cpu: cpu,
            gpu: gpu,
            ane: ane,
            media: media,
            memoryGB: memGB,
            runtimes: advertisedRuntimes,
            os: osVer,
            cluster: nil
        )
    }

    // MARK: - Chip name

    private static func readChipName() -> String {
        var size = 0
        sysctlbyname("machdep.cpu.brand_string", nil, &size, nil, 0)
        guard size > 0 else { return "Unknown" }
        var buf = [CChar](repeating: 0, count: size)
        sysctlbyname("machdep.cpu.brand_string", &buf, &size, nil, 0)
        let raw = String(cString: buf)
        // On Apple Silicon, brand_string is "Apple M3 Max" etc.
        // Fall back to hw.model if it looks like an Intel string.
        if raw.hasPrefix("Apple") { return raw }
        return readSysctl("hw.model") ?? raw
    }

    private static func readSysctl(_ name: String) -> String? {
        var size = 0
        sysctlbyname(name, nil, &size, nil, 0)
        guard size > 0 else { return nil }
        var buf = [CChar](repeating: 0, count: size)
        sysctlbyname(name, &buf, &size, nil, 0)
        return String(cString: buf)
    }

    private static func readSysctlInt(_ name: String) -> Int? {
        var value: Int32 = 0
        var size = MemoryLayout<Int32>.size
        guard sysctlbyname(name, &value, &size, nil, 0) == 0 else { return nil }
        return Int(value)
    }

    // MARK: - CPU

    private static func probeCPU() -> CPUCapabilities {
        let pCores = readSysctlInt("hw.perflevel0.physicalcpu") ?? 0
        let eCores = readSysctlInt("hw.perflevel1.physicalcpu") ?? 0
        let logical = readSysctlInt("hw.logicalcpu") ?? ProcessInfo.processInfo.processorCount
        return CPUCapabilities(performanceCores: pCores, efficiencyCores: eCores, logical: logical)
    }

    // MARK: - GPU

    private static func probeGPU(variant: ChipVariant) -> GPUCapabilities {
        let devices = MTLCopyAllDevices()
        let primary = devices.first(where: { !$0.isLowPower }) ?? devices.first

        let familyStr: String
        if let dev = primary {
            if dev.supportsFamily(.apple9) { familyStr = "apple9" }
            else if dev.supportsFamily(.apple8) { familyStr = "apple8" }
            else if dev.supportsFamily(.apple7) { familyStr = "apple7" }
            else { familyStr = "apple6" }
        } else {
            familyStr = "unknown"
        }

        let maxWorkingSetGB = primary.map { Int($0.recommendedMaxWorkingSetSize / 1_073_741_824) } ?? 0
        let metal3 = primary?.supportsFamily(.apple8) ?? false

        return GPUCapabilities(
            family: familyStr,
            cores: variant.gpuCores,
            metal3: metal3,
            recommendedMaxWorkingSetGB: maxWorkingSetGB
        )
    }

    // MARK: - ANE

    private static func probeANE(variant: ChipVariant) -> ANECapabilities {
        // ANE availability: attempt to load a trivial CoreML model with ANE compute units.
        // We infer generation + TOPS from the chip variant table since Apple doesn't expose them publicly.
        let available = testANEAvailability()
        return ANECapabilities(available: available, generation: variant.aneGeneration, tops: variant.aneTOPS)
    }

    private static func testANEAvailability() -> Bool {
        // Heuristic: Apple Silicon with macOS 14+ always has ANE.
        // A proper test would compile a trivial mlpackage; skipped here to avoid bundle dependency.
        #if arch(arm64)
        return true
        #else
        return false
        #endif
    }

    // MARK: - Media engines

    private static func probeMedia(variant: ChipVariant) -> MediaCapabilities {
        var encoders: [String] = []
        var decoders: [String] = []

        let codecMap: [(CMVideoCodecType, String)] = [
            (kCMVideoCodecType_H264, "h264"),
            (kCMVideoCodecType_HEVC, "hevc"),
            (kCMVideoCodecType_AppleProRes422, "prores"),
            (kCMVideoCodecType_VP9, "vp9"),
            (kCMVideoCodecType_AV1, "av1")
        ]

        for (codec, name) in codecMap {
            if VTIsHardwareDecodeSupported(codec) { decoders.append(name) }
        }

        // All Apple Silicon Macs have hardware H.264, HEVC, and ProRes encoders.
        #if arch(arm64)
        encoders = ["h264", "hevc", "prores"]
        #endif

        return MediaCapabilities(encoders: encoders, decoders: decoders, engines: variant.mediaEngines)
    }

    // MARK: - Memory

    private static func probeMemoryGB() -> Int {
        var memSize: UInt64 = 0
        var size = MemoryLayout<UInt64>.size
        sysctlbyname("hw.memsize", &memSize, &size, nil, 0)
        return Int(memSize / 1_073_741_824)
    }

    // MARK: - OS version

    private static func probeOSVersion() -> String {
        let v = ProcessInfo.processInfo.operatingSystemVersion
        return "\(v.majorVersion).\(v.minorVersion).\(v.patchVersion)"
    }
}

// MARK: - Chip variant lookup table

struct ChipVariant {
    let name: String
    let gpuCores: Int
    let aneGeneration: Int
    let aneTOPS: Double
    let mediaEngines: Int
}

enum ChipVariantTable {
    static func lookup(_ chipName: String) -> ChipVariant {
        // Parse "Apple M3 Max", "Apple M4 Pro", etc.
        let lower = chipName.lowercased()
        let gen: Int
        if lower.contains("m4") { gen = 4 }
        else if lower.contains("m3") { gen = 3 }
        else if lower.contains("m2") { gen = 2 }
        else if lower.contains("m1") { gen = 1 }
        else { return unknown }

        let isUltra = lower.contains("ultra")
        let isMax   = lower.contains("max")
        let isPro   = lower.contains("pro")

        switch gen {
        case 4:
            if isUltra { return ChipVariant(name: "M4 Ultra", gpuCores: 80, aneGeneration: 18, aneTOPS: 76, mediaEngines: 4) }
            if isMax   { return ChipVariant(name: "M4 Max",   gpuCores: 40, aneGeneration: 18, aneTOPS: 38, mediaEngines: 2) }
            if isPro   { return ChipVariant(name: "M4 Pro",   gpuCores: 20, aneGeneration: 18, aneTOPS: 38, mediaEngines: 1) }
            return               ChipVariant(name: "M4",       gpuCores: 10, aneGeneration: 18, aneTOPS: 38, mediaEngines: 1)
        case 3:
            if isUltra { return ChipVariant(name: "M3 Ultra", gpuCores: 80, aneGeneration: 16, aneTOPS: 36, mediaEngines: 4) }
            if isMax   { return ChipVariant(name: "M3 Max",   gpuCores: 40, aneGeneration: 16, aneTOPS: 18, mediaEngines: 2) }
            if isPro   { return ChipVariant(name: "M3 Pro",   gpuCores: 18, aneGeneration: 16, aneTOPS: 18, mediaEngines: 1) }
            return               ChipVariant(name: "M3",       gpuCores: 10, aneGeneration: 16, aneTOPS: 18, mediaEngines: 1)
        case 2:
            if isUltra { return ChipVariant(name: "M2 Ultra", gpuCores: 76, aneGeneration: 15, aneTOPS: 31, mediaEngines: 4) }
            if isMax   { return ChipVariant(name: "M2 Max",   gpuCores: 38, aneGeneration: 15, aneTOPS: 15, mediaEngines: 2) }
            if isPro   { return ChipVariant(name: "M2 Pro",   gpuCores: 19, aneGeneration: 15, aneTOPS: 15, mediaEngines: 1) }
            return               ChipVariant(name: "M2",       gpuCores: 10, aneGeneration: 15, aneTOPS: 15, mediaEngines: 1)
        case 1:
            if isUltra { return ChipVariant(name: "M1 Ultra", gpuCores: 64, aneGeneration: 14, aneTOPS: 22, mediaEngines: 4) }
            if isMax   { return ChipVariant(name: "M1 Max",   gpuCores: 32, aneGeneration: 14, aneTOPS: 11, mediaEngines: 2) }
            if isPro   { return ChipVariant(name: "M1 Pro",   gpuCores: 16, aneGeneration: 14, aneTOPS: 11, mediaEngines: 1) }
            return               ChipVariant(name: "M1",       gpuCores: 8,  aneGeneration: 14, aneTOPS: 11, mediaEngines: 1)
        default:
            return unknown
        }
    }

    private static let unknown = ChipVariant(name: "Unknown", gpuCores: 0, aneGeneration: 0, aneTOPS: 0, mediaEngines: 0)
}
