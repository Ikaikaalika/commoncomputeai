import Foundation
import IOKit.ps

// Evaluates routine config against current system state to decide whether
// the device should accept new work. All checks are cheap and synchronous.
enum RoutineManager {
    static func shouldAcceptWork(
        config: RoutineConfig,
        telemetry: LiveTelemetry?
    ) -> (allowed: Bool, reason: String?) {
        if config.acOnlyMode && isOnBattery() {
            return (false, "Paused: on battery power")
        }
        if let window = config.scheduledWindow, window.enabled, !isInWindow(window) {
            return (false, "Paused: outside scheduled hours")
        }
        if config.idleOnlyMode {
            let idle = telemetry?.userIdleSeconds ?? 0
            let threshold = Double(config.idleThresholdMinutes * 60)
            if idle < threshold {
                return (false, "Paused: user is active")
            }
        }
        return (true, nil)
    }

    static func isOnBattery() -> Bool {
        let snap = IOPSCopyPowerSourcesInfo().takeRetainedValue()
        let list = IOPSCopyPowerSourcesList(snap).takeRetainedValue() as [AnyObject]
        for src in list {
            if let info = IOPSGetPowerSourceDescription(snap, src).takeUnretainedValue() as? [String: Any],
               (info[kIOPSTypeKey] as? String) == kIOPSInternalBatteryType {
                return (info[kIOPSPowerSourceStateKey] as? String) == kIOPSBatteryPowerValue
            }
        }
        return false
    }

    private static func isInWindow(_ w: RoutineConfig.ScheduleWindow) -> Bool {
        let h = Calendar.current.component(.hour, from: Date())
        if w.startHour <= w.endHour {
            return h >= w.startHour && h < w.endHour
        }
        // Overnight: e.g., 21–06
        return h >= w.startHour || h < w.endHour
    }
}
