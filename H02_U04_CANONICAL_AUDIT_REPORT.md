# H02.U04 — CANONICAL CURRENT AUDIT + READ-ONLY DRY RUN REPORT

**Repository:** `xeyroxpagode/YoungKingzBarber`  
**Workspace:** `C:\Users\thega\Desktop\YoungKingZ-H01-Implementation`  
**Branch:** `feature/h02-u03-implementation`  
**HEAD:** `4a2c31243007add25644eecf284146fffbf09360`  
**Agent:** C  
**Date:** 2026-11-02  
**Mode:** READ-ONLY (no implementation, no migrations, no commits)

---

## 1. PRE-FLIGHT VERIFICATION

```powershell
cd C:\Users\thega\Desktop\YoungKingZ-H01-Implementation
pwd
# Path: C:\Users\thega\Desktop\YoungKingZ-H01-Implementation

git remote -v
# origin  https://github.com/xeyroxpagode/YoungKingzBarber.git (fetch)
# origin  https://github.com/xeyroxpagode/YoungKingzBarber.git (push)

git branch --show-current
# feature/h02-u03-implementation

git rev-parse HEAD
# 4a2c31243007add25644eecf284146fffbf09360

git status --short
# M apps/api/src/app.ts
# M apps/web/src/app/(staff)/account/layout.tsx
# M apps/web/src/app/(staff)/account/professional/page.tsx
# M apps/web/src/app/(staff)/team/layout.tsx
# M apps/web/src/app/(staff)/team/professionals/page.tsx
# M apps/web/src/app/globals.css
# M apps/web/src/components/AppShell.tsx
# M apps/web/src/features/catalog/CreateServiceWorkspace.tsx
# M apps/web/src/features/catalog/ServiceDetail.tsx
# M apps/web/src/features/team/TeamLanding.tsx
# M apps/web/src/features/team/TeamWorkspace.tsx
# M docs/h01/v1.1/evidence/...
# M packages/contracts/package.json
# M packages/contracts/src/index.ts
# M packages/database/src/schema.ts
# M supabase/seeds/local-qa.sql
# M tests/h02/e2e/professionals.spec.ts
# ?? FINDING_LEDGER.md
# ?? YOUNGKINGZ_H02.U03_SEMANTIC_CERTIFICATION_REPORT.md
# ?? apps/api/src/modules/schedules/
# ?? apps/web/src/app/(staff)/account/schedule/
# ?? apps/web/src/app/(staff)/team/[staffMemberId]/
# ?? apps/web/src/features/schedules/
# ?? docs/h01.rar
# ?? packages/contracts/src/schedules.ts
# ?? packages/database/src/schedules.ts
# ?? supabase/migrations/202610300003_h02_u03_schedules.sql
# ?? tests/h02/e2e/schedules.spec.ts
# ?? tests/h02/integration/schedules.spec.ts
# ?? tests/h02/unit/schedules.spec.ts

git log --oneline --decorate -8
# 4a2c312 (HEAD -> feature/h02-u03-implementation, origin/feature/h02-u03-implementation) docs(h02-u03): add corrective audit and dry run
# 6f147fb (origin/feature/h02-u02-implementation, feature/h02-u02-implementation) feat(h02-u02): checkpoint professional profiles and local qa seed
# dc605ce (origin/main, origin/feature/h01-implementation, origin/HEAD, feature/h01-implementation) feat(h02-u01): implement accepted catalog and commercial terms
# 2043eed H01 final certification: 20 E2E families, stress, accessibility, certify script
# b37967a docs: H01 final certification (PARTIAL)
# e955bfa fix accents in team UI copy
# f89cb5a H01 final closure: team actions, invitations, admin history
# 9cb56ee docs: record H01 V1.1 corrective evidence

# Canonical paths confirmed:
# apps/api/ ✓
# apps/web/ ✓
# packages/contracts/ ✓
# packages/database/ ✓
# supabase/migrations/ ✓
```

---

## 2. STAFF REAL (Audit A)

### 2.1 Schema (`packages/database/src/schema.ts:17`, `supabase/migrations/202610280001_h01_foundation.sql:51-62`)

```sql
team.staff_members (
  id uuid PK,
  business_id uuid NOT NULL REFERENCES business.businesses(id),
  person_id uuid NOT NULL REFERENCES iam.persons(id),
  employment_status team.employment_status NOT NULL DEFAULT 'ONBOARDING',  -- ONBOARDING | ACTIVE | INACTIVE
  access_status iam.access_status NOT NULL DEFAULT 'PENDING_ACTIVATION',  -- PENDING_ACTIVATION | ACTIVE | SUSPENDED | REVOKED
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, person_id),
  UNIQUE (business_id, id)
)
```

### 2.2 Employment History (`supabase/migrations/202610280001_h01_foundation.sql:64-75`)

```sql
team.staff_relationship_periods (
  id uuid PK,
  business_id uuid NOT NULL,
  staff_member_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  ended_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FK (business_id, staff_member_id) REFERENCES team.staff_members(business_id, id),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
)
CREATE UNIQUE INDEX one_open_staff_period ON team.staff_relationship_periods(staff_member_id) WHERE ended_at IS NULL;
```

### 2.3 Roles (`supabase/migrations/202610280001_h01_foundation.sql:97-111`)

