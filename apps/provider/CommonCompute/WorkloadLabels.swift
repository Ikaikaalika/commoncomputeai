import Foundation

// Plain-English translation of runner type strings.
// Reused by Dashboard (active tasks), Jobs (row labels + filters),
// JobInspector, and the menu bar popover.
//
// Why centralize: non-technical users should never see "whisper_ane"
// or "coreml_embed" anywhere in the default UI. This is the single
// source of truth for how each runner type is described.

enum WorkloadLabels {
    struct Label {
        let title: String        // "Transcribing audio"
        let verb: String         // "Transcribed" — past tense, for history rows
        let description: String  // one-line what-it-does
    }

    static let table: [String: Label] = [
        "whisper_ane": Label(
            title: "Transcribing audio",
            verb: "Transcribed audio",
            description: "Converts spoken audio into text using the Apple Neural Engine."
        ),
        "coreml_embed": Label(
            title: "Finding text meaning",
            verb: "Analyzed text meaning",
            description: "Turns sentences into numerical fingerprints so apps can find related content."
        ),
        "coreml_vision": Label(
            title: "Understanding an image",
            verb: "Analyzed an image",
            description: "Describes what's in a photo using on-device vision models."
        ),
        "videotoolbox": Label(
            title: "Processing video",
            verb: "Processed video",
            description: "Converts or compresses video using your Mac's media engines."
        ),
        "mlx_llm": Label(
            title: "Running a chat model",
            verb: "Answered with a chat model",
            description: "Generates text from a language model on your GPU."
        ),
        "mlx_image": Label(
            title: "Generating an image",
            verb: "Generated an image",
            description: "Creates an image from a text description on your GPU."
        ),
        "cpu_bench": Label(
            title: "Running a quick check",
            verb: "Ran a quick check",
            description: "A short CPU benchmark used to verify this Mac is healthy."
        ),
    ]

    static func title(for type: String) -> String {
        table[type]?.title ?? type.capitalized.replacingOccurrences(of: "_", with: " ")
    }

    static func verb(for type: String) -> String {
        table[type]?.verb ?? "Finished a task"
    }

    static func description(for type: String) -> String {
        table[type]?.description ?? "A compute task this Mac can run."
    }
}

// Priority translation (used by Settings + JobInspector).
enum PriorityLabels {
    static func title(for p: TaskPriority) -> String {
        switch p {
        case .priority: return "Urgent"
        case .standard: return "Normal"
        case .batch:    return "Background"
        }
    }
}
