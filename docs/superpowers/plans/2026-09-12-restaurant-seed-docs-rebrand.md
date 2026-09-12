# Restaurant Seed & Docs Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand seed data and agent-facing docs so the demo reads as a restaurant staff/scheduling ERP, without changing Prisma models, routes, nav labels, or seed counts.

**Architecture:** Keep `prisma/seed.ts` logic; introduce a `SEED_CATALOG` constant for departments/locations (rooms of one restaurant). Update framing copy and form placeholders only. No schema migrations; no Compose/`erp-boilerplate` rename.

**Tech Stack:** Prisma seed (`tsx`), existing Next.js docs/copy, pnpm scripts.

## Global Constraints

- Domain reshape: rebrand + reseed only (no floor/reservation models)
- Prisma stays `Location` / `Department`; nav stays “Locations” / “Departments”
- Seed world: same counts (3 depts, 3 locations, 10 users) and demo logins
- Locations mean rooms: **Inside**, **Outdoor**, **Event** (not multiple restaurants)
- Demo emails unchanged: `admin@example.com`, `user@example.com`, `manager@example.com`
- Default password unchanged: `password123`
- Manager wiring: admin → Inside, manager → Outdoor, Event unmanaged
- Out of scope: Docker Compose project name, package name, WIP floor-grid persistence
- Prefer migrate reset when validating seed rename (`ensure*` matches by name)

---

## File map

| File | Responsibility |
|------|----------------|
| `prisma/seed.ts` | `SEED_CATALOG` + `main()` uses restaurant names/descriptions |
| `src/features/departments/components/forms/department-form-fields.ts` | Placeholder `Kitchen` |
| `src/features/locations/components/forms/location-form-fields.ts` | Placeholder `Inside` |
| `.docs/components/forms.md` | Example options Kitchen / Front of House |
| `AGENTS.md` | Intro framing as restaurant ERP |
| `README.md` | Project description framing |
| `src/app/layout.tsx` | Metadata title/description |
| `src/app/(app)/page.tsx` | Home heading + blurb |

No new files. `.cursor/rules/*` have no office-name examples to change.

---

### Task 1: Seed catalog + `main()`

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Produces: `SEED_CATALOG` with `departments` and `locations` arrays used only by `main()`
- Consumes: existing `ensureDepartment`, `ensureLocation`, `seedUsers`, manager assignment pattern

- [ ] **Step 1: Add catalog constant after `DEFAULT_PASSWORD`**

Insert after `const DEFAULT_PASSWORD = "password123"`:

```ts
/** Restaurant-flavored org data — rooms of one site, not multiple restaurants. */
const SEED_CATALOG = {
  departments: [
    {
      name: "Kitchen",
      description: "Back-of-house prep and line",
    },
    {
      name: "Front of House",
      description: "Service floor and hosts",
    },
    {
      name: "Management",
      description: "Scheduling and ops",
    },
  ],
  locations: [
    {
      name: "Inside",
      description: "Main indoor dining room",
      minimumStaff: 3,
    },
    {
      name: "Outdoor",
      description: "Patio / terrace seating",
      minimumStaff: 2,
    },
    {
      name: "Event",
      description: "Private dining / events",
      minimumStaff: 1,
    },
  ],
} as const
```

- [ ] **Step 2: Rewrite `main()` org bootstrap to use the catalog**

Replace the department/location/user bootstrap block inside `async function main()` so it looks like:

```ts
async function main() {
  const departments = []
  for (const dept of SEED_CATALOG.departments) {
    departments.push(await ensureDepartment(dept))
  }

  const locations = []
  for (const loc of SEED_CATALOG.locations) {
    locations.push(
      await ensureLocation({
        name: loc.name,
        description: loc.description,
        minimumStaff: loc.minimumStaff,
      }),
    )
  }

  const [inside, outdoor, event] = locations

  const users = await seedUsers({
    departmentIds: departments.map((d) => d.id),
    locationIds: locations.map((l) => l.id),
  })

  const admin = users.find((user) => user.email === "admin@example.com")
  const manager = users.find((user) => user.email === "manager@example.com")

  await prisma.location.update({
    where: { id: inside.id },
    data: { managerId: admin?.id ?? null },
  })
  await prisma.location.update({
    where: { id: outdoor.id },
    data: { managerId: manager?.id ?? null },
  })
  // Leave Event without a manager for the "without manager" demo tab
  void event

  const shifts = await seedShiftsFromLocations()
  const attendance = await seedAttendanceLog()
  const activities = await seedActivityLog()

  // … keep existing console.log block unchanged …
}
```

Do **not** change `seedUsers`, shift presets, attendance, or activity helpers.

- [ ] **Step 3: Verify office strings are gone from seed**

Run:

```bash
rg -n "Engineering|Headquarters|Warehouse|Remote|Main office|Fulfillment|Product engineering" prisma/seed.ts || true
```

Expected: no matches (exit 0 from `|| true` is fine; the important part is empty match list for those strings).

Also confirm catalog names exist:

```bash
rg -n "Kitchen|Front of House|Management|Inside|Outdoor|Event" prisma/seed.ts
```

Expected: matches in `SEED_CATALOG` and comments as appropriate.

- [ ] **Step 4: Optional DB validation (if Postgres available)**

```bash
pnpm db:migrate reset
```