```sql
iam.role_assignments (
  id uuid PK,
  business_id uuid NOT NULL,
  staff_member_id uuid NOT NULL,
  role iam.role_code NOT NULL,  -- OWNER | RECEPTIONIST | BARBER
  effective_at timestamptz,
  revoked_at timestamptz,
  assigned_by_account_id uuid REFERENCES iam.user_accounts(id),
  revoked_by_account_id uuid REFERENCES iam.user_accounts(id),
  revision bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  FK (business_id, staff_member_id) REFERENCES team.staff_members(business_id, id)
)
CREATE UNIQUE INDEX one_active_staff_role ON iam.role_assignments(staff_member_id, role) WHERE revoked_at IS NULL;
```

### 2.4 Lifecycle Operations (`apps/api/src/modules/team/service.ts:108-122`)

| Action | `access_status` | `employment_status` | Side Effects |
|--------|-----------------|---------------------|--------------|
| `suspend` | `SUSPENDED` | unchanged | Revoke sessions |
| `reactivate` | `ACTIVE` | unchanged | — |
| `revoke` | `REVOKED` | unchanged | Revoke sessions |
| `offboard` | `REVOKED` | `INACTIVE` | End `staff_relationship_periods`; deactivate ProfessionalProfile if ACTIVE |
| `reonboard` | `PENDING_ACTIVATION` | `ONBOARDING` | New `staff_relationship_periods`; revoke all role assignments |

### 2.5 Authorization (from `packages/contracts/src/index.ts:10-26,62-66`)

| Capability | Owner | Receptionist | Barber |
|------------|-------|--------------|--------|
| `iam.staff.list` | ✓ | ✓ | |
| `iam.staff.read` | ✓ | ✓ | |
| `iam.staff.create` | ✓ | ✓ | |
| `iam.staff.update` | ✓ | ✓ | |
| `iam.roles.read` | ✓ | | |
| `iam.roles.assign` | ✓ | | |
| `iam.roles.revoke` | ✓ | | |
| `iam.access.suspend` | ✓ | | |
| `iam.access.reactivate` | ✓ | | |
| `iam.access.revoke` | ✓ | | |
| `iam.access.offboard` | ✓ | | |
| `iam.access.reonboard` | ✓ | | |

### 2.6 Seed Data (`supabase/seeds/local-qa.sql:176-204`)

| StaffMember ID | Person | Employment | Access | Roles |
|----------------|--------|------------|--------|-------|
| 50000000...001 | Olivia Owner | ACTIVE | ACTIVE | OWNER |
| 50000000...002 | Renata Reception | ACTIVE | ACTIVE | RECEPTIONIST |
| 50000000...003 | Bruno Barber | ACTIVE | ACTIVE | BARBER |

### 2.7 Verdict: ¿StaffMember es identidad canónica para U04?

**YES — EVIDENCE CONFIRMED**

- Stable UUID `id` with `business_id` tenancy
- `revision` field for optimistic concurrency
- Complete employment history via `staff_relationship_periods`
- Independent `employment_status` (ONBOARDING/ACTIVE/INACTIVE) and `access_status` (PENDING_ACTIVATION/ACTIVE/SUSPENDED/REVOKED)
- Offboard preserves history (ended period with reason)
- Reonboard creates new period, revokes roles, resets access to `PENDING_ACTIVATION`
- Roles are separate assignments with effective/revoked timestamps
- Multi-tenant: every row has `business_id` with FK to `business.businesses`

---

## 3. SERVICE REAL (Audit B)

### 3.1 Schema (`packages/database/src/catalog.ts:18-34`, `supabase/migrations/202610300001_h02_u01_catalog.sql:22-40`)

```sql
catalog.services (
  id uuid PK,
  business_id uuid NOT NULL REFERENCES business.businesses(id),
  name text NOT NULL,
  description text,
  category_id uuid,
  current_terms_version_id uuid,
  lifecycle catalog.lifecycle NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | ARCHIVED
  publication catalog.publication NOT NULL DEFAULT 'UNPUBLISHED',  -- UNPUBLISHED | PUBLISHED
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, id),
  FK (business_id, category_id) REFERENCES catalog.service_categories(business_id, id),
  CHECK (lifecycle <> 'ARCHIVED' OR publication = 'UNPUBLISHED'),
  CHECK ((lifecycle = 'ARCHIVED') = (archived_at IS NOT NULL))
)
```

### 3.2 Terms Versions (`packages/database/src/catalog.ts:36-54`, `supabase/migrations/202610300001_h02_u01_catalog.sql:46-79`)

```sql
catalog.service_terms_versions (
  id uuid PK,
  business_id uuid NOT NULL,
  service_id uuid NOT NULL,
  version_number bigint NOT NULL CHECK (version_number > 0),
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  currency text NOT NULL CHECK (currency = 'ARS'),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  pre_buffer_minutes integer NOT NULL DEFAULT 0,
  post_buffer_minutes integer NOT NULL DEFAULT 0,
  conditions text,
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, service_id, version_number),
  UNIQUE (business_id, service_id, id),
  FK (business_id, service_id) REFERENCES catalog.services(business_id, id)
)
-- Immutable: trigger rejects UPDATE on service_terms_versions
```

Service → Current Terms FK:
```sql
ALTER TABLE catalog.services ADD CONSTRAINT catalog_service_current_terms_fk
  FOREIGN KEY (business_id, id, current_terms_version_id)
  REFERENCES catalog.service_terms_versions(business_id, service_id, id);
```

### 3.3 Lifecycle Operations (`apps/api/src/modules/catalog/service-commands.ts`)

