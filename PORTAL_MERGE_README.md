# Plasma Care — Merged Site (Customer + Staff/Admin + B2B)

Ab ek hi repo/deployment hai. Customer-facing site (Home, booking flow)
bilkul pehle jaisa hai — koi change nahi. Staff/Admin panel aur naya B2B
portal `/portal/*` ke peeche lazy-loaded hain, isliye normal customer ka
bundle bada nahi hua.

## Kya kaha se aaya

| Route | Kya hai |
|---|---|
| `/` | Customer site (unchanged) |
| `/portal/login` | Sabka single login — role se decide hota hai kahan bhejna hai |
| `/portal/request-access` | B2B ke liye public request form |
| `/portal/mfa/enroll`, `/portal/mfa/verify` | Admin ka 2FA (sirf role=admin ko dikhega) |
| `/portal/staff/*` | Staff/Admin panel (purana Admin--main ka poora content yahan move hua) |
| `/portal/b2b/*` | Naya B2B portal — Dashboard, Bulk Add, History |

Home page par top-right mein ek naya **"Portal Login"** dropdown/drawer
hai jisme B2B login, Request Access, aur Staff/Admin login teeno milte
hain.

## Setup — order se karo

1. **SQL** (Supabase SQL editor mein, isi order mein):
   - `supabase/role_based_single_login.sql` (agar pehle se run nahi kiya)
   - `supabase/b2b_and_bulk_requests.sql`
2. **Bootstrap admin**: `role_based_single_login.sql` ke andar comment
   mein di gayi query se apne existing admin ko `role='admin'` set karo
   (agar pehle se nahi kiya).
3. **Edge function deploy** (B2B approve button ke kaam karne ke liye):
   ```
   supabase functions deploy approve-b2b-request
   ```
   Isko koi extra secret nahi chahiye — `SUPABASE_URL` aur
   `SUPABASE_SERVICE_ROLE_KEY` Supabase khud provide karta hai.
4. **2FA confirm karo**: Supabase Dashboard → Authentication → Providers
   → Multi-Factor Authentication → Authenticator App **ON** hona chahiye
   (default mein on hota hai, bas confirm kar lo).
5. `.env` mein wahi `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` daalo
   jo customer site already use kar raha tha (same project).
6. `npm install && npm run build`

## Flow — B2B

1. Koi bhi `/portal/request-access` form bharta hai (login ki zarurat
   nahi) → `b2b_requests` table mein pending row ban jaati hai.
2. Admin panel → **B2B Requests** tab → Approve.
3. Edge function real Supabase Auth login banata hai + unko email se
   invite bhejta hai (password set karne ka link).
4. Wo `/portal/login` se login karke `/portal/b2b` pe land karte hain.
5. **Bulk Add**: package/test select karo, patients ek line mein
   `Name, Age, Gender, Phone` format mein paste karo, submit karo.
   Ye `b2b_bulk_requests` table mein jaata hai — staff ise dekh ke
   real bookings mein convert karte hain (jaan-boojh kar seedha
   `bookings` table mein force nahi kiya, taaki uske existing
   scheduling rules na tootein).

## Flow — Admin 2FA

Pehli baar admin login karega → seedha QR-code enroll screen pe jayega
(Authenticator app se scan karna hoga). Uske baad har login pe 6-digit
code maangega. Staff/B2B roles ke liye 2FA zaroori nahi hai.

## Android build

`viewport-fit=cover` + safe-area CSS (`env(safe-area-inset-*)`) already
lagi hui hai poori site mein — jab Android WebView/TWA mein wrap karoge,
status bar/nav bar content ko crop nahi karega. Desktop pe koi effect
nahi (env values 0 rehte hain).

## Note

Purana `Admin--main` repo ab standalone deploy karne ki zarurat nahi —
sab kuch is ek repo mein aa gaya hai. Purana repo backup ke liye rakh
sakte ho, bas use production mein deploy mat karna (do jagah alag-alag
update hone se confusion hoga).

## Update — Dev Pulse, dropdown nav, Views fix

1. **Run one more SQL file**: `supabase/activity_logs.sql` (after the
   other two).
