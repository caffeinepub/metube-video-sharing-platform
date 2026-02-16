# Specification

## Summary
**Goal:** Add a clear in-app “Install App” entry point for the metube.xyz PWA that can trigger the native install prompt when available, with an iOS/Safari fallback that shows installation instructions.

**Planned changes:**
- Add a discoverable “Install App” action within the app UI (e.g., via an existing menu/overflow area) that is only shown when the app is not already installed.
- Wire the action to trigger the native PWA install prompt via `beforeinstallprompt` when supported.
- Provide an in-app, dismissible modal (or equivalent) with step-by-step English instructions for iOS/Safari when `beforeinstallprompt` is unavailable.
- Ensure the existing install banner and the new “Install App” entry point do not conflict (avoid redundant prompts) and both properly stop showing after successful installation without requiring a refresh.

**User-visible outcome:** Mobile users can intentionally install metube.xyz from a clear “Install App” action; supported browsers show the native install prompt, while iOS/Safari users see clear add-to-home-screen instructions in a dismissible in-app UI.