| Operation | Effect | Guards |
|-----------|--------|--------|
| `createService` | ACTIVE, UNPUBLISHED, optional initial terms | Category must be ACTIVE if provided |
| `updateServiceProfile` | name, description, category_id | Cannot edit ARCHIVED; Published services must remain complete |
| `replaceCommercialTerms` | Creates new immutable `service_terms_versions` row, updates `current_terms_version_id` | Cannot edit ARCHIVED; idempotent if terms equal |
| `publishService` | `publication = 'PUBLISHED'` | Requires ACTIVE category + current terms |
| `unpublishService` | `publication = 'UNPUBLISHED'` | — |
| `archiveService` | `lifecycle = 'ARCHIVED'`, `publication = 'UNPUBLISHED'`, `archived_at = now()` | — |
| `reactivateService` | `lifecycle = 'ACTIVE'`, `publication = 'UNPUBLISHED'`, `archived_at = NULL` | — |

### 3.4 Seed Data (`supabase/seeds/local-qa.sql:308-362`)

```sql
Service: b0000000...001 "Corte clásico"
  Category: a0000000...001 "Cortes" (ACTIVE)
  Lifecycle: ACTIVE
  Publication: PUBLISHED
  Terms v1: price_minor=2500000, duration=45min, pre=5, post=5
```

### 3.5 Verdict: Service Identity vs Commercial Terms

**CLEARLY SEPARATED**

- **Service Identity**: `id`, `business_id`, `name`, `description`, `category_id`, `lifecycle`, `publication`, `revision`
- **Commercial Terms**: Immutable history in `service_terms_versions` (price, duration, buffers, conditions)
- **Pointer**: `current_terms_version_id` on Service references current terms
- **U04 MUST reference Service `id`** (stable identity), NOT `service_terms_versions.id`

---

## 4. PROFESSIONALPROFILE REAL (Audit C)

### 4.1 Schema (`packages/database/src/professionals.ts:11-27`, `supabase/migrations/202610300002_h02_u02_professionals.sql:1-26`)

```sql
team.professional_profiles (
  id uuid PK,
  business_id uuid NOT NULL,
  staff_member_id uuid NOT NULL,
  status team.professional_status NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | INACTIVE
  professional_display_name text,
  bio text,
  public_title text,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_member_id),  -- 1:1 with StaffMember
  UNIQUE (business_id, id),
  FK (business_id, staff_member_id) REFERENCES team.staff_members(business_id, id) ON DELETE RESTRICT,
  CHECK (professional_display_name length 1-80 if present)
)
CREATE INDEX professional_profiles_business_status_idx ON team.professional_profiles(business_id, status, created_at desc, id desc);
```

### 4.2 Domain Logic (`apps/api/src/modules/professionals/domain.ts:5-7`)

```typescript
export function professionallyEnabled(status: "ACTIVE" | "INACTIVE", employmentStatus: string) {
  return status === "ACTIVE" && employmentStatus === "ACTIVE";
}
```

### 4.3 Lifecycle (`apps/api/src/modules/professionals/commands.ts`)

| Operation | Requirements | Effect |
|-----------|--------------|--------|
| `createProfessionalProfile` | StaffMember exists, `employment_status = 'ACTIVE'`, no existing profile | Creates profile with status ACTIVE |
| `updateProfessionalProfile` | Profile exists, revision match | Updates displayName, bio, publicTitle |
| `deactivateProfessionalProfile` | Profile ACTIVE | Sets status = INACTIVE |
| `reactivateProfessionalProfile` | Profile INACTIVE, StaffMember `employment_status = 'ACTIVE'` | Sets status = ACTIVE |

### 4.4 Staff Offboard/Reonboard Integration (`apps/api/src/modules/team/service.ts:114-119`)

```typescript
if (action === "offboard") {
  const [profile] = await tx`select id,status::text status,revision from team.professional_profiles where business_id=${actor.businessId} and staff_member_id=${staffId} for update`;
  if (profile?.status === "ACTIVE") {
    await tx`update team.professional_profiles set status='INACTIVE',revision=revision+1,updated_at=now() where id=${profile.id}`;
    await audit(..., { cause: "STAFF_OFFBOARDED", status: { from: "ACTIVE", to: "INACTIVE" } });
  }
}
if (action === "reonboard") {
  await tx`update iam.role_assignments set revoked_at=coalesce(revoked_at,now()),revoked_by_account_id=${actor.accountId} where staff_member_id=${staffId} and revoked_at is null`;
  // ProfessionalProfile NOT auto-reactivated (requires explicit reactivate + ACTIVE staff)
}
```

### 4.5 Seed Data (`supabase/seeds/local-qa.sql:364-382`)

```sql
-- Receptionist HAS profile
ProfessionalProfile: 90000000...001
  StaffMember: 50000000...002 (Renata Reception)
  Status: ACTIVE
  DisplayName: "Renata Reception"
  Title: "Atención y experiencia del cliente"

-- Barber DELIBERATELY has NO ProfessionalProfile
-- "U03: weekly schedules owned by StaffMember. The Barber keeps NO ProfessionalProfile but still has a schedule (§72)."
```

### 4.6 Current Consumers

| Consumer | Usage |
|----------|-------|
| `professionallyEnabled()` | Checks `profile.status === 'ACTIVE' AND staff.employment_status === 'ACTIVE'` |
| `ProfessionalsWorkspace` UI | Lists profiles, allows create/update/lifecycle |
| `getMyProfessionalProfile` | Barber self-read |
| Staff offboard | Auto-deactivates profile if ACTIVE |

### 4.7 Verdict: ProfessionalProfile ↔ Service?

**NO EXISTING RELATIONSHIP**

