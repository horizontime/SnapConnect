# Socket.IO Messaging Refactor Plan

> Goal: Replace the current Supabase-Realtime powered messaging layer with a more flexible Socket.IO implementation **while continuing to use Supabase Postgres as the single source of truth for chat and message data** and keeping the rest of the Expo SDK 53 application intact.

---

## Phase 0 – Discovery & Decisions
1. **Audit current code**
   • Trace all places that touch `chatStore`, `supabase` realtime subscriptions, or message-related SQL tables.
2. **Set local endpoint**
   • Confirm the port (e.g., 3333) and LAN IP you'll use for your local Socket.IO server.
3. **Security model**
   • Agree that the Expo app will send the user's Supabase JWT in the initial connection query so the server can verify identity with Supabase Admin-API.
4. **Definition of done (DoD)**
   • Real-time chat, read receipts, typing indicators all work end-to-end with Socket.IO and tests are green.

---

## Phase 1 – Server Scaffolding
1. **Create `server/` workspace** (independent Node project).
2. **Install deps** (server): `socket.io`, `@supabase/supabase-js`, `dotenv` (optional), `typescript`/`ts-node` (optional).
3. **Basic server**
   • `src/index.ts` spins up a Node HTTP server with `http.createServer()` and attaches Socket.IO on the chosen `PORT`.
   • Logs connection & performs JWT verification (disconnect unauthenticated clients).

Deliverable: Socket.IO "hello-world" echoes messages from one client to another, locally.

---

## Phase 2 – Event Contract
Define a single source of truth (`shared/chatEvents.ts`) that both server & client import.

Event | Payload | Description
--- | --- | ---
`chat:send` | `{chatId, type, content, clientTempId}` | Client sends a new message.
`chat:new` | `Message` | Server broadcasts newly persisted message.
`chat:read` | `{chatId, messageId}` | Client marks latest message read.
`chat:typing` | `{chatId, isTyping}` | Typing indicator.
`system:error` | `{message}` | Standard error wrapper.

Deliverable: Events enumerated & type-safe.

---

## Phase 3 – Server Message Workflow
1. **DB write**: On `chat:send`, server writes to `messages` table via Supabase Service Role key.
2. **Emit**: After insert, server emits `chat:new` to `room(chatId)`.
3. **Rooms & Presence**
   • `socket.join(chatId)` on connect.
   • Maintain in-memory map `{chatId: Set<userId>}` for online status.
4. **Read receipts**: On `chat:read`, update `is_read` column & broadcast to others.

Deliverable: Automated integration test posts message, other socket receives it.

---

## Phase 4 – Client Integration
1. **Install packages** (Expo side):
   ```sh
   bun add socket.io-client
   ```
2. **Connection helper** `utils/socket.ts`
   • Connect with `?token=<JWT>` query param.
   • Reconnect logic with exponential back-off.
3. **Refactor `chatStore`**
   • Remove Supabase `subscribeToChat` / `unsubscribeFromChat`.
   • Replace with Socket.IO listeners.
4. **Typing indicator**
   • Dispatch `chat:typing` when user types.

Deliverable: Messaging works in dev build without Supabase realtime.

---

## Phase 5 – UI/UX Enhancements
1. Show real-time online status using presence map.
2. Show "typing..." indicator in `chat/[id].tsx`.
3. Display delivered ✓ / read ✓✓ ticks using `chat:read` events.

---

## Phase 6 – Cleanup & Removal
1. Delete Supabase realtime channels from `chatStore`.
2. Remove any unused DB triggers related to realtime.
3. Update documentation & README badges.

---