(or project-equivalent reset that re-runs seed). Confirm seed log completes and UI lists show Kitchen / Front of House / Management and Inside / Outdoor / Event. Skip if no DB in this session; note in the commit message / PR that reset is required on existing DBs.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "$(cat <<'EOF'
Rebrand seed departments and rooms for restaurant demo.

EOF
)"
```

---

### Task 2: Form placeholders + forms doc example

**Files:**
- Modify: `src/features/departments/components/forms/department-form-fields.ts`
- Modify: `src/features/locations/components/forms/location-form-fields.ts`
- Modify: `.docs/components/forms.md`

**Interfaces:**
- Consumes: seed names from Task 1 (`Kitchen`, `Inside`)
- Produces: UI/docs examples aligned with seed catalog

- [ ] **Step 1: Update department placeholder**

In `department-form-fields.ts`, change:

```ts
placeholder: "Engineering",
```

to:

```ts
placeholder: "Kitchen",
```

- [ ] **Step 2: Update location placeholder**

In `location-form-fields.ts`, change:

```ts
placeholder: "Headquarters",
```

to:

```ts
placeholder: "Inside",
```

- [ ] **Step 3: Update forms.md illustrative options**

In `.docs/components/forms.md`, replace the example options block:

```ts
    options: [
      { label: "Engineering", value: "engineering" },
      { label: "Design", value: "design" },
    ],
```

with:

```ts
    options: [
      { label: "Kitchen", value: "kitchen" },
      { label: "Front of House", value: "front-of-house" },
    ],
```

- [ ] **Step 4: Verify**

```bash
rg -n "Engineering|Headquarters" src/features/departments src/features/locations .docs/components/forms.md || true
```

Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add \
  src/features/departments/components/forms/department-form-fields.ts \
  src/features/locations/components/forms/location-form-fields.ts \
  .docs/components/forms.md
git commit -m "$(cat <<'EOF'
Align form placeholders and docs examples with restaurant seed.

EOF
)"
```

---

### Task 3: Agent and app framing copy

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(app)/page.tsx`

**Interfaces:**
- Consumes: none
- Produces: restaurant-flavored framing; demos table / routes unchanged

- [ ] **Step 1: Update `AGENTS.md` intro**

Replace:

```md
# Components Playground — agent guide

ERP UI boilerplate. Prefer existing shared systems over one-off patterns. Human docs: `.docs/components/`. Glob-scoped Cursor rules: `.cursor/rules/`.
```

with:

```md
# Restaurant ERP — agent guide

Restaurant staff and scheduling ERP (UI systems playground). Prefer existing shared systems over one-off patterns. Human docs: `.docs/components/`. Glob-scoped Cursor rules: `.cursor/rules/`.
```

Leave the demos table routes and system tables unchanged. Do not edit `CLAUDE.md` beyond its existing `@AGENTS.md` include.

- [ ] **Step 2: Update `README.md` title + opening paragraph**

Replace the title and first paragraph:

```md
# Components Playground

Next.js (App Router) ERP boilerplate / component playground. Shared UI systems live under `src/components/shared`; feature verticals under `src/features`. Auth uses jose cookie sessions + Prisma; middleware requires login for all app routes.
```

with:

```md
# Restaurant ERP

Next.js (App Router) restaurant staff and scheduling ERP — also a component playground for shared UI systems. Shared UI lives under `src/components/shared`; feature verticals under `src/features`. Auth uses jose cookie sessions + Prisma; middleware requires login for all app routes.
```

Do **not** rename Compose project `erp-boilerplate`, Start/Stop ERP apps, or package name in this task.

- [ ] **Step 3: Update layout metadata**

In `src/app/layout.tsx`:

```ts
export const metadata: Metadata = {
  title: "Restaurant ERP",
  description: "Restaurant staff and scheduling ERP",
}
```

- [ ] **Step 4: Update home landing copy**

In `src/app/(app)/page.tsx`, keep the `demos` array as-is. Replace only the hero:

```tsx
          <h1 className="text-[28px] font-semibold leading-9 tracking-tight">
            Restaurant ERP
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Staff, rooms, and scheduling demos for a restaurant. Use them as the
            reference pattern when adding a new feature vertical with the agent.
          </p>
```

- [ ] **Step 5: Verify framing; confirm out-of-scope strings untouched**

```bash
rg -n "ERP UI boilerplate|Components Playground" AGENTS.md README.md src/app/layout.tsx src/app/\(app\)/page.tsx || true
```

Expected: no matches in those four files.

```bash
rg -n "erp-boilerplate" docker-compose.yml package.json README.md | head
```

Expected: Compose/package identity still present (unchanged by design).

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md README.md src/app/layout.tsx src/app/\(app\)/page.tsx
git commit -m "$(cat <<'EOF'
Frame app and agent docs as a restaurant ERP.

EOF
)"
```

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| `SEED_CATALOG` departments Kitchen / FOH / Management | Task 1 |
| Locations Inside / Outdoor / Event | Task 1 |
| Manager wiring admin→Inside, manager→Outdoor, Event unmanaged | Task 1 |
| Same counts / demo logins / password | Task 1 (unchanged helpers) |
| AGENTS / README / layout / home framing | Task 3 |
| Form placeholders Kitchen / Inside | Task 2 |
| `.docs` office examples only | Task 2 (`forms.md`) |
| No Prisma / nav / Compose rename | Global constraints + Task 3 verify |
| Reset note for existing DBs | Task 1 Step 4 |

No placeholders or TBD steps. Types consistent (`SEED_CATALOG` only in Task 1).