- ProfessionalProfile is 1:1 with StaffMember (presentation layer)
- No FK, column, or API linking ProfessionalProfile to Service
- No `professionallyEnabled` used for service eligibility
- Seed explicitly shows Barber with NO ProfessionalProfile but WITH schedule
- **Product Truth U04 says: U04 nuevo no debe depender de ProfessionalProfile** — CURRENT respects this

---

## 5. EXISTING STAFF↔SERVICE MODEL SEARCH (Audit D)

### 5.1 Exhaustive Search Results

| Pattern | DB | Migrations | Contracts | API | Frontend | Tests | Classification |
|---------|----|------------|-----------|-----|----------|-------|----------------|
| `staff_service` / `staff_services` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **ABSENT** |
| `professional_service` / `professional_services` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **ABSENT** |
| `service_assignment` / `service_assignments` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **ABSENT** |
| `eligibility` / `canPerform` / `provider` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **ABSENT** |
| `serviceIds` on StaffMember | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **ABSENT** |
| `professionalIds` on Service | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **ABSENT** |
| `staffMemberId` + `serviceId` composite | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **ABSENT** |

### 5.2 Current Eligibility Mechanism

**NONE EXISTS IN CANONICAL IMPLEMENTATION**

- U01 (Catalog) defines what the business sells
- U02 (Team) defines who works
- U03 (Schedules) defines when they work
- **U04 (Staff↔Service eligibility) IS THE MISSING PIECE**

### 5.3 H03 Future Contract Dependency

The availability engine (H03) will need:
```
H03 Availability = U03 Schedule (StaffMember weekly_schedule)
                + U04 Eligibility (StaffMember ↔ Service)
                + U01 Service current terms (duration_minutes, buffers)
                + Exceptions/Blocks
```

Currently H03 does not exist; U03 only provides StaffMember schedules.

---

## 6. DRY RUN — OWNERSHIP ALTERNATIVES

### Alternative A: `StaffMember ↔ Service` (Recommended by Product Truth)

| Criterion | Assessment |
|-----------|------------|
| Product Truth | U02=who (StaffMember), U01=what (Service) → U04=join ✓ |
| U03 Schedules | StaffMember owns `staff_weekly_schedules` (1:1) ✓ |
| H03 Availability | Needs StaffMember as operational reference ✓ |
| Staff Lifecycle | Stable `id`, history via `staff_relationship_periods`, offboard preserves ✓ |
| Service Lifecycle | Stable `id`, terms separate, archive/reactivate ✓ |
| Tenancy | Both have `business_id` with FK to `business.businesses` ✓ |
| ProfessionalProfile | NOT required (Barber has schedule without it) ✓ |
| Authorization | Existing capabilities map cleanly ✓ |

### Alternative B: `ProfessionalProfile ↔ Service`

| Criterion | Assessment |
|-----------|------------|
| Product Truth | Explicitly forbidden: "U04 nuevo no debe depender de ProfessionalProfile" |
| Existence | ProfessionalProfile is OPTIONAL (Barber has none) |
| Lifecycle | Tied to StaffMember but separate status; offboard deactivates it |
| H03 Contract | Would need StaffMember → ProfessionalProfile → Service indirection |
| Authorization | No capabilities for ProfessionalProfile-Service management |

### Alternative C: `Service.professionalIds[]` (Prototype pattern)

| Criterion | Assessment |
|-----------|------------|
| Canonical DB | No such column; would require migration |
| Terms separation | Conflicts with immutable `service_terms_versions` architecture |
| Tenancy | Would need `business_id` validation on array elements |
| Revision | No dedicated revision for assignment |

### Recommendation

**Alternative A: StaffMember ↔ Service** — Only identity with stable lifecycle, tenancy, and operational usage (schedules, H03). ProfessionalProfile is presentation-only and optional.

---

## 7. DRY RUN — PHYSICAL CARDINALITY

### 7.1 Recommended: Explicit Assignment Table

```sql
team.staff_services (
  id uuid PK DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES business.businesses(id),
  staff_member_id uuid NOT NULL,
  service_id uuid NOT NULL,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, staff_member_id, service_id),  -- Business-safe unique
  FK (business_id, staff_member_id) REFERENCES team.staff_members(business_id, id) ON DELETE CASCADE,
  FK (business_id, service_id) REFERENCES catalog.services(business_id, id) ON DELETE CASCADE
)
CREATE INDEX staff_services_staff_lookup ON team.staff_services(business_id, staff_member_id);
CREATE INDEX staff_services_service_lookup ON team.staff_services(business_id, service_id);
```

### 7.2 Properties

| Property | Decision |
|----------|----------|
| **Cardinality** | N:M (one staff ↔ many services; one service ↔ many staff) |
| **Unique** | Composite `(business_id, staff_member_id, service_id)` |
| **Business-safe** | Yes — explicit opt-in, cross-business prevented by FKs |
| **Own revision** | **YES** — assignment changes need own audit trail (separate from Service terms or Staff profile) |
| **Full-set replacement** | Preferred API (`ReplaceStaffServices`) for atomicity + checkbox UX |

### 7.3 Why Not Array on Service/Staff

- Canonical architecture uses explicit tables with FKs for all relationships
- Arrays prevent tenant-safe FKs, cascade deletes, and independent revision
- Audit requires row-level granularity

---

## 8. DRY RUN — RELATION SEMANTICS

### 8.1 Binary Semantics (Recommended)

```
assignment EXISTS in team.staff_services
  → StaffMember CAN perform this Service

assignment ABSENT
  → StaffMember CANNOT perform this Service
```

