# Common Compute macOS app

This folder contains a native SwiftUI shell for the provider-side worker app.

## Generate the Xcode project

This repo uses XcodeGen to keep the project source-controlled as text.

```bash
brew install xcodegen
cd apps/macos/CommonCompute
xcodegen generate
open CommonCompute.xcodeproj
```

## Current features
- provider login/register API calls
- device enrollment
- task polling
- task completion
- earnings summary card
- room to add sandboxed runtimes and background worker execution
