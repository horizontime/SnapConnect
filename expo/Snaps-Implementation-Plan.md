
# Snaps Feature – Implementation Plan

  

This document breaks down the "Snaps" feature (see `Snaps-Feature-Specification.md`) into manageable phases. Each phase lists concrete, bite-sized tasks so work can be parallelised, reviewed, and merged incrementally.

  

> **Reference**: Whenever a requirement or behaviour is unclear, ALWAYS cross-check the authoritative `Snaps-Feature-Specification.md` in the project root.

  

---

  

## Phase 0 – Project Preparation & Dependencies

  

1.  **Audit current code-base**

* Ensure Expo is on SDK 53 and Metro/Babel config is compatible.

2.  **Install required libraries (via `bun add`)**

* Camera & Media: `expo-camera`, `expo-video`, `expo-media-library`, `react-native-view-shot`.

* UI / Gestures: `react-native-gesture-handler`, `react-native-reanimated` (v3), `react-native-svg`.

  

Deliverable: green build with new deps.

  

---

  

## Phase 1 – Supabase Schema & Storage

  

1.  **Create storage buckets**

*  `snaps` (direct)

*  `stories`

2.  **SQL migrations** (via Supabase CLI)

*  `snaps` table: sender_id, recipient_ids (array), media_url, type, overlay_meta (JSONB), expires_at, viewed_by (array), created_at.

*  `stories` table: id, user_id, media_url, thumbnail_url, type, caption, metadata, created_at, expires_at.

*  `story_views` table: id, story_id, viewer_id, viewed_at.

3.  **RLS policies** to allow read/write only for owners/recipients.

4.  **Edge function / CRON** to purge expired snaps & stories.

  

Deliverable: migrations merged; local Supabase branch passes tests.

  

---

  

## Phase 2 – Media Capture UI

  

1.  **Camera screen** inside `(tabs)/camera.tsx`

* Central capture button with tap (photo) / hold (video) behaviour.

* 15-second max recording timer & progress ring.

2.  **Permissions flow** for camera & microphone.

3.  **Preview navigation** → push to `SnapEditor`.

  

Deliverable: photo/video capture working on device/emulator.

  

---

  

## Phase 3 – Snap Editor

  

1.  **Editor screen** (new route `app/camera/editor.tsx`).

2.  **Display preview**

* Image: `<Image>`

* Video: looping `<Video>` (from `expo-video`).

3.  **Overlay system**

* Stickers (static images), Captions (Text), AR placeholder.

* Use Gesture Handler + Reanimated for drag/resize/rotate.

4.  **Persist overlays**

* If photo → capture final composite via `react-native-view-shot`.

* If video → store overlay metadata (positions, scale, text) in state for upload.

  

Deliverable: user can decorate snap and proceed to share modal.

  

---

  

## Phase 4 – Upload & Database Write Helpers

  

1.  **Utility** in `utils/supabase.ts` to upload media with progress.

2.  **For photos**

* Upload baked image ⇒ receive public URL.

3.  **For videos**

* Upload raw video.

* Generate thumbnail (client-side) and upload.

* Serialize overlay metadata.

4.  **Database writes**

* Insert into `snaps` or `stories` tables with correct expiry timestamps.

  

Deliverable: snap/stories rows appear in DB; media accessible via public URL.

  

---

  

## Phase 5 – Sharing UI & Flow

  

1.  **"For Stories" button** – writes to `stories` and navigates back.

2.  **"Send to" modal**

* Re-use friend list from `friendStore`.

* Multi-select and send.

3.  **Optimistic UI** – show sending states & errors.

  

Deliverable: users can post stories and send snaps to friends.

  

---

  

## Phase 6 – Receiving & Viewing Direct Snaps

  

1.  **Location & UI layer**

* Add a distinct "Snaps" section at the top of the existing Messages tab (below pinned chats if any).

* Each incoming snap renders as its own row (reuse `ChatListItem` style) with: sender avatar, name, media-type icon (photo / video), and time-ago label.

  

2.  **Realtime delivery**

* Subscribe (Supabase Realtime) to `snaps` table where `recipient_ids` contains the current user.

* Insert events push a new item into local store; deletes remove it.

  

3.  **Ephemeral viewing workflow**

* Tapping a row opens a full-screen `SnapViewer` component.

* For photo: display image full-screen for as long as viewer keeps it open.

* For video: play in a loop with `expo-video`; overlay metadata (stickers, captions) is rendered on top using absolute-positioned React elements.

  

4.  **Single-view enforcement**

* On first open, immediately PATCH the `snaps` row → mark `viewed_by` array to include current user.

* After the viewer is dismissed (or the video finishes), call an edge function that permanently deletes the media file from Supabase Storage **and** removes the DB row for this recipient.

  

5.  **Automatic expiry**

* Edge function / CRON runs every hour to purge snaps older than 24 h that are still un-viewed.

  

6.  **No screenshot detection**

* Per spec, skip any screenshot listeners or alerts.

  

Deliverable: Snaps arrive in real-time, can be viewed exactly once, and are self-purged either immediately after view or after 24 h.

  

---

  

## Phase 7 – Stories Tab & Viewer

  

1.  **Component breakdown**

*  `YourStoryHeader` – rendered at top of Stories tab.

*  `StoriesGrid` – `FlatList` with `numColumns={2}` to show friend stories.

*  `StoryCard` – individual story preview cell.

*  `StoryViewer` – fullscreen pager overlay.

  

2.  **"Your Story" header details**

*  **Visual states**

*  _No active story_: circular avatar + "Your Story" label + prominent `+` icon badge.

*  _Active story_: avatar with coloured ring. Optional count badge showing number of snaps.

*  **Interactions**

* Tap w/ no story → launches snap capture flow pre-filtered to "story" destination.

* Tap w/ active story → opens viewer for user's own story with ability to delete or add snaps.

*  **Data check**: query `stories` table for authenticated user where `expires_at` > now().

  

3.  **Stories grid (friends' stories)**

* Layout: grid with 2 columns; responsive cell width using `FlatList`'s `numColumns`.

* Real-time: subscribe to `stories` table to insert / delete entries; subscribe to `story_views` to update viewed status.

* Empty state message: "No stories from friends yet! Add friends to see their stories."

  

4.  **StoryCard contents**

* Static preview: thumbnail image of most recent snap (photo or frame extracted from video).

* Sender avatar (small round) overlaid bottom-left.

* Sender display name under thumbnail (or as a bottom overlay).

* Viewed indicator: colourful ring (unviewed) or faded ring (viewed).

  

5.  **Ordering & filtering**

* Primary: unviewed stories first.

* Secondary within each grouping: order by latest `created_at` of story.

  

6.  **StoryViewer interactions**

* Fullscreen pager cycling through snaps with auto-advance timer.

* Display progress bar at top; tap to skip; swipe down to dismiss.

* Render overlays for video snaps (captions, stickers) during playback using metadata.

* Record view: upon first display of a snap insert into `story_views`.

  

7.  **Expiry & cleanup**

* CRON / edge function deletes story rows & storage after 24 h.

* Client removes expired stories from local store on subscription delete events.

  

Deliverable: Stories tab mirrors spec – header interaction, real-time grid, viewer with overlay support, view tracking, and expiry handling.

  

---

  

## Phase 8 – Realtime Synchronisation & Cleanup

  

1.  **Supabase Realtime hooks** – chat, snaps, stories updates.

2.  **Background tasks** (Expo Headless) to fetch/purge if app inactive.

3.  **Edge function** cron already purges expired rows; verify.

  

Deliverable: UI stays in sync without manual refresh.

  