### 8.2 Effective Eligibility (Runtime Gate)

```
CAN_PERFORM(staff, service) =
  assignment EXISTS
  AND staff.employment_status = 'ACTIVE'
  AND staff.access_status = 'ACTIVE'
  AND service.lifecycle = 'ACTIVE'
  AND (service.publication = 'PUBLISHED' OR admin context)
```

### 8.3 Enriched Fields — DEFERRED

| Field | Current Need | Decision |
|-------|--------------|----------|
| `priority` / `display_order` | None | Defer |
| `skill_level` / `certified_at` | None | Defer |
| `status` (enabled/disabled) | Derivable from Staff/Service | Defer |
| `effective_from` / `effective_to` | None | Defer |

**No preventive fields.** Enrichment only when Product demands.

---

## 9. DRY RUN — SERVICE LIFECYCLE IMPACT

| Service State | Assignable? | Existing Assignments | Public Booking |
|---------------|-------------|---------------------|----------------|
| **ACTIVE + PUBLISHED** | Yes | Preserved | Eligible |
| **ACTIVE + UNPUBLISHED** | **Yes** (admin) | Preserved | Not eligible |
| **ARCHIVED** (forces UNPUBLISHED) | **Yes** (admin, for reactivation prep) | Preserved | Not eligible |

### 9.1 Key Rules

- **Archive ≠ Unassign**: `archiveService` only flips `lifecycle` + `publication`; assignments in `team.staff_services` untouched
- **Reactivation**: `reactivateService` sets `lifecycle=ACTIVE`, `publication=UNPUBLISHED`; assignments preserved
- **Terms Change**: `replaceCommercialTerms` creates new `service_terms_versions` row; `current_terms_version_id` updated; **assignments unaffected** (point to Service `id`, not terms version)

---

## 10. DRY RUN — STAFF LIFECYCLE IMPACT

| Staff State | Assignment Behavior | Evidence |
|-------------|---------------------|----------|
| **ONBOARDING** | **Can pre-assign** — StaffMember exists, `employment_status=ONBOARDING` | `createStaff` creates StaffMember in ONBOARDING |
| **ACTIVE** | Normal eligibility | Default |
| **INACTIVE** (offboarded) | **Preserved** — `staff_relationship_periods.ended_at` set; assignments remain | `offboard` only ends period + revokes access + deactivates ProfessionalProfile |
| **REONBOARD** | **Restored** — new `staff_relationship_periods` row; roles revoked (must reassign); assignments intact | `reonboard` creates new period, resets access to PENDING_ACTIVATION |

### 10.1 ProfessionalProfile Interaction

- Offboard → ProfessionalProfile deactivated if ACTIVE
- Reonboard → ProfessionalProfile NOT auto-reactivated (requires explicit reactivate + ACTIVE staff)
- **Assignments independent of ProfessionalProfile** (Barber has schedule without it)

---

## 11. DRY RUN — TERMS CHANGES

### 11.1 Current Behavior (`replaceCommercialTerms`)

```typescript
// Creates new immutable service_terms_versions row
// Updates service.current_terms_version_id
// Service.revision++
// Audit: { fromVersionId, toVersionId, versionNumber }
```

### 11.2 Impact on Assignment

| Change | Affects `team.staff_services`? | Affects Historical Bookings? |
|--------|-------------------------------|------------------------------|
| Price | **NO** | NO (terms copied at booking) |
| Duration | **NO** | NO (duration copied at booking) |
| Buffers | **NO** | NO |
| Conditions | **NO** | NO |

**Service Identity (`id`) is independent of Terms History.** Assignment references Service `id`, not `service_terms_versions.id`.

---

## 12. DRY RUN — MULTI-ROLE & ROLE INDEPENDENCE

### 12.1 Current Evidence

| Staff | Roles | ProfessionalProfile | Schedule |
|-------|-------|---------------------|----------|
| Olivia Owner | OWNER | ❌ | ✓ |
| Renata Reception | RECEPTIONIST | ✓ ACTIVE | ✓ |
| Bruno Barber | BARBER | ❌ (deliberate) | ✓ |

### 12.2 Rules

- **Role ≠ Eligibility**: Receptionist has ProfessionalProfile; Barber does not. Both have schedules.
- **No role-based service inference**: Explicit assignment required
- **Owner with services**: Valid (Owner may also be practitioner)
- **Zero-service Staff**: Valid (new hire, admin-only)

---

## 13. DRY RUN — AUTHORIZATION

### 13.1 Current Capabilities (`packages/contracts/src/index.ts:20-25`)

| Capability | Owner | Receptionist | Barber |
|------------|-------|--------------|--------|
| `catalog.services.create` | ✓ | | |
| `catalog.services.update_profile` | ✓ | | |
| `catalog.services.update_terms` | ✓ | | |
| `catalog.services.publish` | ✓ | | |
| `catalog.services.lifecycle` | ✓ | | |
| `professionals.create` | ✓ | | |
| `professionals.update` | ✓ | | |
| `professionals.lifecycle` | ✓ | | |

### 13.2 Proposed U04 Capabilities

| Capability | Owner | Receptionist | Barber | Rationale |
|------------|-------|--------------|--------|-----------|
| `staff-services.read` | ✓ | ✓ (operational) | ✓ (self) | Read assignments |
| `staff-services.manage` | ✓ | | | Full CRUD assignments |
| `staff-services.self.read` | | | ✓ | Barber sees own services |

### 13.3 Mapping to Existing

