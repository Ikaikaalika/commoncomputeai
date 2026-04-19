import Foundation

// Translates backend errors into friendly messages before they reach
// the UI. Non-technical users should never see "lease expired" or
// "D1_ERROR: SQLITE_ERROR". If a specific match isn't found we fall
// back to a generic message and stash the raw text for support.

struct FriendlyError {
    let userMessage: String      // shown in UI
    let supportDetails: String   // copied when user clicks "Copy details"
}

enum ErrorPresenter {

    // Known substrings → user-facing translation. First match wins.
    private static let patterns: [(match: String, friendly: String)] = [
        ("lease expired",
         "That task took longer than expected. We'll pick up another one shortly."),
        ("thermal",
         "Your Mac got warm and paused. It'll resume once it cools down."),
        ("Unauthorized",
         "Signed out — please sign in again to continue earning."),
        ("network",
         "Couldn't reach Common Compute. Check your internet connection."),
        ("timeout",
         "The network took too long to respond. Trying again in a moment."),
        ("Invalid email or password",
         "That email and password didn't match. Try again."),
        ("Email already registered",
         "There's already an account with that email. Try signing in instead."),
        ("password must be at least",
         "Your password needs to be at least 8 characters."),
    ]

    static func present(_ raw: String) -> FriendlyError {
        for (match, friendly) in patterns where raw.localizedCaseInsensitiveContains(match) {
            return FriendlyError(userMessage: friendly, supportDetails: raw)
        }
        return FriendlyError(
            userMessage: "Something went wrong. Try again, or copy the details below if you contact support.",
            supportDetails: raw
        )
    }

    // Convenience for Error instances.
    static func present(_ error: Error) -> FriendlyError {
        present(error.localizedDescription)
    }
}