2. **Create the developer account**: same as staff — add a user in
   Supabase Authentication → Users, then in `staff_profiles` set their
   `role` to `developer` (Table Editor, same way you promoted admin).
   They'll go through the same 2FA enroll flow as admin on first login.
3. Dev Pulse lives at `/portal/dev` — it is **not** a tab inside the
   staff panel, and admin cannot open it either (`requireRole` on the
   route checks for exactly `role = 'developer'`).
4. The AI Packages tab is removed from the staff panel; replaced by the
   Dev Pulse activity/error feed. The old `AiPackagesTab.jsx` file is
   still in the repo but unused — safe to delete later if you don't
   need it back.
5. Fixed: opening the Views tab no longer crashes. The bug was the
   merge itself — customer site and admin panel were joining the same
   Supabase Realtime "site-viewers" channel in one browser tab. The
   customer-side analytics/presence code now only runs on non-`/portal`
   routes.
6. Staff/Admin panel tabs are now a dropdown (tap to open) instead of a
   horizontal scrolling row, so nothing gets cut off on narrow screens.

## What logEvent() covers right now

Automatic (needs no per-page work): every uncaught JS error/promise
rejection, anywhere on the site.

Manually instrumented so far: customer booking creation, staff/admin/B2B
login success+failure, B2B request submitted/approved/rejected, B2B bulk
request submitted, staff role changes. Add more over time by calling
`logEvent({ type, source, message, metadata })` from `src/lib/telemetry.js`
at any other action worth tracking (payment attempts, catalog edits,
report uploads, etc.) — same pattern everywhere.

## Update — Collection staff dispatch (Rapido-rider style)

1. **Run one more SQL file**: `supabase/collection_dispatch.sql` — adds
   `assigned_collector_id` and `collection_status` to `bookings`, plus
   RLS so a collector only sees/updates their own assigned bookings.
   **Read the note inside that file** — it depends on `bookings` RLS
   already being enabled with an existing admin/staff policy; if admin's
   booking view breaks after running it, tell me and I'll adjust.
2. **Create collector accounts**: same pattern as staff/admin/developer
   — add the person in Authentication → Users, then set their
   `staff_profiles.role` to `collector`. No 2FA needed for this role.
3. **Admin side**: in the Bookings tab, home-collection bookings now
   show a **Collection staff** dropdown instead of the old free-text
   field, listing active collectors with their current open-job count
   (so you can see who's free before assigning). Lab-visit bookings keep
   the old free-text field, since there's no rider workflow for those.
4. **Collector side**: `/portal/collector` — their own job list (Rapido-
   style cards): Accept/Decline a new assignment, then Start → Arrived →
   Mark Collected. Each card has Call and Navigate (opens Google Maps
   directions to the address) buttons. History tab shows past jobs.
   Not part of the staff panel — its own route, own dropdown-free UI.
5. Marking a job "Collected" also flips the booking's main `status` to
   `sample_collected`, so the existing report/payment flow downstream
   is untouched.

This covers the core Rapido-style loop (assign → accept → en route →
arrived → collected) plus call/navigate. Live GPS tracking of the
collector's position (so admin/patient sees them moving on a map in
real time, like Rapido does) is a meaningfully bigger feature — needs
background location permission, which really only works well from a
native Android wrapper rather than a browser tab — flagging it as a
natural next step rather than building a half-working version now.

## Update — B2B homepage card, collections merged into staff panel, developer hidden, bug fixes

1. **Run one more SQL file**: `supabase/hide_developer_role.sql` — after
   this, Admin's Access tab can no longer see, edit, or create a
   `developer` row, enforced at the database level (not just hidden in
   the UI). Your existing developer account (created directly in the SQL
   editor) still works fine — this only restricts what *Admin* can do
   through the app.

2. **Deploy the B2B-approve edge function without the CLI** — since you
   don't have a local dev environment, use the Supabase Dashboard
   instead of `supabase functions deploy`:
   - Supabase Dashboard → **Edge Functions** → **Deploy a new function**
   - Name it exactly `approve-b2b-request`
   - Open `supabase/functions/approve-b2b-request/index.ts` from this
     zip, copy its contents, paste into the Dashboard's code editor
   - Click **Deploy**
   This is why B2B "Approve" was failing — the function was never
   deployed, so the app's request had nowhere to go ("Failed to fetch").