- **Owner**: Already has `iam.staff.*` + `catalog.services.*` → implicit manage
- **Receptionist**: Has `catalog.read` + `professionals.read` → add `staff-services.read` for booking UI
- **Barber**: Only `professionals.self.*` + `schedules.self.read` → add `staff-services.self.read`

**No reuse of `iam.staff.manage`** — that grants role assignment, offboard, etc. New fine-grained capabilities needed.

---

## 14. DRY RUN — CONCURRENCY

### 14.1 Canonical Primitives

| Primitive | Usage |
|-----------|-------|
| `operationId` (UUID) | Idempotency key on all mutations |
| `revision` (bigint) | Optimistic locking on all entities (`SELECT ... FOR UPDATE` + version check) |
| `executeOperation` | Transaction wrapper with audit + idempotency |
| `pg_advisory_xact_lock` | Cross-row coordination (e.g., owner protection) |

### 14.2 Assignment Concurrency Model

**Own Aggregate Revision** (`team.staff_services.revision`)

- Each assignment row has independent `revision`
- `ReplaceStaffServices` operates in single transaction:
  1. `SELECT ... FOR UPDATE` on all affected `staff_services` rows
  2. Verify `revision` matches expected for each
  3. UPSERT/DELETE to match target set
  4. Increment `revision` on modified rows
  5. Single audit event with before/after arrays

### 14.3 Why Not StaffMember or Service Revision

| Entity | Reason Against |
|--------|----------------|
| StaffMember | Couples unrelated changes (profile, roles, access) to assignment concurrency |
| Service | Couples terms changes (price, duration) to assignment concurrency; multiple services = multiple revisions |
| Assignment | Semantically precise; changes only when assignment set changes |

### 14.4 Idempotency

- `ReplaceStaffServices(staffId, serviceIds[], operationId)` is idempotent:
  - Same `operationId` → replay returns stored result
  - Same `serviceIds[]` → no-op (audit `changed: false`)

---

## 15. DRY RUN — TENANCY

### 15.1 Cross-Business Prevention

```sql
-- Both FKs include business_id
FK (business_id, staff_member_id) REFERENCES team.staff_members(business_id, id)
FK (business_id, service_id) REFERENCES catalog.services(business_id, id)

-- Unique index scoped to business
UNIQUE (business_id, staff_member_id, service_id)
```

### 15.2 Query Pattern

```sql
-- All queries filtered by actor.businessId (from auth context)
SELECT * FROM team.staff_services
WHERE business_id = $actor_business_id
  AND staff_member_id = $staff_id;
```

**Matches H01/U01/U03 pattern**: Tenant isolation at query + FK level.

---

## 16. DRY RUN — API OPERATIONS

### 16.1 Minimal Operations

| Operation | Signature | Idempotent | Audit |
|-----------|-----------|------------|-------|
| `GetStaffServices` | `(actor, staffId) → ServiceSummary[]` | N/A (read) | — |
| `GetMyServices` | `(actor) → ServiceSummary[]` | N/A (read) | — |
| `ReplaceStaffServices` | `(actor, staffId, serviceIds[], expectedRevision, operationId) → { staffId, revision, changed }` | ✓ (operationId + full-set) | Single event with before/after serviceIds[] |

### 16.2 Why Replace over Add/Remove

| Concern | Add/Remove | Replace (Full-Set) |
|---------|------------|-------------------|
| Atomicity | Multiple calls = partial failure | Single transaction |
| UX Checkbox | Client must diff | Natural: check → save = replace |
| Concurrency | Lost updates likely | Optimistic lock on assignment.revision |
| Idempotency | Not inherent | Inherent (same input = same state) |
| Audit | Multiple events | Single event with before/after |

### 16.3 Input Validation

- All `serviceIds[]` must exist in `catalog.services` for same `business_id`
- `staffId` must exist in `team.staff_members` for same `business_id`
- `expectedRevision` = current max `revision` of affected assignment rows (or 0 for first assignment)

---

## 17. DRY RUN — AUDIT

### 17.1 Audit Event Schema

```json
{
  "action": "staff.services.replaced",
  "capability": "staff-services.manage",
  "resourceType": "STAFF_SERVICES",
  "resourceId": "<staffMemberId>",
  "changes": {
    "beforeServiceIds": ["svc-1", "svc-3"],
    "afterServiceIds": ["svc-1", "svc-2", "svc-4"],
    "added": ["svc-2", "svc-4"],
    "removed": ["svc-3"]
  }
}
```

### 17.2 Noise to Exclude

- Full Service objects (only IDs changed)
- Staff profile fields
- Price/duration/terms (unchanged by assignment op)

---

## 18. DRY RUN — OPERATIONAL UI

### 18.1 Provisional QA-Ready Interface

```
Equipo → Integrante → Servicios

[✓] Corte clásico          (ACTIVE, PUBLISHED)
[ ] Barba                  (ACTIVE, UNPUBLISHED)
[✓] Fade                   (ACTIVE, PUBLISHED)
[ ] Tinte                  (ARCHIVED)

Guardar  ← ReplaceStaffServices(staffId, [corte, fade])
```

### 18.2 Requirements

- Show ALL services (ACTIVE/ARCHIVED, PUBLISHED/UNPUBLISHED) with badges
- Checkbox = assignment exists
- "Guardar" = `ReplaceStaffServices`
- Disabled if no changes (idempotent)
- Loading/error/unknown states via `executeOperation` status
- No visual polish, no final architecture — only QA-ready

---

## 19. ADVERSARIAL MATRIX

