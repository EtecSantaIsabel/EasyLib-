# Security Specification & Payload-First Security TDD (`security_spec.md`)

## 1. Data Invariants
1. **Owner & Multi-Provider Verification Invariant**: Every document in `/users/{userId}` is strictly owned by `request.auth.uid == userId`, requires a verified email (`email_verified == true`), verified phone SMS (`sign_in_provider == 'phone' && phone_number != null`), or Apple sign-in (`sign_in_provider == 'apple.com'`), and enforces `incoming().uid == request.auth.uid`.
2. **PII Isolation Invariant**: `/users/{userId}` holds `email` (PII) and forbids `list` queries (`allow list: if false;`) and non-owner `get` requests. `/leaderboard/{userId}` holds zero PII and only exposes public ranking fields (`isPublic == true`).
3. **Subcollection Master Gate Invariant**: `/users/{userId}/translations/{translationId}` verifies parent `/users/{userId}` existence and ownership (`get(...).data.uid == request.auth.uid`) on `get` and `create`, while `list` queries enforce `resource.data.userId == request.auth.uid` without `get()` calls.
4. **Temporal & Immutability Invariant**: `createdAt` must equal `request.time` on creation and remain immutable on updates; `updatedAt` must equal `request.time` on updates; `uid` / `userId` cannot change after creation.
5. **Bounded Payload & Type Safety Invariant**: All document IDs match `^[a-zA-Z0-9_-]{1,128}$` (and room codes match `^[A-Z0-9]{6,12}$`), all strings enforce explicit `.size()` ceilings, all numbers enforce realistic bounds, and all arrays are strictly bounded (`<= 3000` / `<= 500` / `<= 50` / `<= 30`).
6. **Closed Room Access & Master Gate Invariant**: `/rooms/{roomCode}` strictly forbids `list` queries (`allow list: if false;`) so codes cannot be enumerated or scraped. Joining `/rooms/{roomCode}/members/{userId}` requires parent `/rooms/{roomCode}` existence (`roomExists(roomCode)` Master Gate), and listing members requires `resource.data.roomCode == roomCode` and active room membership.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **Unauthenticated Read on `/users/userA`**: `auth = null`, `get(/users/userA)` -> `PERMISSION_DENIED`.
2. **Cross-User PII Read on `/users/userA`**: `auth = { uid: 'userB', email_verified: true }`, `get(/users/userA)` -> `PERMISSION_DENIED`.
3. **User Collection Scraping (`list` on `/users`)**: `auth = { uid: 'userA', email_verified: true }`, `list(/users)` -> `PERMISSION_DENIED`.
4. **Unverified Email Spoof on `/users/userA`**: `auth = { uid: 'userA', email_verified: false }`, `create(/users/userA, ...)` -> `PERMISSION_DENIED`.
5. **Shadow / Ghost Field Injection on `/users/userA`**: `{ ..., isAdmin: true, role: 'superadmin' }` -> rejected by `keys().hasOnly(...)`.
6. **Identity Spoofing on `/users/userB` as `userA`**: `create(/users/userB, { uid: 'userA', ... })` -> rejected by `isOwner(userId)`.
7. **UID Immutability Bypass on Update**: `update(/users/userA, { uid: 'userB', ... })` -> rejected by `affectedKeys().hasOnly(...)` & `incoming().uid == existing().uid`.
8. **Client-Spoofed `createdAt` / `updatedAt` Timestamp**: `create(/users/userA, { ..., createdAt: '2020-01-01T00:00:00Z' })` -> rejected by `incoming().createdAt == request.time`.
9. **ID Poisoning (>128 chars or special chars)**: `create(/users/userA/translations/invalid$$$id...)` -> rejected by `isValidId()`.
10. **PII Leak Attempt into `/leaderboard/userA`**: `create(/leaderboard/userA, { ..., email: 'leak@example.com' })` -> rejected by `hasOnly(...)`.
11. **Query Trust Bypass on `/leaderboard`**: `list(/leaderboard)` without `.where('isPublic', '==', true)` -> rejected by `resource.data.isPublic == true`.
12. **Orphaned / Cross-Owner Translation Write**: `auth = userB`, `create(/users/userA/translations/t1, { userId: 'userB', ... })` -> rejected by Master Gate `isUserParentOwner(userId)` + `isOwner(userId)`.
13. **Room Code Enumeration (`list` on `/rooms`)**: `list(/rooms)` -> `PERMISSION_DENIED`.
14. **Invalid or Nonexistent Room Join**: `create(/rooms/FAKE99/members/userA, ...)` where `/rooms/FAKE99` does not exist -> rejected by Master Gate `roomExists(roomCode)`.
15. **Cross-Room Member Snooping (`list` on `/rooms/LIB7K9/members` without joining)**: `auth = nonMember` -> rejected by `isRoomMember(roomCode)`.

## 3. Verification Checklist
- ESLint `@firebase/eslint-plugin-security-rules` passes with 0 errors on `firestore.rules`.
- Every collection in `firebase-blueprint.json` (`/users/{userId}`, `/leaderboard/{userId}`, `/users/{userId}/translations/{translationId}`, `/rooms/{roomCode}`, `/rooms/{roomCode}/members/{userId}`) has explicit hardened match blocks after the global catch-all deny rule.
