# Restaurant seed & docs rebrand

**Date:** 2026-09-12  
**Status:** Approved for planning  
**Scope:** Minimal rebrand — seed strings + agent/docs framing only

## Goal

Make the existing ERP demo feel like a **restaurant management** tool without changing Prisma models, RBAC, routes, or seed structure/counts.

## Decisions

| Decision | Choice |
|----------|--------|
| Domain reshape depth | Rebrand + reseed only (no new floor/reservation models) |
| Rename depth | Seed + docs/rules framing; Prisma stays `Location` / `Department` |
| Seed world | Minimal string swap; same counts and demo logins |
| Location semantics | Rooms/areas of **one** restaurant, not multiple sites |
| Implementation style | Seed catalog constants + targeted doc/copy pass |
| Infra rename (`erp-boilerplate` Compose) | Out of scope |

## Seed catalog

Keep: 3 departments, 3 locations, 10 users, demo emails (`admin@` / `user@` / `manager@example.com`), default password, shift/attendance/audit generation logic.

| Kind | Name | Description (intent) |
|------|------|----------------------|
| Department | Kitchen | Back-of-house prep and line |
| Department | Front of House | Service floor and hosts |
| Department | Management | Scheduling and ops |
| Location | Inside | Main indoor dining room |
| Location | Outdoor | Patio / terrace seating |
| Location | Event | Private dining / events |

Manager wiring (unchanged):

- `admin@example.com` → manager of **Inside**
- `manager@example.com` → manager of **Outdoor**
- **Event** left without a manager (existing “no manager” demo)

Implementation notes:

- Declare the catalog as constants near the top of `prisma/seed.ts`; `main()` calls `ensureDepartment` / `ensureLocation` from that catalog instead of hard-coded office names.
- `ensure*` matches by **name**, so renaming creates new rows alongside old office names on an existing DB. Prefer a migrate reset (or equivalent wipe) when validating the rebrand, or accept duplicate departments/locations until cleaned up.

## Docs & copy

Update framing only — conventions and architecture stay the same.

**In scope**

- `AGENTS.md` (and `CLAUDE.md` if it only `@`s AGENTS): intro as restaurant staff/scheduling ERP; demos table routes unchanged
- `README.md`: project description
- `src/app/layout.tsx` metadata description
- Home landing blurb (`src/app/(app)/page.tsx`)
- Form placeholders: departments `Engineering` → `Kitchen`; locations `Headquarters` → `Inside`
- `.docs/components/*` and `.cursor/rules/*`: only office-flavored examples (e.g. forms.md “Engineering”); do not rewrite system guides

**Out of scope**

- Prisma schema / migrations
- Nav labels (“Departments”, “Locations”) and feature folder names
- Docker Compose project name / package `name` / JWT demo secret
- WIP `features/restaurant` floor-grid persistence
- Changing seed counts, shift presets, or demo login credentials

## Success criteria

1. Fresh seed produces Kitchen / Front of House / Management and Inside / Outdoor / Event.
2. Existing demos and login flow still work with the same demo accounts.
3. Agent-facing docs describe a restaurant ERP without changing architecture rules.
4. No Prisma model renames or Compose project renames.

## Non-goals

Floor layouts, tables, reservations, menu, or hard-renaming `Location` → room in the schema.