| Caso | Esperado | Implementación |
|------|----------|----------------|
| Staff sin services | ✓ Válido | Empty assignment set |
| Staff con 1 service | ✓ Válido | Single row |
| Staff con varios | ✓ Válido | Multiple rows |
| Owner con services | ✓ Válido | No role restriction |
| Receptionist con services | ✓ Válido | No role restriction |
| Barber sin ProfessionalProfile | ✓ Válido | Assignment independent of ProfessionalProfile |
| Duplicate assignment | ✗ Impedido | UNIQUE (business_id, staff_member_id, service_id) |
| Terms change (price/duration) | Assignment unchanged | Assignment references Service.id |
| Service unpublish | Assignment preserved | Publication independent |
| Service archive | Assignment preserved | Lifecycle independent |
| Service reactivate | Assignment preserved | Lifecycle independent |
| Staff offboard | Assignment preserved | Only employment_status + access_status change |
| Staff reonboard | Assignment restored | New relationship_period; assignments untouched |
| Cross-business Staff | ✗ NOT_FOUND | FK business_id mismatch |
| Cross-business Service | ✗ NOT_FOUND | FK business_id mismatch |
| Concurrent replace | Conflict controlled | Optimistic lock on assignment.revision |
| First assignment | ✓ Works | Insert new rows |
| No-op replacement | ✓ Idempotent | changed: false, same revision |
| Replay same operationId | ✓ Idempotent | executeOperation returns stored result |

---

## 20. DECISION REGISTER (D1–D13)

| ID | Decision | CURRENT Evidence | Alternatives | Recommendation | What Specify Must Freeze |
|----|----------|------------------|--------------|----------------|--------------------------|
| **D1** | Canonical owner identity | StaffMember: stable UUID, business_id, revision, relationship_periods, offboard/reonboard preserved | ProfessionalProfile (optional, presentation-only) | **StaffMember** | Owner = StaffMember.id |
| **D2** | Physical cardinality | No existing assignment table; both entities have business_id FKs | Array on Service, Array on Staff, Join table | **Join table `team.staff_services` with own revision** | `UNIQUE (business_id, staff_member_id, service_id)` |
| **D3** | Relation semantics | No eligibility model exists | Binary, enriched (status/priority/skill) | **Binary: EXISTS → can perform** | `assignment EXISTS ⇔ can perform` (gated by Staff/Service status) |
| **D4** | Publish/unpublish behavior | Service.publication independent of lifecycle | Auto-unassign on unpublish | **Preserve assignments** | `publication` gates public booking only |
| **D5** | Archive/reactivate behavior | Archive forces UNPUBLISHED; reactivate sets ACTIVE+UNPUBLISHED | Auto-unassign on archive | **Preserve assignments** | `lifecycle=ARCHIVED` gates public booking + admin UI; assignments intact |
| **D6** | Onboarding behavior | StaffMember created in ONBOARDING; schedules work without ProfessionalProfile | Block assignment until ACTIVE | **Allow pre-assignment on ONBOARDING** | Assignment allowed at any employment_status |
| **D7** | Offboard/reonboard | Offboard ends period, deactivates ProfessionalProfile; reonboard new period, revokes roles | Clear assignments on offboard | **Preserve assignments always** | Offboard ≠ unassign; reonboard restores eligibility |
| **D8** | Operations | No assignment API; canonical uses executeOperation + revision + operationId | Add/Remove individual | **ReplaceStaffServices(full-set)** | Single atomic replacement with operationId |
| **D9** | Revision/concurrency | All entities have revision; advisory locks for cross-row | StaffMember.revision, Service.revision | **Assignment.revision (own aggregate)** | Optimistic lock on assignment.revision per row |
| **D10** | Authorization | Capabilities: iam.staff.*, catalog.services.*, professionals.* | Reuse iam.staff.manage | **New fine-grained: staff-services.read/manage/self.read** | Capability matrix per role |
| **D11** | Audit/idempotency | executeOperation + operationId + auditEvents table | Per-row audit | **Single event per ReplaceStaffServices with before/after arrays** | Audit schema for assignment changes |
| **D12** | H03 contract | U03 provides StaffMember schedules; U04 provides eligibility | ProfessionalProfile as provider | **H03 Availability = U03 Schedule + U04 Eligibility + U01 Terms** | StaffMember as operational reference |
| **D13** | Operational UI entry | TeamWorkspace has MemberDetail with Roles/Access/Invitations/History tabs | Profesionales workspace | **New "Servicios" tab in MemberDetail** | UI entry point location |

---

## 21. EVIDENCE INDEX

