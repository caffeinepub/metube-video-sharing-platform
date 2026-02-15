# Specification

## Summary
**Goal:** Extend MeTube AI Studios with an on-device image workflow (upload, prompt-based image generation, and simple promo creation) and add a YouTubeMe.co companion entry point with an informational in-app page.

**Planned changes:**
- Add an Images/Pictures section inside MeTube AI Studios (tabbed or clearly separated) for authenticated users.
- Implement client-side image upload, prompt-based “Generate Image” with preview, and at least 2 selectable style variants.
- Add a promo creator that lets users place text overlays and simple graphic elements over an uploaded image, with at least one fully on-device “remove” capability, plus PNG export/download.
- Add optional persistence: authenticated users can save generated/promo images to a personal library (list/view/delete) backed by existing Motoko single-actor backend + existing blob storage, with owner/admin-only access enforcement.
- Add a visible “YouTubeMe.co” navigation/CTA (e.g., footer and/or Discover) that routes to an in-app informational page and optionally links out to https://YouTubeMe.co in a new tab.

**User-visible outcome:** Signed-in users can generate images from prompts, create and download simple promo images from uploaded pictures (including a basic on-device remove tool), and optionally save/manage their creations in a personal library; all users can find a “YouTubeMe.co” entry point that opens an in-app explainer page (and may link out to YouTubeMe.co).
