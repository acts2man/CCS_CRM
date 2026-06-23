# MIGRATION BRIEF — Base44 → Supabase (Calvary Christian School CRM)

## Goal
This React app currently runs on the Base44 SDK for all data and auth.
The backend has been fully rebuilt in **Supabase** (schema, data, auth, RLS
are all done). Your job is to swap the app's data and auth layer from Base44
onto Supabase **without changing the UI, layout, or design**. Keep every
screen, component, and style as-is; only replace how data and auth work.

Work in the ordered steps below. After each step, stop and summarize what
changed so it can be reviewed before continuing.

## Connection
- Supabase URL: `https://dplwelvxynuaiwedzmjn.supabase.co`
- Create `.env.local` with:
  - `VITE_SUPABASE_URL=` (the URL above)
  - `VITE_SUPABASE_ANON_KEY=` (the anon/public key from Supabase → Settings → API)
- Add `@supabase/supabase-js` to dependencies; you will remove `@base44/sdk` at the end.

## Key facts about the new backend
- IDs are UUIDs. All relationships are real foreign keys.
- Row-Level Security is ON. The logged-in user's role + identity controls what
  they can read/write, so the app must authenticate real users (no app-token model).
- A `profiles` table holds each user's `role` ('admin' | 'teacher' | 'parent' | 'student').
- Logins link to records via `auth_user_id`: `teachers.auth_user_id`,
  `students.auth_user_id`, `parent_contacts.auth_user_id`.

## STEP 1 — Client + Auth foundation
1. Create `src/api/supabaseClient.js` exporting a configured Supabase client
   built from the env vars (persistSession + autoRefreshToken on).
2. Replace `src/lib/AuthContext.jsx` with a Supabase version that keeps the
   SAME `useAuth()` shape the app already uses
   (`user`, `isAuthenticated`, `isLoadingAuth`, `isLoadingPublicSettings`,
   `authError`, `appPublicSettings`, `logout`, `navigateToLogin`, `checkAppState`)
   and additionally exposes `profile` and `role`.
   - On load, read the Supabase session; if present, fetch the user's `profiles`
     row and merge it into `user`; set `role`.
   - `logout()` = `supabase.auth.signOut()` then redirect to `/login`.
   - `navigateToLogin()` = redirect to `/login` (skip for paths
     `/time-off-request`, `/time-off-action`).
   - Keep `isLoadingPublicSettings=false` and `appPublicSettings=null` as stubs.
3. Add a simple `/login` page: email + password using
   `supabase.auth.signInWithPassword`. On success, send the user to the
   dashboard for their role.

## STEP 2 — Data access translation
Replace every `base44.entities.*` and `base44.auth.*` call with Supabase.
Supabase returns `{ data, error }` — destructure and handle `error`.

Translations:
- `.list()` → `supabase.from('t').select('*')`
- `.filter({a:1})` → `.select('*').eq('a', 1)`
- `.get(id)` → `.select('*').eq('id', id).single()`
- `.create(o)` → `.insert(o).select().single()`
- `.update(id,o)` → `.update(o).eq('id', id)`
- `.delete(id)` → `.delete().eq('id', id)`
- `base44.auth.me()` → `useAuth()` (`user`/`profile`/`role`)

Entity → table names:
Student→`students`, Teacher→`teachers`, Parent→`parent_contacts`,
ClassSection→`class_assignments`, Course→`courses`, Assignment→`assignments`,
AssignmentGrade→`assignment_grades`, Attendance→`attendance_records`,
StudentClockInOut→`student_clock_in_out`, StudentDocument→`student_documents`,
DocumentSignature→`document_signatures`, Notification→`notifications`,
TimeOffRequest→`time_off_requests`, EmergencyContact→`emergency_contacts`,
User→`profiles`.

Field renames (IMPORTANT — these will break silently if missed):
- students: `grade_level`→`grade`, `date_of_birth`→`birthdate`,
  `photo_url`→`profile_image_url`. The arrays `parent_ids`/`teacher_ids` and
  inline `emergency_contact_*` no longer exist (see relationships below).
- assignments: `title`→`name`, `points_possible`→`max_score`,
  `class_section_id`→`class_id`, `grade_category_id`→`category_id`.
- assignment_grades: `points_earned`/`percentage`→`score`, `graded_date`→`graded_at`.
- everywhere: `created_date`→`created_at`, `updated_date`→`updated_at`.

Relationships (replace the old array fields):
- A student's teacher: `students.homeroom_teacher_id`.
- A student's parents: `parent_contacts` rows where `student_id = <id>`.
- A student's emergency contacts: `emergency_contacts` rows where `student_id = <id>`.
- A class roster: `student_class_enrollments` where `class_id = <section id>`.
- A teacher's students: `students` where `homeroom_teacher_id = <teacher id>`
  plus students enrolled in that teacher's `class_assignments`.

## STEP 3 — Identity & "View As" (rebuild the impersonation hooks)
Replace the existing `useParentId` / `useTeacherId` logic. Each hook resolves
the ID to act on as: URL param first (admin viewing as someone), else the
logged-in user's own linked record.
- `useTeacherId()`: `?teacherId=` → else `teachers` where `auth_user_id = auth.uid()`.
- `useParentId()`: `?parentId=` → else `parent_contacts` where `auth_user_id = auth.uid()`.
- Add `useStudentId()`: `?studentId=` → else `students` where `auth_user_id = auth.uid()`.
Admins can pass the ID in the URL and RLS permits the read (they are admin).
Real users resolve their own ID from their login. Do not treat the URL ID as
the authenticated user.

## STEP 4 — Screen rewire order
Do these in order, one at a time, reporting after each:
1. Layouts + sidebar (use `role` for nav; show an "Exit View" button whenever a
   `?teacherId=`/`?parentId=`/`?studentId=` param is present, clearing it on click).
2. Admin dashboard + the "View As" control (sets the URL param).
3. Teacher dashboard → classes → gradebook → attendance.
4. Parent dashboard → child grades/attendance/documents/billing.
5. Student dashboard.
6. Documents/behavior reports, time-off, chat, notifications.

## STEP 5 — Cleanup
Remove `@base44/sdk`, `src/api/base44Client.js`, and any Base44-only helpers
(app-params token logic, appLogs, axios client). Confirm the app builds and the
login flow works end to end.

## Guardrails
- Do NOT redesign or restyle anything. UI stays identical.
- Do NOT delete data or run anything against the database; the DB is finished.
- After each step, summarize changes and wait for review before the next step.
- If a screen reads a field that no longer exists, use the relationship/rename
  rules above rather than inventing a column.