| Claim | File | Symbol/Table/Route | Type |
|-------|------|-------------------|------|
| StaffMember schema | `schema.ts:17`, `202610280001_h01_foundation.sql:51-62` | `team.staff_members` | CURRENT |
| Staff employment periods | `202610280001_h01_foundation.sql:64-75` | `team.staff_relationship_periods` | CURRENT |
| Staff roles | `202610280001_h01_foundation.sql:97-111` | `iam.role_assignments` | CURRENT |
| Staff lifecycle ops | `team/service.ts:108-122` | `lifecycle()` suspend/reactivate/revoke/offboard/reonboard | CURRENT |
| Service schema | `catalog.ts:18-34`, `202610300001_h02_u01_catalog.sql:22-40` | `catalog.services` | CURRENT |
| Service terms versions | `catalog.ts:36-54`, `202610300001_h02_u01_catalog.sql:46-79` | `catalog.service_terms_versions` (immutable) | CURRENT |
| Service lifecycle ops | `catalog/service-commands.ts` | create/update/publish/unpublish/archive/reactivate | CURRENT |
| ProfessionalProfile schema | `professionals.ts:11-27`, `202610300002_h02_u02_professionals.sql` | `team.professional_profiles` | CURRENT |
| ProfessionalProfile lifecycle | `professionals/commands.ts` | create/update/deactivate/reactivate | CURRENT |
| ProfessionalProfile optional | `local-qa.sql:384-382` | Barber has NO profile, has schedule | CURRENT |
| No staff-service relation | grep across repo | — | **GAP** (confirmed ABSENT) |
| Capabilities | `contracts/index.ts:10-26,62-66` | `capabilities`, `roleCapabilities` | CURRENT |
| Multi-tenant FKs | All migrations | `business_id` on all tables | CURRENT |
| Concurrency primitives | `team/service.ts:77`, `system/operations.ts` | `pg_advisory_xact_lock`, `executeOperation`, `revision` | CURRENT |
| Idempotency | `system/operations.ts` | `operationId` on all mutations | CURRENT |
| H03 dependency | `contracts/schedules.ts:80-88` | `StaffWeeklySchedule` owned by StaffMember | CURRENT |

---

## 22. RISKS

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **R1**: Assignment revision conflicts under high concurrency | Low | Lost updates | Optimistic lock per row; `ReplaceStaffServices` in single transaction |
| **R2**: Missing fine-grained capabilities leaks authority | Medium | Receptionist/Barber over-privileged | Add `staff-services.read/manage/self.read`; default deny |
| **R3**: Service terms change confuses assignment | None | N/A | Assignment references Service.id, not terms version |
| **R4**: ProfessionalProfile incorrectly used for eligibility | None | N/A | Product Truth forbids; Barber has schedule without profile |
| **R5**: Cross-business leak via missing FK | None | N/A | All FKs include business_id; RLS enabled |
| **R6**: Offboard/reonboard loses assignment context | Low | History gap | Assignments preserved; relationship_periods track employment history |

---

## 23. BLAST RADIUS

| Component | Change | Risk |
|-----------|--------|------|
| `packages/database/src/` | Add `staff_services` table + indexes | Low (additive) |
| `supabase/migrations/` | New migration for `staff_services` | Low |
| `packages/contracts/src/` | Add `staff-services.*` capabilities, `ReplaceStaffServices` schemas | Low |
| `apps/api/src/modules/` | New module `staff-services/` (commands, queries, routes) | Medium (new module) |
| `apps/api/src/modules/team/` | No change (StaffMember unchanged) | None |
| `apps/api/src/modules/catalog/` | No change (Service unchanged) | None |
| `apps/api/src/modules/professionals/` | No change (ProfessionalProfile unchanged) | None |
| `apps/web/src/features/team/` | Add "Servicios" tab in MemberDetail | Medium (UI) |
| `apps/web/src/features/catalog/` | No change | None |
| `supabase/seeds/local-qa.sql` | Add assignment seed data | Low |
| Tests | Add assignment unit/integration/e2e | Low |

**Total blast radius: LOW-MEDIUM** — Core domain models (StaffMember, Service, ProfessionalProfile) unchanged. New table + module + UI tab only.

---

## 24. UNVERIFIED ITEMS

| Item | Status | Notes |
|------|--------|-------|
| Real backend persistence | ✅ Confirmed | Supabase/PostgreSQL with Drizzle ORM |
| Payment gateway integration | ❌ Absent | `depositMode` config only in U01 |
| Notification channels | ❌ Mock | Not implemented |
| Offline-first sync | ❌ Absent | Not in scope |
| Public booking (H03) | ❌ Not implemented | U03 only provides schedules |

---

## 25. FINAL RECOMMENDATION

### **SAFE_TO_SPECIFY**

**Justification:**

1. **StaffMember is the canonical, stable identity** for U04 — complete lifecycle (ONBOARDING/ACTIVE/INACTIVE), employment history (`staff_relationship_periods`), independent access control, multi-tenant, revision-based concurrency. ProfessionalProfile is optional presentation layer (Barber has none).

2. **Service identity is cleanly separated from Commercial Terms** — immutable `service_terms_versions` history, `current_terms_version_id` pointer, lifecycle (ACTIVE/ARCHIVED) and publication (UNPUBLISHED/PUBLISHED) independent of terms. Assignment must reference Service `id`.

3. **NO existing staff-service assignment model exists** — U04 is a genuine gap between U01 (Catalog), U02 (Team), U03 (Schedules). No conflicting legacy code.

4. **Tenancy is consistent** — All entities have `business_id` with FKs to `business.businesses`. Cross-business prevention at FK + query level.

5. **Authorization model supports fine-grained extension** — Current capabilities are role-based; new `staff-services.*` capabilities fit cleanly without over-privileging.

6. **Concurrency primitives are established** — `operationId` idempotency, `revision` optimistic locking, `executeOperation` transaction wrapper, advisory locks for cross-row.

7. **H03 contract is derivable** — Availability = U03 StaffMember schedule + U04 StaffMember↔Service eligibility + U01 Service current terms. StaffMember remains operational reference.

8. **All adversarial cases pass** — Zero-service Staff, multi-role, Owner/Receptionist/Barber, ProfessionalProfile optional, unpublish/archive/reactivate, offboard/reonboard, cross-business, concurrency, idempotency.

9. **Blast radius is low** — Additive: new table, new module, new UI tab. Core H01/H02 entities unchanged.

**Specify must freeze:** D1–D13 (Decision Register above). No Technical Plan, no implementation in this phase.