3. **B2B homepage card**: a second card now sits right below Pathology
   Tests on the home page — "Corporate / B2B Health Checkups" — linking
   to a new `/b2b` description page, which has a **Register your
   company** button going to the existing Request Access form, and a
   **Log in** link for already-approved partners. Only English text is
   filled in for this new copy — the other 5 languages will fall back to
   English until translated (the site already does this automatically
   for any missing key).

4. **Collections merged into the staff panel** — collection-staff work
   is no longer a separate role or a separate portal. It's just a
   **Collections** tab, same as Bookings or Catalog, that Admin turns on
   for any staff member from the **Access** tab. Whoever has it enabled
   sees the same Rapido-style job cards (Accept/Decline, Call, Navigate,
   status progression) right inside their normal panel. The Bookings
   tab's "Collection staff" dropdown now lists anyone with that tab
   enabled, not a special role.

5. **Fixed "Mark sample collected" error** — it was trying to also set
   the main booking `status` column to `sample_collected`, which hit a
   database check constraint. It now only updates `collection_status`;
   the booking's main status is still changed manually from the
   Bookings tab's own dropdown, same as before.

## Update — 2FA stuck-loading fix, B2B homepage box removed, invite-link reliability

1. **2FA "Loading QR code" stuck forever** — this was a real bug: if
   `mfa.enroll()` failed for any reason, the error was captured but
   never shown on screen (only the loading text stayed). Now:
   - The error message displays properly, with a **Retry** link
   - Before every enroll attempt, any leftover *unverified* factor from
     a previous abandoned attempt is cleaned up automatically — this is
     the most common reason a second enroll silently fails
   - If your 2nd admin is still stuck after this update, the Retry link
     will now actually show you the real error text — send me that.

2. **B2B homepage card removed** — the "Corporate / B2B Health
   Checkups" box and its description page are gone from the customer
   site, since your B2B naming is reserved for stores/franchise centers.
   The underlying B2B partner portal itself (Request Access → Admin
   approves → dashboard) is untouched and still reachable directly —
   just not promoted on the homepage anymore.

3. **B2B invite links — root cause + fix**:
   - The `localhost:3000` link you saw was from an old invite email
     sent *before* Site URL was configured in Supabase (it was still on
     the factory default). That specific email's link is dead — no fix
     makes an old email retroactively correct.
   - The blank white page on retry was a second, real bug: Supabase
     marks invite/reset links as **single-use**, and they also expire.
     If a link is reused or already expired, Supabase redirects with
     `#error=...` instead of a session — and since nothing in the app
     recognized that pattern, it silently rendered nothing. Fixed: that
     case now shows a clear "This link has expired" message with a
     plain-English reason, instead of a blank screen.
   - Added a general safety net too: any unrecognized URL in the app
     now redirects home instead of ever rendering blank.
   - **New: Resend invite button** — on the B2B Requests tab, approved
     companies now have a "Resend invite" button (next to their status)
     for exactly this situation, instead of needing a brand new request.
   - **Double-check Site URL has the trailing slash**: it should be
     `https://plasmacare.github.io/Plasma-Care-/` (matching the site's
     actual base path) in both **Site URL** and **Redirect URLs** —
     without the trailing slash, GitHub Pages 301-redirects to add it,
     which usually still works but is one less thing to go wrong.
   - **One real-world gotcha to know about**: some email apps (Gmail's
     link-scanning, corporate security scanners, WhatsApp previews if
     forwarded) can "click" a link automatically before the actual
     person does, burning a single-use invite token before they ever
     see it. If a specific person's invite keeps dying immediately, use
     **Resend invite** and have them open it directly rather than
     through a forwarded/previewed copy.

## Update — Resend invite fixed properly

