# Snaps Feature Progress

## Phase 0 – Project Preparation & Dependencies ✅

- Audited the existing code-base and confirmed the project is already running **Expo SDK 53**.
- Verified required libraries already present (`expo-camera`, `expo-video`, `expo-media-library`, `react-native-gesture-handler`, `react-native-svg`).
- Installed the missing dependencies with Bun:
  - `react-native-view-shot` (capture edited images)
  - `react-native-reanimated@3` (gesture animations)
- Added the required Babel plugin `"react-native-reanimated/plugin"` to `babel.config.js` so Metro can compile Reanimated v3 correctly.

Phase 0 tasks are complete and the project still builds.

## Phase 1 – Supabase Schema & Storage ✅

- Added automatic bucket provisioning via `ensureMediaBuckets()` in `utils/supabase.ts`, ensuring the `snaps` and `stories` storage buckets exist (creates them on first run).
- Created Supabase migrations under `supabase/migrations/`:
  - `0001_create_snaps_stories_tables.sql` → defines `snaps`, `stories`, and `story_views` tables with indices.
  - `0002_rls_snaps_stories.sql` → enables RLS and adds granular access policies for all three tables.
- Added an edge function (`supabase/edge-functions/purge_expired_content/`) that purges expired snaps & stories and their storage objects (to be scheduled hourly via the Supabase dashboard).

Schema, security rules, and cleanup automation are now defined. Ready to move on to Phase 2 (Media Capture UI).

## Phase 2 – Media Capture UI ✅

- Enhanced `app/(tabs)/camera.tsx` to fully match the spec:
  - Long-press now records **videos up to 15 s** (`maxDuration: 15`).
  - Added a timer that updates a recording progress value every 100 ms.
  - Integrated `RecordingProgressRing` (new component) so a circular progress ring animates around the capture button while recording.
  - After capture/record, the screen now navigates to a new Snap Editor route instead of the old modal.
- Updated `components/camera/CameraControls.tsx`:
  - Added `recordingProgress` prop.
  - Shows the progress ring and updated styles.
- Added `components/camera/RecordingProgressRing.tsx` (SVG-based).
- Added placeholder screen `app/camera/editor.tsx` that previews the captured image or video (looping) — Phase 3 will build the actual editing tools on top of this.


Capture UI, permissions, 15-second recording limit, and navigation to the editor are now working. Ready for Phase 3 – Snap Editor.

## Phase 3 – Snap Editor ✅

- Implemented interactive Snap Editor (`app/camera/editor.tsx`):
  - Shows captured photo or looping video using `expo-video`.
  - Added toolbar with buttons to add **text captions** and **stickers**, plus a **Continue** button.
  - Overlays are rendered via new `OverlayItem` component with **drag & pinch-to-zoom** gestures (Reanimated v3 + Gesture Handler).
  - Installed `nanoid` and generate IDs for each overlay.
  - For photos, the entire editor view is captured with `react-native-view-shot` so overlays are _baked_ into a single image before uploading/sending.
  - For videos, overlay metadata is serialised to JSON and forwarded with the video URI for dynamic rendering.
- Created new component `components/snap-editor/OverlayItem.tsx` encapsulating the gesture logic.
- Added editor-root `GestureHandlerRootView` and a simple bottom toolbar UI.

Phase 3 tasks are done — users can now add draggable/resizeable captions and stickers before sharing.  Next: Phase 4 (upload helpers).

## Phase 4 – Upload & DB Helpers ✅

- Extended `utils/supabase.ts`:
  - `uploadMedia(bucket, fileUri, onProgress)` uploads photos/videos to the `snaps` or `stories` buckets and returns the public URL.
  - `createSnap()` inserts a row in `snaps` with 24-hour expiry.
  - `createStory()` inserts into `stories` with optional caption/metadata + expiry.
- Added video-thumbnail generation helper `utils/upload.ts` using **expo-video-thumbnails** (installed).
- Added type `UploadResult` for clarity.

These utilities give us a single place to handle media uploads, thumbnails and DB writes, ready for Phase 5 UI flows.

## Phase 5 – Sharing UI & Flow ✅

- Snap Editor: added **Story** button (green) and repurposed the upload button (icon).
  - Story flow `handlePostStory` captures/bakes photo (or uses video), uploads to `stories` bucket, generates video thumbnail, and inserts a row via `createStory()`. Uses logged-in `userId` from `authStore`.
- Friend-selection modal (`app/modal.tsx`): replaced old chat-message placeholder with real snap sharing logic:
  - Uploads media to `snaps` bucket with `uploadMedia()`.
  - Parses overlay metadata if supplied.
  - Calls `createSnap()` once with the chosen friends array.
  - Progress indicator remains; success alert pops, then route closes.
- Removed unused chat code & message types; added `overlayMeta` param to router types.

Users can now:
1. Tap "Story" to instantly post to their story.
2. Tap the upload icon to pick friends and send direct snaps (multi-select).

Backend gets proper DB rows & storage uploads — ready for Phase 6 (receiving & viewing snaps).

## Phase 6 – Receiving & Viewing Direct Snaps ✅

- Added `store/snapStore.ts` (Zustand) to fetch, live-subscribe, mark-viewed and delete snaps.
- Created `components/snap/SnapListItem.tsx` row UI.
- Updated Messages tab (`app/(tabs)/index.tsx`):
  - Hooks into `snapStore` for the Snaps toggle.
  - Renders each incoming snap via `SnapListItem` and opens new route `/snaps/[id]`.
- Added full-screen viewer `app/snaps/[id].tsx`:
  - Displays photo or looping video (using `expo-video`).
  - Renders video overlays (non-interactive) using existing `OverlayItem` (read-only).
  - On tap exit → calls `markViewed()` which deletes the snap row & removes it from UI.
- Enhanced `OverlayItem` with `editable` flag so it can be used for static display.

Result: snaps arrive in real-time, appear in the Snaps tab, open once for viewing, and are removed afterwards — matching Phase 6 requirements.

## Phase 7 – Stories Tab & Viewer ✅

- **Grid UI**: Stories tab now renders a 2-column grid using new `components/story/StoryCard.tsx` (thumbnail preview + avatar ring).
- **Ordering & viewed state**:
  - `storyStore.fetchStories(userId)` pulls `stories` and `story_views`, flags viewed, ensures `lastUpdated`, and sorts unviewed → newest.
- **Your Story header**: `StoryThumbnail` at top; tapping opens camera if no story, otherwise opens your own story viewer.
- **Real-time**: Stories list refreshes via `fetchStories` (triggered on mount and user change). (Full realtime channel can be added later.)
- **Viewer overlays**: existing story viewer remains; grid now navigates to it.

With this, Stories tab matches the spec layout & behaviour. Phase 7 complete — next step: Phase 8 (sync & cleanup) if desired.

## Phase 8 – Realtime Sync & Cleanup ✅

- **Realtime Channels**
  - Added `storyStore.subscribeToRealtime(userId)` to listen for new stories, deletions, and `story_views` inserts. Stories grid updates instantly.
  - Snap store already handled inserts/deletes; no change needed.

- **Background fetch (Expo)**
  - `utils/sync.ts` registers a background task (`expo-background-fetch` + `expo-task-manager`) that refreshes snaps & stories every 15 min when the app is in the background.

- **Stories Tab hookup**
  - On mount, stories tab now calls `subscribeToRealtime` for live updates.

This wraps up Phase 8; the app stays in sync in real-time and even fetches updates periodically when idle. 