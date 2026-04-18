import Foundation
import IOKit
import IOKit.ps
import CoreGraphics

// Samples live hardware metrics; delta-reported every 10s to the Router.
actor LiveTelemetrySampler {
    private var lastCPUTicks: CPUTicks?
    private var engineInFlight: [String: Int] = [:]

    func sample() -> LiveTelemetry {
        let cpuUtil = sampleCPU()
        let gpuUtil = sampleGPUUtilization()
        let memPressure = sampleMemoryPressure()
        let thermal = sampleThermal()
        let (power, battery) = samplePower()
        let idle = sampleUserIdle()
        let inflight = engineInFlight

        return LiveTelemetry(
            cpu: cpuUtil,
            gpuUtilization: gpuUtil,
            memoryPressure: memPressure,
            thermal: thermal,
            power: power,
            batteryPercent: battery,
            userIdleSeconds: idle,
            engineInFlight: inflight,
            aneUtilizationInferred: estimateANEUtilization(inflight: inflight),
            timestamp: Date().timeIntervalSince1970
        )
    }

    func updateEngineInFlight(_ counts: [String: Int]) {
        engineInFlight = counts
    }

    // MARK: - CPU

    private struct CPUTicks {
        let user: UInt64
        let system: UInt64
        let idle: UInt64
        let nice: UInt64

        var active: UInt64 { user + system + nice }
        var total: UInt64 { active + idle }
    }

    private func sampleCPU() -> CPUTelemetry {
        var info = host_cpu_load_info()
        var count = mach_msg_type_number_t(MemoryLayout<host_cpu_load_info_data_t>.size / MemoryLayout<integer_t>.size)

        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                host_statistics(mach_host_self(), HOST_CPU_LOAD_INFO, $0, &count)
            }
        }
        guard result == KERN_SUCCESS else {
            return CPUTelemetry(performanceUtilization: 0, efficiencyUtilization: 0)
        }

        let current = CPUTicks(
            user: UInt64(info.cpu_ticks.0),
            system: UInt64(info.cpu_ticks.1),
            idle: UInt64(info.cpu_ticks.2),
            nice: UInt64(info.cpu_ticks.3)
        )

        let utilization: Double
        if let last = lastCPUTicks {
            let dTotal = Double(current.total - last.total)
            let dActive = Double(current.active - last.active)
            utilization = dTotal > 0 ? dActive / dTotal : 0
        } else {
            utilization = 0
        }
        lastCPUTicks = current

        // host_cpu_load_info is aggregate; we can't split P/E from it.
        // Report the same utilization for both clusters.
        return CPUTelemetry(performanceUtilization: utilization, efficiencyUtilization: utilization)
    }

    // MARK: - GPU

    private func sampleGPUUtilization() -> Double {
        // IOKit path: look for IOAccelerator service and read PerformanceStatistics.
        let matching = IOServiceMatching("IOAccelerator")
        var iter: io_iterator_t = 0
        guard IOServiceGetMatchingServices(kIOMainPortDefault, matching, &iter) == KERN_SUCCESS else { return 0 }
        defer { IOObjectRelease(iter) }

        var service = IOIteratorNext(iter)
        while service != 0 {
            defer {
                IOObjectRelease(service)
                service = IOIteratorNext(iter)
            }
            var props: Unmanaged<CFMutableDictionary>?
            guard IORegistryEntryCreateCFProperties(service, &props, kCFAllocatorDefault, 0) == KERN_SUCCESS,
                  let dict = props?.takeRetainedValue() as? [String: Any],
                  let stats = dict["PerformanceStatistics"] as? [String: Any],
                  let util = stats["Device Utilization %"] as? Double
            else { continue }
            return util / 100.0
        }
        return 0
    }

    // MARK: - Memory pressure

    private func sampleMemoryPressure() -> String {
        var info = vm_statistics64()
        var count = mach_msg_type_number_t(MemoryLayout<vm_statistics64_data_t>.size / MemoryLayout<integer_t>.size)
        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                host_statistics64(mach_host_self(), HOST_VM_INFO64, $0, &count)
            }
        }
        guard result == KERN_SUCCESS else { return "unknown" }

        let pageSize = Double(vm_kernel_page_size)
        let wired = Double(info.wire_count) * pageSize
        let active = Double(info.active_count) * pageSize
        let total = Double(ProcessInfo.processInfo.physicalMemory)
        let pressureRatio = (wired + active) / total

        if pressureRatio > 0.9 { return "critical" }
        if pressureRatio > 0.7 { return "warning" }
        return "normal"
    }

    // MARK: - Thermal

    private func sampleThermal() -> ThermalState {
        switch ProcessInfo.processInfo.thermalState {
        case .nominal:  return .nominal
        case .fair:     return .fair
        case .serious:  return .serious
        case .critical: return .critical
        @unknown default: return .nominal
        }
    }

    // MARK: - Power

    private func samplePower() -> (PowerSource, Double?) {
        guard let blob = IOPSCopyPowerSourcesInfo()?.takeRetainedValue(),
              let list = IOPSCopyPowerSourcesList(blob)?.takeRetainedValue() as? [CFTypeRef]
        else { return (.unknown, nil) }

        for source in list {
            guard let info = IOPSGetPowerSourceDescription(blob, source)?.takeUnretainedValue() as? [String: Any]
            else { continue }

            let isCharging = info[kIOPSIsChargingKey] as? Bool ?? false
            let currentCap = info[kIOPSCurrentCapacityKey] as? Int
            let maxCap = info[kIOPSMaxCapacityKey] as? Int ?? 100

            let batteryPercent = currentCap.map { Double($0) / Double(maxCap) * 100 }
            let onAC = isCharging || (info[kIOPSPowerSourceStateKey] as? String == kIOPSACPowerValue)

            return (onAC ? .ac : .battery, batteryPercent)
        }
        return (.unknown, nil)
    }

    // MARK: - User idle

    private func sampleUserIdle() -> Double {
        CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .mouseMoved)
    }

    // MARK: - ANE utilization (inferred)

    private func estimateANEUtilization(inflight: [String: Int]) -> Double? {
        let aneCount = (inflight["ane"] ?? 0) + (inflight["whisper_ane"] ?? 0) + (inflight["coreml_embed"] ?? 0)
        guard aneCount > 0 else { return nil }
        return min(Double(aneCount), 1.0)
    }
}