The previous "Resend invite" attempt reused `inviteUserByEmail`, which
Supabase refuses for an email that's already registered — that's the
"already been registered" error you hit. The account existing (with no
password set yet) is exactly the case Supabase's **password recovery**
flow is for, not invite. Resend now calls `resetPasswordForEmail`
directly from the browser (no edge function involved for resends
anymore) — it works on any existing account regardless of whether they
ever finished setup, and lands them on the same "set your password"
page as before. No Supabase config changes needed for this one — just
redeploy the updated code.

## Update — B2B accounts were being mistaken for staff

Root cause: the auto-provisioning trigger creates a `staff_profiles`
row for *every* new Supabase Auth login, including B2B ones — it can't
tell the difference at the moment it fires. So a B2B account ended up
with both a `b2b_accounts` row (correct) and a stray `staff_profiles`
row (wrong), and the app was checking staff_profiles first, sending
B2B users to the Staff panel instead.

Fixed two ways:
1. The edge function now deletes that stray staff_profiles row right
   after creating the B2B account, so this can't happen again going
   forward.
2. `portalAuth.jsx` also now checks `b2b_accounts` first regardless —
   belt and suspenders, in case a stray row ever slips through again.

**One-time manual cleanup needed** for the two accounts already
affected (created before this fix): in Supabase Table Editor, open
`staff_profiles` and delete the rows for `atifk993366@gmail.com` and
`trial@testing.com` — they don't belong there. Their real accounts in
`b2b_accounts` are untouched by this. After deleting, they'll only show
up in the Access tab if a *new* stray row is ever created (which, with
this fix, it shouldn't be).

## Update — B2B bulk-add rework, admin visibility, per-patient tests

1. **No more line-by-line typing.** Bulk Add is now box-based: fill
   Name/Age/Gender/Phone and the patient is added to the list
   automatically the moment all four are filled — no separate "Add"
   click, no textarea. There's also a CSV upload (export your Excel
   sheet as CSV first) for adding many at once: columns are
   `Name, Age, Gender, Phone, Test/Package name` (the last column is
   optional — matched by name against your catalog; leave it blank and
   pick it per-row afterward).

2. **Test/Package is now per-patient**, not one selection for the whole
   batch — each row in the list gets its own dropdown, since different
   employees in one company often need different checkups. The old
   single "select a package" step at the top is gone.

3. History now shows full detail per submission — tap any past batch to
   expand the complete patient list with each person's assigned
   test/package, not just a summary count.

4. **New: admin can finally see these orders.** B2B Requests tab now
   has two sections — **Access Requests** (the company approval flow,
   as before) and a new **Bulk Orders** tab showing every company's
   submitted batches, expandable to the full patient list, with a
   status dropdown (submitted → processing → completed/cancelled) so
   staff can track fulfillment. This was a genuine gap before — there
   was no admin-side view for these at all, which is why nothing showed
   up.

5. No SQL changes needed for any of the above — `patients` is a
   flexible jsonb column, so it stores the extra per-patient fields
   without a migration.

## Supabase "RAM 57%" — what it actually is

This isn't cache junk like a phone app accumulates — it's the live
memory usage of your project's actual database server, which is a
small shared instance on the free tier. It moves up and down with
real activity: open admin sessions, realtime subscriptions (live
booking notifications, Dev Pulse's live log feed, new-collection-job
alerts), and query load all use it while active, and there's no
"cache files" sitting there to safely delete the way there is on a
phone.

What *does* only grow and never shrink on its own: two logging tables
— `activity_logs` (every uncaught error, site-wide, logged
automatically) and `page_views`. These affect disk/storage more than
RAM, but pruning old rows from them is genuinely safe and doesn't touch
anything business-critical. Added `supabase/maintenance_prune_logs.sql`
for this — run it whenever you like, no schedule required. If 57%
specifically refers to Database RAM (check Dashboard → Database →
Reports to see which metric), pruning these won't move that number much
by itself — that one mostly reflects concurrent connections/activity
rather than accumulated storage.

## Update — 10-point pass (emergency contacts, live location, notifications, maintenance mode, B2B→bookings rework, and fixes)

