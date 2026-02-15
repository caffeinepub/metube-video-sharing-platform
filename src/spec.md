# Specification

## Summary
**Goal:** Allow AI video generation prompts containing adult/sexual terms by removing the current keyword-based blocking behavior and updating related UI messaging.

**Planned changes:**
- Remove the frontend prompt keyword block that prevents AI video generation when adult/sexual terms (e.g., “sex”) are present.
- Update AI Studio (Video Generation) user-facing policy UI/copy so it no longer claims prompts will be rejected due to banned keywords; ensure all revised text is in English.
- Adjust the local content policy utility so adult/sexual keywords are no longer treated/exposed as hard-prohibited terms for AI generation, and ensure no runtime errors in MeTube AI Studios.

**User-visible outcome:** In MeTube AI Studios > Video Generation, users can enter prompts containing previously-blocked adult/sexual words (e.g., “sex”) and generation proceeds normally (subject to login and remaining generation time limits), without showing the prohibited-content error toast.