**Run these new SQL files** (order doesn't matter among these, but run
after everything from before):
- `supabase/b2b_bulk_to_bookings.sql` (rewritten — see below)
- `supabase/staff_directory_visibility.sql`
- `supabase/maintenance_mode.sql`

### 1. Collector emergency contacts
Collections tab now has a third sub-section, **Emergency**, with
tap-to-call Police/Ambulance/Fire/Women's Helpline/112 — static list,
no setup needed.

### 2. B2B request form now asks for store location
**Full address** is now required (textarea), plus a **Share my current
location** button (browser geolocation) that captures lat/lng silently.
Both get copied onto the B2B account when approved, and reused as the
pickup address for every booking their bulk batches create — collection
staff get real Navigate/map links to the company's actual location.

### 3. Admin notification feed
A 🔔 button next to Logout in the staff panel header — live feed of new
bookings (B2B ones labeled), new B2B access requests, sorted by time.
Updates in real time via Supabase Realtime, no refresh needed.

### 4. Maintenance mode
New section at the top of Dev Pulse — three independent toggles
(Customer site / Staff panel / B2B panel) plus an optional message
shown to visitors. **Admin and developer logins are always exempt**, so
turning on "Staff panel" maintenance never locks out the people who'd
need to turn it back off.

### 5. "Assigned staff" is now a dropdown
Lab-visit bookings previously needed a hand-typed name — now it's a
dropdown of active staff, same as the Collection-staff picker for
home-collection bookings. (`staff_directory_visibility.sql` is what
makes this work for non-admin staff too, not just Admin.)

### 6. B2B search-select dropdown fixed
Root cause: the results list was rendering *inside* a horizontally
scrollable table cell, and the table's own overflow clipped it
invisible. Bulk Add's patient list is no longer a table — each patient
is its own card, so the search dropdown has room to actually show.

### 7. B2B bulk orders — reworked, not a separate review queue anymore
This is the biggest structural change this round. Submitting a bulk
batch now creates real `bookings` rows **immediately** (no manual
"Accept" step — the company was already vetted at the access-request
stage). Each one:
- is tagged `booking_type: 'home_collection'` and shows up in the
  regular **Bookings** tab, not a separate list
- gets a **cyan background + "B2B" badge**, so it's visually distinct
  from normal white bookings and dimmed spam ones, at a glance
- automatically gets the company's registered address attached, so
  Navigate/map links work immediately for collection staff
- Preferred date is now **required** at submission (it becomes the
  actual scheduled date) — this also fixes the
  `null value in column "scheduled_date"` error from your own attempt.
- The B2B Requests tab no longer has a Bulk Orders section — nothing
  to review there anymore, by design.
- The company's own History page now shows each patient's **live**
  booking status (pending → confirmed → sample collected → report
  ready), not a static "submitted" label.

*Known limitation, worth knowing:* a batch is created patient-by-patient
in a loop from the browser, not as one atomic database transaction. If
one insert in the middle fails (rare — a dropped connection mid-submit,
say), that batch could end up partially created. Worth an occasional
glance at large batches; a fully atomic version would need a Postgres
function, which I skipped for now given the size of everything else
this round — flag it if you want that hardened further.

### 8. Collector assignment cascades across a B2B batch
Assign a collector on any one booking from a B2B company, and every
*other still-unassigned* booking from that same batch gets the same
collector automatically. Anything already assigned to someone else is
left alone, so admin can still hand-pick different/extra collectors per
booking afterward.

### 9. Bulk Add boxes now stack vertically
Name, Age, Gender, Phone — one full-width box under the next, not a
row. An explicit **+ Add patient** button is there too now (in addition
to the still-in-place auto-add-when-filled behavior), since phone is
now optional and auto-add needed a clear trigger without it.

### 10. Verification pass
Went through the change set end-to-end: confirmed RLS policies match
what each new insert/read actually needs (B2B creating its own
bookings+addresses, staff reading colleague names, admin reading the
notification sources), confirmed every new component's import paths
resolve, and did a full production build with zero errors or warnings
beyond a pre-existing chunk-size notice (from three.js/jspdf, unrelated
to anything changed here). No other broken function found in this pass
beyond what's listed above.
