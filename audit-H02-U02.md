# H02.U02 — CURRENT + READ-ONLY DRY RUN AUDIT REPORT
## Perfiles profesionales

**Repository:** xeyroxpagode/YoungKingzBarber
**Workspace:** C:\Users\thega\Desktop\YoungKingZ-H01-Implementation
**Branch:** feature/h01-implementation
**HEAD:** 2043eedd15d568d7ec1183697809ae8862b3836a (H01 baseline accepted)
**U01 Candidate:** Present but not yet accepted (IMPLEMENTATION CANDIDATE READY, not ACCEPTED)

---

## 0. REPOSITORY IDENTITY

| Item | Value |
|------|-------|
| Repo | xeyroxpagode/YoungKingzBarber |
| Branch | feature/h01-implementation |
| HEAD | 2043eedd15d568d7ec1183697809ae8862b3836a |
| Working tree | Dirty (modified + untracked files) |
| Delta U01 candidate | Catalog (services/categories/terms), staff role management, database schema extensions |
| Pre-existing files | docs/h01.rar, docs/h02/ |

### 0.1 H01 vs U01 CANDIDATE vs CURRENT

- **H01 ACCEPTED BASELINE**: `2043eedd15d568d7ec1183697809ae8862b3836a`, fully certified, all E2E/unit/integration tests pass
- **U01 CANDIDATE CURRENT**: Physical implementation present in worktree, adds catalog (services/categories/terms), staff role management, but not yet formally accepted (still CANDIDATE)
- **DRY-RUN**: Projection/U02 technical design, read-only, no modifications to repo

---

## 1. CURRENT LAYERING

```
H01 ACCEPTED BASELINE
+
U01 CANDIDATE DELTA
=
WORKTREE CURRENT OBSERVABLE
```

### H01 Accepted Baseline Infrastructure:
- `iam.persons` — human identity (first_name, last_name, phone)
- `iam.user_accounts` — linked to person, auth_user_id, status, verified_email
- `team.staff_members` — business+person FK, employment_status, access_status, revision tracking
- `iam.role_assignments` — staff_member + role (OWNER/RECEPTIONIST/BARBER), effective_at, revoked_at
- `iam.capability_grants` — role_assignment + capability grants with valid_from/expires_at
- `team.staff_relationship_periods` — lifecycle periods with started_at/ended_at
- `iam.access_sessions` — per-account, per-business sessions with active_role_assignment_id
- `iam.account_security_states` — recovery_required, sessions_valid_after
- Roles: OWNER, RECEPTIONIST, BARBER
- Capabilities: 33 total, role-bounded delegation

### U01 Candidate Delta:
- `packages/database/src/catalog.ts` — service_categories, services, service_terms_versions tables
- `packages/contracts/src/catalog.ts` — createServiceSchema, updateServiceProfileSchema, commercial terms, service lifecycles/publications
- `supabase/migrations/202610300001_h02_u01_catalog.sql` — catalog schema creation, RLS policies
- `apps/api/src/modules/catalog/` — queries, commands, domain, routes
- New API endpoints for catalog management
- No professional profile entities introduced

### Shared infrastructure (H01, owned by U02):
- AuthorizationService, Actor context
- Role codes and capability enums
- Revision/version tracking pattern
- Audit event system
- Staff lifecycle operations (suspend/reactivate/revoke/offboard/reonboard)

---

## 6. PERSON / ACCOUNT / STAFF MODEL

### 6.1 Person (`iam.persons`)
| Field | Business Ownership | Cardinality | Lifecycle | Timestamps |
|-------|-------------------|-------------|-----------|------------|
| id (UUID) | Business | PK | Created at insert, updated_at on person update | ✅ createdAt, updatedAt |
| firstName | Business | Not null | — | ✅ |
| lastName | Business | Optional | — | ✅ |
| phone | Business | Optional | — | ✅ |
| metadata | None | — | — | — |

**Authority**: Owner/Receptionist can update. Self-update via `iam.self.update` capability.

### 6.2 UserAccount (`iam.user_accounts`)
| Field | Business Ownership | Cardinality | Lifecycle | Timestamps |
|-------|-------------------|-------------|-----------|------------|
| id (UUID) | Business | PK, FK→person | securityRevision, credentialsChangedAt | ✅ createdAt, updatedAt |
| personId (UUID) | 1:1 → Person | Not null | — | ✅ |
| authUserId (UUID) | System (Supabase) | Not null | — | — |
| verifiedEmail (text) | Business | Optional | — | — |
| status (text) | Business | Not null (ACTIVE/INACTIVE) | — | ✅ |

**Authority**: Owner has full access. Self-access via `iam.self.read`/`iam.self.update`.

### 6.3 StaffMember (`team.staff_members`)
| Field | Business Ownership | Cardinality | Lifecycle | Timestamps |
|-------|-------------------|-------------|-----------|------------|
| id (UUID) | Business | PK | revision (optimistic), createdAt, updatedAt | ✅ |
| businessId (UUID) | Business | Not null, FK→businesses | — | ✅ |
| personId (UUID) | 1:1 → Person | Not null, FK→iam.persons | — | ✅ |
| employmentStatus (text) | Business | Not null | ONBOARDING / ACTIVE / INACTIVE | ✅ |
| accessStatus (text) | Business | Not null | ACTIVE / SUSPENDED / REVOKED / PENDING_ACTIVATION | ✅ |

**Key behavior**: 
- `employment_status` tracks employment lifecycle: ONBOARDING → ACTIVE → INACTIVE (offboard)
- `access_status` tracks operational access: ACTIVE → SUSPENDED/REVOKED/PENDING_ACTIVATION
- Offboarding sets `employment_status='INACTIVE'`, ends relationship period, revokes sessions
- Reonboarding creates new relationship period, resets role assignments

**When Staff leaves**: 
- `employment_status → INACTIVE`
- `access_status → SUSPENDED/REVOKED`
- `staff_relationship_periods.ended_at` gets timestamp
- History preserved (record not deleted)
- Can reonboard later with new period

### 6.4 RoleAssignment (`iam.role_assignments`)
| Field | Business Ownership | Cardinality | Lifecycle |
|-------|-------------------|-------------|-----------|
| id (UUID) | Business | PK | revision |
| staffMemberId (UUID) | 1:N → StaffMember | Not null | effective_at, revoked_at |
| role (text) | OWNER/RECEPTIONIST/BARBER | Not null | — |
| assignedByAccountId (UUID) | Business | — | — |

**Max 3 roles per staff member** (enforced by contract `roleSchema.max(3)`).

### 6.5 StaffRoleStates (internal tracking)
- Tracks staff member's current role state for access control
- Used by AuthorizationService to determine active role

### 6.6 AccessSessions
- Per-account session with active_role_assignment_id
- Context switching via `iam.contexts.switch`
- One active role assignment per session

### 6.7 Conclusion — What U02 Should NOT Duplicate:
- **Person** — human identity, keep as-is
- **UserAccount** — authentication, keep as-is
- **StaffMember** — employment relationship, keep as-is
- **RoleAssignment** — IAM responsibility model, keep as-is
- **AccessSession** — runtime session management, keep as-is

**U02 should anchor to StaffMember, not duplicate Person/UserAccount/Staff membership.**

---

## 7. STAFF IDENTITY

### 7.1 Is `staff_member.id` a stable identity?
**YES.** UUID primary key, optimistic revision tracking, preserved through employment status changes. When a staff member offboards, the record stays (employment_status → INACTIVE) and can be reonboarded.

### 7.2 What occurs when a Staff leaves the business?
- `employment_status → INACTIVE`
- `access_status → SUSPENDED/REVOKED`
- `staff_relationship_periods.ended_at` gets timestamp (with optional ended_reason)
- All historical role assignments, grants, audit events preserved
- Record not deleted — reonboarding possible later

### 7.3 Does it get deleted or conserved?
**Conserved.** Soft-delete pattern via employment_status/access_status. No physical deletion observed in H01 or U01 candidate.

### 7.4 Is there historical period tracking?
**YES.** `team.staff_relationship_periods` tracks start/end timestamps. One open period per staff_member (ended_at is null by default).

### 7.5 Can a staff member return later?
**YES.** Reonboarding creates a new relationship period, resets role assignments (revokes old ones), and restores access. The same `staff_member.id` is reused.

### 7.6 Does the same StaffMember get reused?
**YES.** The ID persists across on/offboard cycles. Only the employment_status/access_status change.

### 7.7 What does `employment_status` mean exactly?
- `ONBOARDING` — newly invited, not yet fully activated
- `ACTIVE` — fully operational, has active access
- `INACTIVE` — offboarded, employment terminated

### 7.8 What lifecycle operations exist?
- `suspend` — access_status → SUSPENDED (temporary removal)
- `reactivate` — access_status → ACTIVE (temporary restoration)
- `revoke` — access_status → REVOKED (permanent removal, but record kept)
- `offboard` — employment_status → INACTIVE, period end-dated
- `reonboard` — creates new period, resets roles, restores access

### 7.8 Natural anchor for ProfessionalProfile?
**StaffMember** is the most natural anchor. It already:
- Has business ownership (business_id)
- Tracks lifecycle (employment_status, access_status, periods)
- Has revision optimization
- Is the single point where IAM roles attach
- Is the entity that U01 candidate already manages

---

## 8. PERSON DATA

### 8.1 Current Person fields:
| Field | Present? | Professional? | Person/Personal? |
|-------|----------|---------------|------------------|
| first_name | ✅ | No | Person |
| last_name | ✅ | No | Person |
| phone | ✅ | No | Person |
| email | ✅ (via user_accounts.verified_email) | No | Account |
| avatar | ❌ | — | Absent |
| photo URL | ❌ | — | Absent |
| display_name | ❌ (no such field) | — | Absent |
| metadata | ❌ | — | Absent |
| timestamps | ✅ | — | System |

### 8.2 Separation of Person truth vs Professional presentation:
- **Person truth**: first_name, last_name, phone — purely human identity, no professional semantics
- **Professional presentation**: None currently exists as a separate concept

### 8.3 Potential duplication risk:
No current professional fields on Person that would duplicate if ProfessionalProfile were added. All Person fields are purely personal.

### 8.4 Conclusion:
Person data is entirely personal. Any professional display name, bio, photo, or title should NOT go on Person. They belong in a ProfessionalProfile anchored to StaffMember.

---

## 9. ROLE BARBER — CRITICAL AUDIT

### 9.1 What is BARBER currently?
- **IAM role code**: One of {OWNER, RECEPTIONIST, BARBER} assigned via `iam.role_assignments`
- **Capabilities** (from `roleCapabilities` in contracts):
  ```
  BARBER: ["iam.self.read", "iam.self.update", "iam.sessions.read", "iam.sessions.terminate", "iam.contexts.list", "iam.contexts.switch"]
  ```
- **Runtime behavior**: BARBER is an IAM authorization context, NOT a professional identity marker per se

### 9.2 Is BARBER exclusively an IAM authorization context?
**YES.** BARBER is an IAM role that grants specific capabilities. It controls what actions the role holder can perform in the system.

### 9.3 Does any runtime presume that every BARBER is a professional operative?
**PARTIAL.** The BARBER role has `iam.self.read` and `iam.self.update`, which enables a barber to read/update their own data. This is the foundation for professional self-service, but the role itself doesn't guarantee professional identity metadata.

### 9.4 Do any entities FK/reference role assignment to represent a barbero?
**YES.** `iam.role_assignments` has `staff_member_id` FK, and `AuthorizationService.authenticate()` requires at least one active role assignment for the staff member. The flow is:
1. Supabase auth → `iam.user_accounts` → `team.staff_members`
2. Role assignments attached to that staff_member
3. Active role determines capabilities

### 9.5 Does changing/revoking BARBER destroy operative information?
**NO.** Revoking the BARBER role only removes those capabilities. The staff_member record, person data, employment history, and other roles remain intact. There is NO cascade delete from role revocation.

### 9.6 Classification of findings:

| Finding | Classification |
|---------|---------------|
| BARBER = IAM role with specific capabilities | CURRENT |
| BARBER has `iam.self.read`/`iam.self.update` | CURRENT |
| BARBER role revocation does NOT delete staff data | CURRENT |
| BARBER ≡ ProfessionalProfile (not equivalent) | GAP |
| BARBER can serve as professional identity anchor | INFERENCE |
| No professional profile table/entity exists yet | GAP |
| Self-service via `iam.self.*` is the natural bridge | INFERENCE |

### 9.7 Key insight:
BARBER role provides the **capability primitive** for self-service, but does NOT define professional identity. U02 should create a ProfessionalProfile entity linked to StaffMember, while keeping BARBER as the IAM role for authorization. The `iam.self.read`/`iam.self.update` capabilities on BARBER make them the natural actor for self-profile updates, but the ProfessionalProfile itself is a separate concern.

---

## 10. MULTI-ROLE CURRENT

### 10.1 Can a Staff have multiple roles simultaneously?
**YES.** The schema allows up to 3 roles per staff member (`roleSchema.max(3)`). Examples documented:

| Multi-role Combination | How represented | Capability impact | Primary role selection |
|------------------------|-----------------|-------------------|------------------------|
| OWNER + BARBER | Multiple `iam.role_assignments` rows per staff_member | Both sets of capabilities accumulate | No formal "primary" — depends on active session |
| RECEPTIONIST + BARBER | Multiple assignments | Combined capabilities | Same as above |
| OWNER + RECEPTIONIST | Multiple assignments | Combined capabilities | Same as above |

### 10.2 How does context selection work?
- `iam.access_sessions` has `active_role_assignment_id` — one per session
- `iam.contexts.switch()` allows switching between assigned roles
- `iam.user_context_preferences` stores per-account preferred role assignment
- Default: first active role assignment (sorted by created_at)

### 10.3 How do capabilities affect?
- Capabilities from ALL active role assignments are combined (via `roleCapabilities` + `capability_grants`)
- A staff member with OWNER + BARBER has all OWNER capabilities + BARBER's `iam.self.*` + catalog capabilities
- Delegable capabilities are checked against the combined set

### 10.4 Is there a "primary role" concept?
**NO formal primary role.** The system treats all assigned roles equally in terms of capability accumulation. The `active_role_assignment_id` in the session determines which role's grants are primary for that session, but all roles contribute.

### 10.5 Critical finding for U02:
Multi-role support means a Staff member can be both OWNER and BARBER (Case 1 in adversarial cases). This has implications for ProfessionalProfile:
- Owner-staff also being professional → ProfessionalProfile must be separable from IAM role
- The same StaffMember can have multiple roles, so ProfessionalProfile cannot be tied to a single role
- ProfessionalProfile should be tied to the StaffMember ID, not the role code

---

## 11. STAFF LIFECYCLE VS IAM ACCESS

### 11.1 Separation of concerns:
| Layer | When changed | What changes | What conserved |
|-------|-------------|-------------|----------------|
| Employee active/inactive | `lifecycle()` offboard/reonboard | employment_status, access_status, period end-dating | StaffMember ID, person data, audit history |
| Access suspended | `lifecycle()` suspend | access_status → SUSPENDED | employment_status, person data, roles |
| Account restricted | Security event | account_security_states.recovery_required | StaffMember, employment history |
| Roles assigned/revoked | `replaceRoles()` | role_assignments rows | StaffMember, person data, employment |
| Sessions terminated | `terminateSessions()` | access_sessions revoked_at | StaffMember, all above |

### 11.2 If a person leaves work, what layers change?
- **Change**: employment_status → INACTIVE, access_status → REVOKED, relationship period ended_at set
- **Conserved**: StaffMember ID (historical reference), person record, all audit events, role assignment history, capability grant history

### 11.3 What ProfessionalProfile should do during lifecycle transitions:
- **Option A**: Derive completely from Staff lifecycle (ProfessionalProfile active ⇔ Staff active)
- **Option B**: Independent lifecycle (ProfessionalProfile ACTIVE/INACTIVE separate from Staff)
- **Option C**: Profile stable + ActivityPeriods (ProfessionalProfile always conserved, periods track activity)

**Evidence-based recommendation**: **Option C** — ProfessionalProfile is stable (created once, deactivated reactivated independently), while activity periods track effective professional activity. This matches the `staff_relationship_periods` pattern and avoids losing historical identity when staff employment status changes.

---

## 12. CURRENT PROFILE SURFACES

### 12.1 Frontend profiles examined:

| Surface | Owner-editable | Staff-editable | Read-only | Notes |
|---------|---------------|----------------|-----------|-------|
| `Equipo` (Team workspace) | ✅ Owner | ✅ Owner | Staff names/display | Shows staff list with basic info |
| Member detail | ✅ Owner | ❌ | Staff basic info | No professional profile fields |
| Account (`/account`) | ✅ Owner | ✅ Self (via `iam.self.*`) | Email, password | Self-service via BARBER capabilities |
| Profile — no dedicated professional profile screen exists | — | — | — | **GAP** |

### 12.2 What data appears on current screens:
- Staff name (first + last from Person)
- Role badge (OWNER/RECEPTIONIST/BARBER)
- Employment status (ACTIVE/SUSPENDED/INACTIVE)
- Access status
- Basic contact (email from user_accounts)

### 12.3 What Owner can edit:
- Staff first/last name (via `updateStaff`)
- Staff roles (via `replaceRoles`)
- Staff employment/status via lifecycle operations
- All staff member data they manage

### 12.4 What Staff can edit (self):
- Their own email/password (via account page, requires `iam.self.update` — BARBER has this)
- Their own display name is NOT currently exposed as editable

### 12.5 Dirty guard / revision tracking:
- All updates require `revision` matching (optimistic concurrency)
- `updateStaff` validates `sm.revision=${input.revision}`, throws `STALE_REVISION` (409) if mismatched
- Audit events track all changes with `action`, `capability`, `changes`

### 12.6 Conclusion:
**No dedicated professional profile frontend exists.** Any U02 profile surface would be new. The closest existing surface is the account page (`/account`) which uses `iam.self.*` capabilities for self-service.

**Important**: `prototype ≠ runtime`. The web app has some prototype/components but the actual API surface for staff/profile data is what matters (verified through the API routes in `app.ts`).

---

## 13. BARBER FRONTEND CURRENT

### 13.1 Navigation surfaces for BARBER role:
- **`/team`** — Team workspace, shows all staff, Owner-dominated
- **`/account`** — Self account page, accessible when authenticated as BARBER (via `iam.self.read`/`iam.self.update`)
- **`/login`** — Authentication entry point
- **No BARBER-specific home, agenda, or profile pages exist** in the runtime

### 13.2 Profile-related frontend:
- Account page has "Mi cuenta" → view own email, change password, access sessions
- No "professional bio", "display name", "photo", or "title" fields anywhere in the runtime
- The `AppShell.tsx` and team navigation are Owner-oriented

### 13.3 Visibility rules:
- BARBER can see own account data (via `iam.self.read`)
- BARBER can update own account data (via `iam.self.update`)
- Owner can see/edit all staff data
- No professional-profile-specific visibility rules exist

### 13.4 Data from person used in frontend:
- first_name, last_name from `iam.persons`
- email from `iam.user_accounts.verified_email`
- No avatar, photo, display_name, title, or bio fields

### 13.5 Classification:
- **Runtime surfaces**: Limited to account self-service, no professional profile
- **Prototypes**: May exist in artifacts, but not in current runtime code
- **Gap**: No professional profile frontend surface exists

**Important**: "If only artifacts/prototypes and not runtime, mark clearly" → **Confirmed: No runtime professional profile surfaces exist.**

---

## 14. AVATAR / MEDIA / IMAGE INFRASTRUCTURE

### 14.1 Current infrastructure audit:
| Infrastructure | Status | Classification |
|---------------|--------|----------------|
| Avatar field on Person/Staff | ❌ Absent | ABSENT |
| Profile photo field | ❌ Absent | ABSENT |
| Supabase Storage bucket reference | ❌ No references found | ABSENT |
| Upload helpers (API endpoints) | ❌ None found | ABSENT |
| File references (DB columns) | ❌ None | ABSENT |
| Signed URL generation | ❌ None | ABSENT |
| Image component conventions | ❌ None | ABSENT |

### 14.2 Supabase Storage:
- No bucket configurations found in the codebase
- No storage API calls in the API modules
- The Supabase project is local (`youngkingz-h01`) with development keys

### 14.3 Conclusion:
**Avatar/profile photo infrastructure is ABSENT in CURRENT.** U02 would need to add this if professional photos are required. However, the dry run should not assume it — it should be evaluated as a U02 design decision.

**Classification**: `ABSENT` — no avatar/media infrastructure exists in current codebase.

---

## 15. CURRENT AUTHORIZATION

### 15.1 Actor model:
- `Actor` interface: `{ accountId, personId, businessId, staffMemberId, accessSessionId, roleAssignmentId, role, contextRevision, capabilities, email }`
- Authentication flow: Supabase JWT → `iam.user_accounts` → `team.staff_members` → role assignments → capabilities
- Authorization: `AuthorizationService.require(actor, capability)` — throws 403 if missing

### 15.2 Capability enum (33 capabilities):
Key categories:
- `iam.*` — IAM/access control
- `catalog.*` — Catalog/services management
- `system.*` — Operations, audit, operations

### 15.3 Role-based capability mapping:
```
OWNER: all capabilities except iam.security.recover
RECEPTIONIST: iam.self.read, iam.self.update, iam.sessions.read/terminate, iam.contexts.list/switch, catalog.read
BARBER: iam.self.read, iam.self.update, iam.sessions.read/terminate, iam.contexts.list/switch
```

### 15.4 Natural professional profile authorization patterns:
| Pattern | Description | Compatible with CURRENT? |
|---------|-------------|--------------------------|
| `professional.read` | Read own professional profile | ✅ Can be added as new capability |
| `professional.manage` | Manage own professional profile | ✅ Can be added as new capability |
| `professional.self.read` | Read own profile (same as iam.self.read) | ✅ Reusable |
| `professional.self.update` | Update own profile (same as iam.self.update) | ✅ Reusable |
| `owner.manage_all_professionals` | Owner manages all staff profiles | ✅ Can add capability |
| `admin.impersonate_staff` | Admin impersonates any staff | ⚠️ Would need new capability |

### 15.5 Comparison of alternatives:
- **Alternative A**: Add `professional.read`/`professional.manage` as new capabilities → Clean, explicit
- **Alternative B**: Reuse `iam.self.read`/`iam.self.update` → Simpler, but blurs professional/personal boundary
- **Alternative C**: Role-based (BARBER gets professional.* automatically) → Risks conflating IAM with professional identity

**Recommendation**: **Alternative A** — add explicit `professional.read`/`professional.manage` capabilities that can be granted to BARBER (or other roles) via `capability_grants`. This keeps the professional identity boundary clear while reusing the existing grant infrastructure.

---

## 16. SELF-SERVICE AUTHORIZATION

### 16.1 Operations type: actor modifying own account/profile
### 16.2 Comparison: self vs owner modification

| Operation | Self (Staff) | Owner (another Staff) |
|-----------|-------------|----------------------|
| Read own data | ✅ `iam.self.read` (BARBER has this) | ✅ Owner always has read access |
| Update own data | ✅ `iam.self.update` (BARBER has this) | ⚠️ Owner needs explicit capability |
| Read another's data | ❌ No primitive | ✅ Owner has full access |
| Update another's data | ❌ No primitive | ✅ Owner has full access |

### 16.3 Primitive existence:
- **`iam.self.read`** — YES, BARBER has this, RECEPTIONIST has this
- **`iam.self.update`** — YES, BARBER has this, RECEPTIONIST has this
- **Self-profile modification primitive** — NOT YET. These modify Person/Staff data, not a ProfessionalProfile.

### 16.4 Resolution mechanism:
- **Self**: Check if `actor.staffMemberId` matches the target staff_member_id being modified. If yes, `iam.self.*` capabilities suffice.
- **Owner**: No special check — Owner has unrestricted access to all staff they manage (enforced by business_id FK filter in all queries).

### 16.5 Patterns reusable for U02:
1. **Resource ownership model**: ProfessionalProfile rows have `business_id` + `staff_member_id`. Self-service checks `actor.staffMemberId === profile.staffMemberId`.
2. **Capability model**: Add `professional.read`/`professional.self.update` capabilities, grantable to BARBER role.
3. **Hybrid**: Use `iam.self.*` for basic self-service, add professional-specific capabilities for advanced editing.

### 16.6 Conclusion:
**Existing primitive `iam.self.read`/`iam.self.update` is the foundation for professional self-service.** U02 should build on this, not create a completely new authorization model. The key decision is whether professional profile fields use the same capabilities or get separate ones.

**Recommendation**: Grant `professional.read`/`professional.self.update` to BARBER role via capability grants, reusing the same grant infrastructure already in place (`iam.capability_grants`).

---

## 17. CONCURRENCY CURRENT

### 17.1 Revision tracking:
| Entity | Revision field | Optimization pattern |
|--------|---------------|---------------------|
| `staff_members` | `revision: bigint` | Incremented on each update (`revision+1`) |
| `role_assignments` | `revision: bigint` | Incremented on each change |
| `capability_grants` | `revision: bigint` | Incremented on each grant change |
| `persons` | No explicit revision (uses `updatedAt`) | — |
| `user_accounts` | `securityRevision: bigint` | Security-specific tracking |

### 17.2 Stale conflict handling:
- All `updateStaff`, `updateRoles`, `issueGrant`, `lifecycle` operations validate revision before applying
- `DomainError("STALE_REVISION", "Staff revision is stale", 409)` thrown on mismatch
- Audit events record the outcome (success/failure)

### 17.3 ProfessionalProfile revision alternatives:

| Alternative | Description | Coupling | Stale conflict risk | Ownership |
|------------|-------------|----------|--------------------|-----------|
| **A**: Own revision on ProfessionalProfile | `professional_profiles.revision` | Low (independent) | Medium (independent from Staff) | ProfessionalProfile |
| **B**: Reuse Staff revision | ProfessionalProfile has no revision; Staff.revision implies profile state | High (tied to Staff) | Low (same as Staff) | StaffMember |
| **C**: Aggregate Staff + Professional | Single transaction updates both | Very High | High (both must succeed) | Combined |

### 17.4 Evaluation:

**Alternative A (own revision)**:
- ✅ Decoupled from Staff lifecycle — ProfessionalProfile can be deactivated while Staff is active or vice versa
- ✅ Natural for independent professional identity
- ⚠️ Additional revision tracking overhead
- ✅ Best for U03/U04 where professional activity may differ from employment status

**Alternative B (reuse Staff revision)**:
- ✅ No extra revision field
- ✅ ProfessionalProfile state always consistent with Staff status
- ⚠️ Professional identity tied to employment — if staff offboards, professional "dies" too
- ⚠️ Conflicts between professional updates and employment changes

**Alternative C (aggregate)**:
- ❌ Too coupled — any change to either requires both
- ❌ High blast radius for stale conflicts
- ❌ Not recommended

**Preferred**: **Alternative A** — ProfessionalProfile with its own revision, allowing independent lifecycle from StaffMember.

---

## 18. IDEMPOTENCY / OPERATIONS

### 18.1 Current idempotency patterns:
- `operationId` per mutation (UUID, passed by client)
- `executeOperation` wrapper tracks `operationId`, `command`, `actor`, `payload`
- `operation_attempts` table records: operationId, commandName, status, responseStatus, errorCode, createdAt, completedAt
- Replay: same `operationId` can be replayed; idempotency check via database constraints or application logic
- Failed operation: recorded with errorCode, can be retried with same or new operationId

### 18.2 H01 candidate extension (U01):
- `createStaff` is idempotent if same operationId used (staff ID already exists → error)
- `updateStaff` requires revision match — not truly idempotent, requires current state
- `lifecycle` operations are not idempotent — each execution changes state
- `replaceRoles` is idempotent for same role set (adding/removing same roles)

### 18.3 U02 projection:
U02 should **reutilize** the H01/U01 operation/idempotency infrastructure:
- Same `operationId` pattern
- Same `executeOperation` wrapper
- Same `operation_attempts` audit table
- New commands: `professional.create`, `professional.update`, `professional.deactivate`, `professional.reactivate`
- Idempotency: use `operationId`; if ProfessionalProfile already exists with same staff_member_id, return existing record (or error based on idempotency mode)

**Dependency on U01 candidate**: The `executeOperation` pattern, `operation_attempts` table, and `DomainError` infrastructure are all H01/U01 candidate. U02 should reuse these without modification.

---

## 19. AUDIT CURRENT

### 19.1 Existing audit event patterns:
Events recorded via `audit(tx, {actor, operationId, action, capability, resourceType, resourceId, changes})`.

### 19.2 Professional profile conceptual events (not yet in code):
```
professional.created     → when ProfessionalProfile first created
professional.profile_updated → when ProfessionalProfile fields change
professional.deactivated → when ProfessionalProfile set to INACTIVE
professional.reactivated → when ProfessionalProfile restored to ACTIVE
```

### 19.3 Mapping to existing infrastructure:
| Conceptual Event | Existing equivalent | ResourceType |
|-----------------|---------------------|--------------|
| professional.created | staff.created (partial) | STAFF_MEMBER |
| professional.profile_updated | staff.updated (partial) + audit | PROFESSIONAL_PROFILE |
| professional.deactivated | access.suspend / lifecycle.offboard | PROFESSIONAL_PROFILE |
| professional.reactivated | access.reactivate / lifecycle.reonboard | PROFESSIONAL_PROFILE |

### 19.4 Resource ID mapping:
- **ProfessionalProfile resource ID**: The `staff_member_id` (one-to-one with StaffMember)
- **Actor**: The authenticated staff member (or Owner)
- **Changes**: JSON diff of profile fields changed

### 19.5 Conclusion:
Audit infrastructure is solid. Professional profile events would follow the same pattern. No special changes needed to the audit system.

---

## 20. DATABASE COLLISION SEARCH

### 20.1 Search results for key professional-related strings:

| Symbol/String | Classification | Location | Evidence |
|--------------|---------------|----------|----------|
| `professional` | UNRELATED | Not found in DB/contracts/API | — |
| `professional_profile` | UNRELATED | Not found in DB/contracts/API | **GAP — this is what U02 should create** |
| `barber_profile` | UNRELATED | Not found in DB/contracts/API | **GAP — this is what U02 should create** |
| `barber` | ACTIVE RUNTIME | `role_assignments.role = 'BARBER'`, `roleCapabilities.BARBER` | IAM role |
| `stylist` | HISTORICAL DOC | Not in current code | — |
| `provider` | HISTORICAL DOC | Not in current code | — |
| `specialist` | UNRELATED | Not found | — |
| `profile` | MIXED | `apps/web/src/features/team/TeamWorkspace.tsx` (displays staff list), API routes | Staff listing, not professional profile |
| `bio` | UNRELATED | Not found | — |
| `avatar` | ABSENT | Not found in DB/schemas | — |
| `photo` | ABSENT | Not found in DB/schemas | — |
| `display_name` | ABSENT | Not found in Person schema | — |
| `nickname` | UNRELATED | Not found | — |
| `title` | MIXED | Role codes (BARBER), but no professional title field | IAM role, not professional title |
| `position` | UNRELATED | Not found | — |

### 20.2 Key finding:
**No collision — nothing currently exists that would conflict with a new ProfessionalProfile entity.** The string `professional` and `professional_profile` are not used in any active runtime context, which means U02 can introduce them without renaming conflicts.

### 20.3 Classification summary:
- `professional` — UNRELATED (generic term, not currently used as entity name)
- `professional_profile` — UNRELATED (doesn't exist — this is U02's entity)
- `barber_profile` — UNRELATED (doesn't exist — could be alternative naming)
- `barber` — ACTIVE RUNTIME (IAM role, should NOT be conflated with ProfessionalProfile)
- `profile` — MIXED (staff listing display, not professional profile)
- `avatar`, `photo`, `bio`, `title`, `position` — ABSENT (nothing exists, U02 can define)

**Goal achieved**: Avoiding second entity for something that already exists — **CONFIRMED: No existing entity to avoid. ProfessionalProfile is genuinely new.**

---

## 21. U01 CANDIDATE INTERACTION

### 21.1 What U01 candidate introduced that U02 might consume:

| U01 Feature | U02 Relevance | Dependency Notes |
|-------------|--------------|------------------|
| `catalog` schema (services, categories, terms) | ✅ Indirect | U02 should NOT depend on catalog internals; only shared infrastructure (AuthorizationService, Actor, revision pattern) |
| Staff role management (replaceRoles, lifecycle) | ✅ High | U02 reuses `replaceRoles`, `lifecycle` operations, capability grant infrastructure |
| `capability_grants` table | ✅ High | U02 adds new capabilities (`professional.read`, `professional.manage`) to same table |
| `staff_relationship_periods` | ✅ Medium | U02 may model professional activity periods similarly |
| `iam.access_sessions` | ✅ Medium | U02 professional self-service flows through same session mechanism |
| AuthorizationService, Actor context | ✅ High | Core infrastructure, definitely reusable |
| No professional profile entities | ✅ Confirmation | U02 creates fresh entity, no U01 dependency |

### 21.2 Material dependencies U02 has on U01 candidate:
1. **Shared infrastructure**: AuthorizationService, Actor, capability grants, audit events, revision pattern
2. **No entity-level dependency**: U01 candidate does NOT introduce any professional profile–related tables, columns, or API endpoints
3. **Catalog separation**: U02 catalog capabilities (`catalog.read`, `catalog.services.*`) are separate from professional profile concerns

### 21.3 Declaration:
**DEPENDENCY ON U01 CANDIDATE CURRENT**: Only shared infrastructure (authorization, actor, grants, audit, revision). No entity or contract dependencies. U02 can be specified independently.

---

## 22. DRY RUN — DOMAIN BOUNDARY

### 22.1 Evaluated alternatives:

#### Alternative A — ProfessionalProfile separated, linked to StaffMember
```
StaffMember
   │
   └── ProfessionalProfile
```
- **Coherence with CURRENT**: ✅ StaffMember is already the anchor for IAM roles, employment lifecycle, and person linkage
- **Historia**: ✅ ProfessionalProfile preserved even when Staff offboards (Option C lifecycle)
- **Multi-role**: ✅ Works — ProfessionalProfile tied to StaffMember ID, not role code
- **Tenancy**: ✅ business_id FK on ProfessionalProfile, same as other entities
- **U03 impact**: ✅ ProfessionalProfileId natural reference for U03 (schedules)
- **U04 impact**: ✅ ProfessionalProfileId natural reference for U04 (service eligibility)
- **Risk**: Low — adds new table, no existing data affected

#### Alternative B — Professional fields directly on StaffMember
Extends `team.staff_members` with professional fields.
- **Coherence**: ⚠️ Mixes personal employment data with professional identity
- **Historia**: ⚠️ Professional state tied to employment status — if staff offboards, professional identity lost
- **Multi-role**: ⚠️ All roles share same professional fields — confusing if one staff has multiple roles
- **Tenancy**: ✅ Same business_id
- **U03 impact**: ⚠️ Professional state tied to employment — scheduling may break
- **U04 impact**: ⚠️ Service eligibility tied to employment status
- **Risk**: Medium — modifies existing table, changes semantics of StaffMember

#### Alternative C — BARBER RoleAssignment as professional identity
Uses `role = 'BARBER'` as the professional identity marker.
- **Coherence**: ❌ Conflates IAM authorization with professional identity
- **Historia**: ❌ If BARBER role revoked, professional identity "disappears"
- **Multi-role**: ⚠️ Can have BARBER role without professional profile data (or vice versa)
- **Tenancy**: ✅ Already has business_id
- **U03 impact**: ❌ Scheduling would need to check role code, not profile
- **U04 impact**: ❌ Service eligibility based on role, not professional state
- **Risk**: HIGH — architectural anti-pattern, conflates two concerns

#### Alternative D — New Professional entity independent of Staff
Creates `professional_profiles` table independent of StaffMember.
- **Coherence**: ⚠️ No direct FK to StaffMember — how linked?
- **Historia**: ⚠️ Identity management becomes complex — one professional, multiple staff?
- **Multi-role**: ❌ How does multi-role staff have one professional profile?
- **Tenancy**: ✅ business_id required
- **U03 impact**: ⚠️ Needs own linkage mechanism
- **U04 impact**: ⚠️ Service eligibility needs professional ID lookup
- **Risk**: High — duplicate identity, potential 1:N or N:M complexity

### 22.2 DRY-RUN PREFERRED:
**Alternative A** — ProfessionalProfile separated, linked to StaffMember.

**Rationale**:
1. StaffMember already the natural anchor (employment lifecycle, business ownership, IAM roles)
2. Separation of concerns: IAM roles (BARBER/RECEPTIONIST/OWNER) vs professional identity
3. Supports multi-role staff (same ProfessionalProfile, multiple roles)
4. Enables independent professional lifecycle (Alternative C from section 17)
5. Clean U03/U04 references (professionalProfileId foreign key)
6. Lowest blast radius — new table, no existing data modification
7. Matches the "stable professional identity" hypothesis without duplicating Person/UserAccount/StaffMember

---

## 23. DRY RUN — PROFILE FIELDS

### 23.1 Fields investigated for legitimate ProfessionalProfile ownership:

| Field | Classification | Reason |
|-------|---------------|--------|
| professional display name | **LIKELY PROFESSIONAL** | Distinct from person's legal name; purpose is professional presentation |
| bio | **LIKELY PROFESSIONAL** | "About me" text for professional context, not personal biography |
| public title | **LIKELY PROFESSIONAL** | e.g., "Senior Barber", "Master Stylist" — professional positioning |
| profile photo | **LIKELY PROFESSIONAL** | Photo for professional presentation, distinct from personal avatar |
| internal notes | **LIKELY PROFESSIONAL** | Owner-only notes about the professional, not visible to staff or public |
| sort order | **FUTURE/UNNECESSARY** | UI ordering, not domain data; can be derived or added later |
| nickname | **LIKELY PERSON/STAFF** | More personal than professional; could go on Person if needed |
| display_name (overloaded) | **DECISION-REQUIRED** | Could be person's display name OR professional name — needs boundary |

### 23.2 Comparison with Person/Staff likelihood:

| Field | Professional | Person/Staff | Verdict |
|-------|-------------|--------------|---------|
| first_name | ❌ | ✅ | Person |
| last_name | ❌ | ✅ | Person |
| phone | ❌ | ✅ | Person |
| email | ❌ | ✅ (via Account) | Account |
| avatar/photo | ✅ (for prof) | ❌ (none exists) | Professional add-on |
| bio | ✅ | ❌ | Professional |
| display_name | ✅ (professional) | ✅ (person name) | Boundary needed |
| title | ✅ (professional) | ❌ (no such field) | Professional add-on |

### 23.3 Conclusion:
Fields that are **LIKELY PROFESSIONAL** should go on ProfessionalProfile, NOT on Person or StaffMember:
- display name (professional)
- bio
- public title
- profile photo

Fields that are **LIKELY PERSON/STAFF** should stay on Person/Staff:
- first_name, last_name, phone
- (no professional fields should migrate there)

Fields that are **FUTURE/UNNECESSARY**:
- sort order (can be added later)
- internal notes (owner-only, can be added in U02 if needed)

---

## 24. DRY RUN — PROFESSIONAL LIFECYCLE

### 24.1 Alternatives compared:

| Alternative | Description | Staff periods correlation | U03 impact | U04 impact | Risk |
|-------------|-------------|-------------------------|------------|------------|------|
| **A**: ACTIVE / INACTIVE | Simple enum on ProfessionalProfile | Derived from Staff status | Low — professional active flag | Low — eligibility check | Low |
| **B**: Derive completely from Staff lifecycle | Professional active ⇔ Staff active | Direct correlation | Medium — changes affect employment | Medium — eligibility tied to employment | Medium |
| **C**: Profile stable + ProfessionalActivityPeriods | ProfessionalProfile always conserved; periods track activity | Separate from employment periods | Low — periods independent | Low — eligibility from periods | Low |
| **D**: New ProfessionalProfile each reactivation | Fresh profile on each restart | Multiple periods possible | High — history fragmented | High — eligibility fragmented | High |

### 24.2 Evaluation against Staff periods CURRENT:

**Alternative C (Profile stable + ActivityPeriods)** is preferred because:
- Matches the `staff_relationship_periods` pattern already in the codebase
- ProfessionalProfile is created once, survives employment cycles
- ActivityPeriods (like relationship periods) track effective professional activity
- If Staff offboards, ProfessionalProfile stays (historical identity)
- If Staff reonboards, ProfessionalProfile reactivated with new activity periods
- U03 schedules reference ActivityPeriods, not directly Staff status
- U04 eligibility references ProfessionalProfile ACTIVE flag + ActivityPeriods

### 24.3 Recommended lifecycle:
```
ProfessionalProfile
  - id, staff_member_id (FK), business_id, revision
  - status: ACTIVE / INACTIVE (independent of employment)
  - activity_periods: one-to-many, started_at, ended_at, reason
  - profile_photo_url, display_name, bio, title
  - createdAt, updatedAt, revision
```

---

## 25. DRY RUN — OPERATIONAL ELIGIBILITY

### 25.1 Separation of facts (who owns each):

| Fact | Should be owned by | Reason |
|------|-------------------|--------|
| ProfessionalProfile exists | U02 | New entity, natural owner |
| ProfessionalProfile active | U02 | Lifecycle state, independent from Staff |
| Staff currently active | H01/U01 | Employment lifecycle, already owned |
| Account/access active | H01/U01 | Authentication/authorization, already owned |
| Professional has services | U03 | U03 defines service eligibility |
| Professional has schedule | U03 | U03 defines professional schedules |
| Professional has availability | U03/U04 | U03 defines availability, U04 may consume |

### 25.2 Avoiding premature creation:
- **`available`** — should NOT be created in U02. This is a U03 concern (availability → schedule → slots).
- **`bookable`** — should NOT be created in U02. This is a U03/booking concern (slots → reservations → bookings).
- **`scheduled`** — should NOT be created in U02. This is U03 (scheduling → time slots).

**U02 should only own**: ProfessionalProfile existence, active status, basic fields (display name, bio, title, photo). Everything else (schedules, availability, bookings, services eligibility) belongs to U03/U04.

### 25.3 Minimal U02 eligibility set:
```text
ProfessionalProfile exists
ProfessionalProfile active (ACTIVE/INACTIVE)
Professional has display_name (for presentation)
Professional has bio (for presentation)
Professional has public_title (for positioning)
Professional has profile_photo (for presentation)
```

---

## 26. DRY RUN — U03 CONTRACT

### 26.2 Projected identity/state consumption for U03 (Jornadas / disponibilidad base profesional):

| Question | Answer | Rationale |
|----------|--------|-----------|
| `professionalProfileId`? | ✅ Recommended | Links jornada to professional identity, not staff employment status |
| `staffMemberId`? | ⚠️ Also possible | Alternative, but less precise (employs vs professional) |
| Both? | ❌ Avoid — redundancy | Choose one anchor, not both |
| Lifecycle needed | ✅ YES | ProfessionalProfile ACTIVE/INACTIVE flag, plus ActivityPeriods |
| If professional deactivated | ⚠️ U03 should respect it | U03 should filter out inactive professionals from eligible lists |

### 26.3 Recommended U03 contract:
- **Resource**: `professional_profiles.id` (or `professional_profile_id` on jornadas)
- **Lifecycle**: ProfessionalProfile.ACTIVE flag must be true for jornada to be eligible
- **History**: ActivityPeriods provide effective date ranges for jornadas
- **If professional deactivated**: U03 should mark associated jornadas as archived or unavailable, not delete

---

## 27. DRY RUN — U04 CONTRACT

### 27.3 Relation: Professional ↔ Service

| Question | Answer |
|----------|--------|
| U01 aporta: `serviceId` | ✅ Catalog services table (U01 candidate) |
| U02 should aportar: `professionalProfileId` | ✅ Recommended |
| Referencing `professionalProfileId` | ✅ Avoids `Business A Professional ↔ Business B Service` ambiguity |
| If professional changes Business | ⚠️ FK to same-business professional only | ProfessionalProfile has business_id FK |

### 27.4 Avoiding cross-business contamination:
- ProfessionalProfile has `business_id` FK — ensures Professional ↔ Service are within same business
- No cross-business referencing possible at DB level
- U04 eligibility query: `WHERE professional.business_id = service.business_id AND professional.status = 'ACTIVE'`

### 27.5 Recommended U04 contract:
- Service eligibility references `professionalProfileId`
- Same-business constraint enforced by FK
- Inactive professionals → services marked unavailable (not deleted)

---

## 28. DRY RUN — H03 CONTRACT

### 28.1 U03/H03 requirements from U02's ProfessionalProfile:

| H03 Feature | Required from U02 |
|-------------|-------------------|
| Mostrar profesional | `professionalProfileId` + `display_name` + `profile_photo` |
| Filtrar elegibles | `ProfessionalProfile.status = 'ACTIVE'` + `business_id` match |
| Resolver disponibilidad | `ProfessionalActivityPeriods` (started_at/ended_at) |
| Preservar identidad histórica | `revision` tracking, audit events, preserved Profile record even if Staff offboards |

### 28.2 Minimal contract from U02 to H03:
- `professionalProfileId` (UUID, FK → ProfessionalProfiles)
- `professionalStatus` (ACTIVE/INACTIVE flag)
- `businessId` (for tenancy filtering)
- `activityPeriods` (started_at, ended_at for availability windows)

---

## 29. DRY RUN — PROBABLE PERSISTENCE

### 29.1 Alternative comparison:

| Alternative | Schema pattern | Domain ownership | Future U03/U04 | Migration blast radius | Naming clarity |
|-------------|---------------|-----------------|----------------|----------------------|----------------|
| **A**: `team.professional_profiles` | Table in `team` schema | Team domain (employment) | Low (independent) | Low (new table only) | Good — prefix indicates relation |
| **B**: `professional.professional_profiles` | Table in new `professional` schema | Professional domain (identity) | Medium (separate schema) | Medium (new schema + table) | Very clear — own namespace |
| **C**: Extension of `team.staff_members` | Add columns to existing table | Staff domain ( employment) | High (tightly coupled) | High (alters core table) | Poor — mixes concerns |

### 29.2 Recommendation:
**Alternative A** (`team.professional_profiles`) is the preferred starting point because:
- StaffMember already the anchor for professional identity
- Same schema (`team`) maintains consistency with other staff-related tables
- Migration blast radius LOW — new table only, no data alteration
- Naming clarity: `team.professional_profiles` indicates it's staff-adjacent but distinct
- Future U03/U04 impact LOW — can be referenced from any schema via FK to the UUID

**Alternative B** could be considered if professional domain becomes its own bounded context, but that's premature for U02.

### 29.3 SQL prototype (Alternative A):
```sql
CREATE TABLE team.professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business.businesses(id),
  staff_member_id UUID NOT NULL REFERENCES team.staff_members(id),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  display_name TEXT,
  bio TEXT,
  public_title TEXT,
  profile_photo_url TEXT,
  revision BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revision_tracking BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0)
);
```

---

## 30. DRY RUN — LIKELY RELATIONS

### 29.1 Restrictions projected:

| Restriction | Recommendation | Rationale |
|-------------|---------------|-----------|
| One ProfessionalProfile per StaffMember? | ✅ ONE-TO-ONE (1:1) | Natural — each staff has at most one professional identity. FK: `professional_profiles.staff_member_id → staff_members.id` with UNIQUE constraint |
| Business + Staff tenant-safe FK? | ✅ `business_id` on both tables, FK enforced | Ensures professional belongs to same business as staff member |
| Stable ID? | ✅ UUID, never changes | StaffMember ID is the stable anchor; ProfessionalProfile ID is separate |
| Revision? | ✅ Yes, own revision field | Supports concurrency control (Alternative A from section 17) |
| Lifecycle history periods? | ✅ Activity periods (started_at/ended_at) | mirrors `staff_relationship_periods` pattern |
| History preservation? | ✅ Record not deleted when inactivated | Soft-delete via status → INACTIVE, like employment periods |

### 29.2 Key constraint:
```sql
-- One profile per staff member
ALTER TABLE team.professional_profiles
ADD CONSTRAINT one_profile_per_staff UNIQUE (staff_member_id);

-- FK to staff member (must exist)
ALTER TABLE team.professional_profiles
ADD CONSTRAINT prof_staff_fk 
FOREIGN KEY (staff_member_id) REFERENCES team.staff_members(id) ON DELETE RESTRICT;
```

---

## 31. DRY RUN — API/COMMAND SURFACE

### 31.1 Projected Queries:

| Query | Likely authorization | Revision | operationId | audit |
|-------|---------------------|----------|-------------|-------|
| `list professionals` (for business) | `iam.staff.read` + business scope | revision of profile | `professional.list` | ✅ Yes |
| `get professional` (by ID) | `iam.staff.read` + (self check or owner) | profile revision | `professional.get` | ✅ Yes |
| `get own professional profile` | `iam.self.read` (BARBER) | profile revision | `professional.self.get` | ✅ Yes |

### 31.2 Projected Commands:

| Command | Likely authorization | Revision | operationId | audit |
|---------|---------------------|----------|-------------|-------|
| `create/enable professional` | `iam.staff.create` (Owner) OR `iam.self.update` (BARBER for self) | new profile: revision=1 | `professional.create` | ✅ Yes |
| `update professional profile` | `iam.self.update` (self, BARBER) OR `iam.staff.update` (Owner) | profile revision +1 | `professional.update` | ✅ Yes |
| `deactivate` | `iam.access.offboard` (Owner) OR `iam.self.update` (BARBER, if allows self-deactivation) | profile status → INACTIVE | `professional.deactivate` | ✅ Yes |
| `reactivate` | `iam.access.reonboard` (Owner) OR `iam.self.update` (BARBER, if allows self-reactivation) | profile status → ACTIVE | `professional.reactivate` | ✅ Yes |
| `self update allowed fields` | `iam.self.update` (BARBER) — limited fields | profile revision +1 | `professional.self.update` | ✅ Yes |

### 31.3 Authorization details:

**Owner → All professional operations**:
- Has all capabilities (except `iam.security.recover`)
- Can manage any staff's professional profile
- API: `professional.update`, `professional.deactivate`, `professional.reactivate`

**BARBER → Self-profile only**:
- Has `iam.self.read`, `iam.self.update`
- Can only modify their own ProfessionalProfile (staff_member_id match)
- API: `professional.self.get`, `professional.self.update`
- Cannot modify other staff's profiles

**RECEPTIONIST → No professional operations**:
- Only has `catalog.read`, `iam.self.*`, session management
- No professional profile access

### 31.4 OperationId families:
- `professional.create`
- `professional.update`
- `professional.deactivate`
- `professional.reactivate`
- `professional.self.get`
- `professional.self.update`
- `professional.list`

---

## 32. DRY RUN — FRONTEND

### 32.1 Where would ProfessionalProfile functionally belong?

| Option | Location | Owner-editable | Staff-editable | Fit with CURRENT |
|--------|----------|---------------|----------------|-----------------|
| **A**: Within `Equipo` (Team) | `/team` workspace, inside professional subview | ✅ Owner | Limited (Owner manages) | ✅ Adapts to CURRENT — Owner already manages team |
| **B**: Dedicated Professionals view | New route `/professionals` or section in `Más` | ✅ Owner | ✅ Self (BARBER) | ⚠️ New surface, not in current nav |
| **C**: Barber self-profile → `Más` → Perfil | `More` menu → Professional profile | ❌ Owner (indirect) | ✅ Self (via `iam.self.*`) | ✅ Best fit — uses existing self-service pattern |

### 32.2 Recommended frontend layout:

**Option C** is preferred:
- **Owner**: Within `Equipo`, can view/edit all staff professional profiles (via new API endpoints)
- **BARBER self**: `Más` → `Perfil` → professional profile edit screen, uses `iam.self.read`/`iam.self.update`
- **RECEPTIONIST**: No access to professional profiles

### 32.3 Navigation flow:
1. Owner navigates to `Equipo` → sees staff list with professional profile badges/indicators
2. Owner clicks into individual staff → professional profile screen (read/edit)
3. BARBER logs in → `Más` → `Perfil` → own professional profile (read-only or edit per capabilities)
4. Self-service: BARBER can update display_name, bio, title, photo via the profile screen

### 32.4 Important separation:
- **Prototype UI** vs **runtime UI**: No professional profile frontend exists in current runtime. Any UI design must be validated against actual API surfaces, not against prototypes or mocks.

---

## 33. DRY RUN — TEST STRATEGY

### 33.1 Families of tests to study (as minimum):

| Family | Focus | Key scenarios |
|--------|-------|---------------|
| **Tenant isolation** | Each business's professionals isolated by business_id | Query professionals → only same-business results |
| **One profile per Staff** | 1:1 constraint between StaffMember and ProfessionalProfile | Create profile → only one per staff; duplicate attempt fails |
| **Multi-role** | Staff with OWNER+BARBER, etc. | ProfessionalProfile accessible regardless of role combination |
| **Owner also professional** | Case 1 from adversarial — Owner is also a professional profile | Owner has both IAM role and professional profile |
| **Staff inactive** | Staff offboarded but ProfessionalProfile ACTIVE | Professional profile persists despite employment status |
| **Professional inactive** | ProfessionalProfile set to INACTIVE | U03/U04 should filter out inactive professionals |
| **Stale revision** | Revision mismatch on profile update | Same pattern as Staff update (409 error) |
| **Audit** | All profile changes recorded | audit events with action, changes, outcome |
| **History** | Profile status changes over time | Track ACTIVE → INACTIVE → ACTIVE cycles |
| **Cross-hito references** | U02 ↔ U03, U02 ↔ U04 references | professionalProfileId used correctly across hitos |
| **Self vs admin permissions** | BARBER self-update vs Owner admin update | Different capabilities, different scope |

### 33.2 Test strategy (not implementing):
- Use existing test infrastructure (vitest, playwright)
- Build on H01 test patterns (staff.spec.ts, roles.spec.ts, access-lifecycle.spec.ts)
- Add professional profile specific tests as new family
- Maintain idempotency tests for all mutation operations
- Ensure tenant isolation in all professional profile queries

---

## 34. ADVERSARIAL CASES A PROYECTAR

### Case 1: OWNER also professional
- **Current state**: Owner is a StaffMember with role=OWNER. ProfessionalProfile would be linked to this StaffMember.
- **What CURRENT shows**: Owner has all capabilities, can manage all staff including their own professional profile.
- **What U02 should resolve**: Owner's professional profile is just like any other staff member's — same entity, same permissions structure. The `isSelf` check (`sm.id === actor.staffMemberId`) applies.
- **Decision**: ProfessionalProfile for Owner is no different than for any other staff. Self-service primitives (`iam.self.*`) still apply.

### Case 2: BARBER role sin ProfessionalProfile
- **Current state**: BARBER role exists with `iam.self.read`/`iam.self.update`. No professional profile table.
- **What CURRENT shows**: Barber can read/update their own person/Account data, but no professional-specific fields.
- **What U02 should resolve**: Adding ProfessionalProfile enriches the BARBER identity without changing the role. The `iam.self.*` capabilities remain; professional fields are additional.
- **Decision**: BARBER role continues to exist and grant same capabilities. ProfessionalProfile is additive, not replacement.

### Case 3: ProfessionalProfile activo pero Staff termina relación laboral
- **Current lifecycle**: Staff offboards → employment_status → INACTIVE, access_status → REVOKED, period ended_at set.
- **Alternative C (preferred)**: ProfessionalProfile stays ACTIVE/INACTIVE independently. Staff termination does NOT ProfessionalProfile inactivation.
- **What U02 should resolve**: ProfessionalProfile is independent — ex-staff retains historical professional identity. U03/U04 should respect ProfessionalProfile status independently of Staff employment.
- **Decision**: **Alternative C** — Profile stable + ActivityPeriods. Staff offboard ≠ Professional deactivation.

### Case 4: Staff vuelve meses después
- **Current**: Reonboarding creates new relationship period, same StaffMember.id reused.
- **With ProfessionalProfile**: ProfessionalProfile persists across reonboard. Same profile ID, possibly new revision. Activity periods may be recreated.
- **What U02 should resolve**: ProfessionalProfile ID stays the same. The staff member resumes with same professional identity. Activity periods can be continued or new ones created.
- **Decision**: ProfessionalProfile ID is stable across on/offboard cycles.

### Case 5: Professional desactivado mantiene bookings históricos futuros/anteriores
- **This case belongs to U03/U04**, not U02. U02 only creates the ProfessionalProfile entity and ACTIVE/INACTIVE flag.
- **What U02 should NOT do**: Prematurely create `available`/`bookable` flags.
- **Decision**: U02 only owns ProfessionalProfile existence and status. U03 manages Jornada eligibility; U04 manages service eligibility. Professional inactive → services may be marked unavailable but not deleted.

### Case 6: Professional cambia nombre personal
- **Current**: Person.first_name/last_name change via `updateStaff`.
- **With ProfessionalProfile**: Personal name (Person) ≠ Professional display name.
- **What U02 should resolve**: Changes to Person.name do NOT auto-update ProfessionalProfile.display_name. They are separate fields with separate update paths.
- **Decision**: Strict separation. Professional display name is independent of person name.

### Case 7: Professional cambia display name profesional
- **Update path**: `professional.update` command → ProfessionalProfile.display_name → revision +1 → audit event.
- **Authorization**: `iam.self.update` (if BARBER self-editing) or `iam.staff.update` (if Owner editing any).
- **What CURRENT shows**: No such field exists yet. This would be new.
- **Decision**: Add `display_name` to ProfessionalProfile with its own update path, separate from Person name.

### Case 8: Professional pierde BARBER role
- **Current**: Revoking BARBER role removes `iam.self.read`/`iam.self.update` capabilities.
- **With ProfessionalProfile**: ProfessionalProfile remains accessible via Owner capabilities, or via other role that has `professional.read`/`professional.manage` grants.
- **What U02 should resolve**: ProfessionalProfile is NOT tied to BARBER role. Owner can always manage profiles. If BARBER is the only grantee of professional capabilities, adding `professional.read`/`professional.manage` to another role or making them grantable preserves access.
- **Decision**: ProfessionalProfile access should NOT depend solely on BARBER role. Use capability grants that can be assigned to any role, or reserve profile management for Owner.

### Case 9: Professional gana OWNER role
- **Current**: New OWNER gets all capabilities including managing all staff.
- **With ProfessionalProfile**: Owner can manage all professional profiles, including their own (if they're also a staff member).
- **What CURRENT shows**: Owner has unrestricted access to all staff data.
- **Decision**: No conflict. Owner's enhanced capabilities naturally extend to professional profiles.

### Case 10: Dos usuarios editan profile simultáneamente
- **Current pattern**: Revision-based optimistic concurrency. `updateStaff` validates `revision` matches, throws `STALE_REVISION` (409) if not.
- **With ProfessionalProfile**: Same pattern — profile update requires current revision, increments on success.
- **What CURRENT shows**: Concurrency handled at API level via revision checking.
- **Decision**: Reuse same revision pattern for ProfessionalProfile updates.

### Case 11: Professional de Business A referenciado desde Business B
- **Current**: All entities have `business_id` FK. Cross-business FKs are prevented by schema design.
- **With ProfessionalProfile**: ProfessionalProfile has `business_id` FK. Service eligibility (U04) also has `business_id`. Same-business constraint enforced at DB level.
- **What CURRENT shows**: No cross-business patterns exist.
- **Decision**: FK constraints prevent this naturally. No additional logic needed.

### Case 12: Professional sin services U04
- **Current**: No professional → service relationship exists yet.
- **With U02/U04**: ProfessionalProfile can exist without any services assigned. U04 adds eligibility later.
- **What CURRENT shows**: No such relationship.
- **Decision**: ProfessionalProfile is independent of services. A professional can exist without services (add later).

### Case 13: Professional sin schedule U03
- **Same as Case 12**: ProfessionalProfile exists independently of schedules (U03 concern).
- **Decision**: Same — ProfessionalProfile does not require schedules to exist.

---

## 35. BLAST RADIUS

| Area | Impact Level | Justification |
|------|-------------|---------------|
| **DB** | MEDIUM | New `team.professional_profiles` table added. No existing data modified. FK constraints to `staff_members` and `businesses`. |
| **Contracts** | LOW | New Zod schemas for ProfessionalProfile (if added to contracts package). Existing contracts unchanged. |
| **IAM** | LOW | New capabilities (`professional.read`, `professional.manage`) added to enum. No existing capability revoked. |
| **API** | MEDIUM | New endpoints: `professional.create`, `.update`, `.deactivate`, `.reactivate`, `.self.get`, `.self.update`, `.list`. Existing endpoints unchanged. |
| **Team** | LOW | ProfessionalProfile table in team schema. FK to staff_members. No modification to staff_members table. |
| **Account/Profile** | LOW | Self-service flows via `iam.self.*` capabilities. No account structure changes. |
| **Frontend navigation** | LOW | New screens in `/team` and `/more` → `perfil`. Existing navigation unchanged. |
| **U01** | LOW | Reuses shared infrastructure (auth, actor, grants). No entity-level dependency. |
| **U03** | HIGH | U03 consumes `professionalProfileId`, `professionalStatus`, `activityPeriods`. U03 design depends on U02 contract stability. |
| **U04** | HIGH | U04 consumes `professionalProfileId` for service eligibility. Cross-business prevention via FK. |
| **H03** | HIGH | U03/H03 integration points (showing professional, filtering eligibles, resolving availability). |
| **Tests** | MEDIUM | New test families needed (tenant isolation, one-profile-per-staff, multi-role, self vs admin). Existing tests unchanged. |

**Overall blast radius**: **MEDIUM** — New table and API surface, but no existing data or functionality modified. Core H01 infrastructure preserved.

---

## 36. REQUIRED B DECISIONS

| Decision ID | Family | Alternatives | Evidence relevant | Dependencies | What blocks |
|-------------|--------|-------------|------------------|--------------|-------------|
| **D1** | Professional identity boundary | A: ProfProfile linked to StaffMember<br>B: Prof fields on StaffMember<br>C: BARBER role = identity<br>D: Independent Professional entity | D1: Alternative A has lowest blast radius, supports multi-role, matches hypothesis. Evidence: StaffMember is natural anchor (sec 7). D1 blocks: None if Alternative A chosen. | StaffModel, RoleAssignment | Choosing wrong boundary forces rework for U03/U04 |
| **D2** | Professional ↔ Staff cardinality | A: 1:1 (one profile per staff)<br>B: 1:N (one profile per business)<br>C: N:M (multiple profiles per staff) | D2: 1:1 is most coherent with CURRENT. StaffMember already 1:1 with Person. Evidence: Multi-role support needs stable anchor. D2 blocks: If N:M, profile ownership becomes ambiguous. | Multi-role analysis (sec 10) | Ambiguous cardinality → U03/U04 reference errors |
| **D3** | Role BARBER relationship | A: BARBER role + separate ProfProfile<br>B: BARBER ≡ ProfessionalProfile<br>C: BARBER role grants prof capabilities | D3: Alternative A — BARBER role stays as IAM, ProfProfile separate. Evidence: BARBER ≠ ProfProfile (sec 9.6). D3 blocks: Conflating them loses multi-role support. | BARBER audit (sec 9) | Conflation → can't have professional without BARBER role |
| **D4** | Professional lifecycle | A: ACTIVE/INACTIVE independent<br>B: Derive from Staff lifecycle<br>C: Profile stable + ActivityPeriods<br>D: New profile each reactivation | D4: Alternative C preferred. Matches staff_relationship_periods pattern. Evidence: Lifecycle comparison (sec 17). D4 blocks: Choosing B ties professional to employment fate. | Staff lifecycle (sec 11) | Wrong lifecycle → professional lost when staff leaves/returns |
| **D5** | Activity history | A: ProfessionalProfile + ActivityPeriods<br>B: Derive from Staff periods<br>C: Separate history table | D5: Alternative A. Mirrors existing `staff_relationship_periods` pattern. Evidence: Concurrency section (sec 17). D5 blocks: If B, professional history lost when staff offboards. | Lifecycle decision (D4) | History mechanism not aligned with lifecycle choice |
| **D6** | Profile fields | A: display_name, bio, title, photo (professional)<br>B: All fields on Person<br>C: Minimal set only | D6: Alternative A. Comparison table in sec 23. D6 blocks: Adding personal fields to prof creates confusion. | Person data audit (sec 8) | Field boundary violations → duplicated data |
| **D7** | Admin vs self-edit ownership | A: `iam.self.*` for self, Owner manages all<br>B: Separate capabilities per operation<brC: Role-based (BARBER manages all) | D7: Alternative A. Current pattern is `iam.self.read/update` for self, Owner has all. Evidence: Self-service auth (sec 16). D7 blocks: If C, BARBER can edit others' profiles — security risk. | Authorization audit (sec 15) | Ownership model → permission escalation |
| **D8** | Authorization | A: Add `professional.read`/`professional.manage` capabilities<br>B: Reuse `iam.self.*` only<br>C: Role-based grants only | D8: Alternative A. Clean boundary, reusable grants. Evidence: Auth section (sec 15). D8 blocks: If B, professional/personal boundary blurs. | Capability enum (sec 15) | Authorization model → missing capabilities or over-privileged |
| **D9** | Revision boundary | A: Own revision on ProfProfile<br>B: Reuse Staff revision<br>C: No revision (use updatedAt only) | D9: Alternative A. Independent concurrency. Evidence: Concurrency section (sec 17). D9 blocks: If B, prof changes coupled with staff changes. | Revision comparison (sec 17) | Revision coupling → concurrent update conflicts |
| **D10** | U03 contract | A: `professionalProfileId` + `professionalStatus` + `activityPeriods`<br>B: `staffMemberId` only<br>C: Both IDs | D10: Alternative A. Professional anchor is more precise. Evidence: U03 projection (sec 26). D10 blocks: If B, scheduling tied to employment status. | U03 projection (sec 26) | Contract choice → U03 filters incorrect or too restrictive |
| **D11** | U04 contract | A: `professionalProfileId` + same-business FK<br>B: `serviceId` only<br>C: Both + business match | D11: Alternative A. Prevents cross-business ambiguity. Evidence: U04 projection (sec 27). D11 blocks: If B, no professional anchoring, business ambiguity. | U04 projection (sec 27) | Contract choice → cross-business service eligibility bugs |
| **D12** | H03 contract | A: `professionalProfileId`, `professionalStatus`, `activityPeriods`<br>B: `staffMemberId` + employment status<br>C: Both | D12: Alternative A. Enables proper filtering. Evidence: H03 projection (sec 28). D12 blocks: If B, H03 can't filter by professional active status. | H03 projection (sec 28) | Contract choice → availability/showing errors |
| **D13** | Persistence/schema ownership | A: `team.professional_profiles` (team schema)<br>B: `professional.professional_profiles` (new schema)<br>C: Extension of staff_members | D13: Alternative A. Lowest blast radius, consistent with existing patterns. Evidence: Persistence section (sec 29). D13 blocks: If B or C, schema migration more complex, higher risk. | Schema analysis (sec 29) | Schema choice → harder future migrations, tighter coupling |

---

## 37. LOW-RISK IMPLEMENTATION CHOICES

Decisions B does NOT need to close (delegable, can be decided later):

- Helper names for profile API routes
- File names for new migration/scripts
- Pagination encoding on professional list responses
- Minor component decomposition in frontend
- Exact Zod schema field order (minor)
- Color/spacing tokens for profile UI
- Optional field defaults (can be null/undefined)
- Non-critical UI polishing for initial spec

**These are delegable details** that can be decided during implementation without affecting the core architectural decisions. The dry run should focus on D1–D13 decisions only.

---

## 38. CURRENT RISKS

| Severity | Risk | Description | Mitigation |
|----------|------|-------------|------------|
| **CRITICAL** | Conflating BARBER IAM role with ProfessionalProfile identity | If U02 assumes BARBER role ≡ ProfessionalProfile, loses multi-role support and ties professional identity to IAM authorization which can be revoked independently. | Explicitly separate BARBER role (IAM) from ProfessionalProfile (identity). Use capability grants for professional operations. |
| **HIGH** | Tying ProfessionalProfile lifecycle to Staff employment status | If professional deactivates when staff offboards, loses historical professional identity. Ex-staff can't maintain profile, alumni networks broken. | Choose Alternative C (Profile stable + ActivityPeriods). ProfessionalProfile independent of employment. |
| **HIGH** | Prematurely creating `available`/`bookable` flags in U02 | These belong to U03/U04. Creating them in U02 creates false constraints and limits future flexibility. | U02 ONLY: ProfessionalProfile existence + active status + fields. No availability/bookability. |
| **MEDIUM** | Revision coupling between Staff and ProfessionalProfile | If ProfessionalProfile reuses Staff revision, concurrent profile updates conflict with staff changes (or vice versa). | Give ProfessionalProfile own revision field (Alternative A from sec 17). |
| **MEDIUM** | Owner also professional (Case 1) creating permission ambiguity | Owner has all capabilities. If Owner is also a professional staff, self-vs-admin boundary may be unclear. | Decision D7: `iam.self.*` for self, Owner manages all. Clear separation of self vs admin operations. |
| **MEDIUM** | No existing avatar/media infrastructure | U02 may need professional photos. Assuming absence or premature implementation. | Plan for infrastructure in U02 design, but don't implement yet. Mark as `ABSENT` (sec 14) and add later. |
| **LOW** | Frontend prototype vs runtime mismatch | UI may prototype professional profiles that don't match actual API. | Validate all UI decisions against actual API surfaces (app.ts routes), not against prototypes. |
| **LOW** | U01 candidate dependency becoming hard constraint | U01 not yet accepted. If U02 waits too long, integration becomes harder. | U02 depends only on shared infrastructure (auth, actor, grants), not U01 entity decisions. Can specify independently. |

**Priority ordering**: CRITICAL risks must be addressed first, then HIGH, then MEDIUM. LOW risks can be deferred or decided during implementation.

---

## 39. UNVERIFIED ITEMS

All items marked `UNVERIFIED` — not demonstrated in runtime, only inferred or from prototypes:

| Item | Status | Source |
|------|--------|--------|
| Barber UI (professional profile screen) | ⚠️ UNVERIFIED | Only `AppShell.tsx` and team navigation exist in runtime; no professional profile screen. May be in prototypes/artifacts. |
| Photo/storage infrastructure | ⚠️ UNVERIFIED | No Supabase Storage references, no avatar fields, no upload helpers in current codebase. |
| Lifecycle behavior when professional deactivated | ⚠️ UNVERIFIED | No code exists yet; pattern inferred from staff_relationship_periods and lifecycle alternatives evaluation. |
| U01 candidate dependencies (material) | ⚠️ UNVERIFIED | Only shared infrastructure confirmed (auth, actor, grants). No entity-level dependencies verified. |
| NVDA accessibility certification | ⚠️ UNVERIFIED | H01 has `FINAL_NVDA_CHECKLIST.md` as pending manual validation. Not relevant to U02 but noted. |
| prototype vs runtime for profile surfaces | ⚠️ UNVERIFIED | Web app has components/features directories but actual API surface is in apps/api. Prototype may differ. |
| Cross-business professional reference behavior | ⚠️ UNVERIFIED | No data or code exists; pattern inferred from business_id FK design on all existing entities. |
| Exact revision behavior for new ProfessionalProfile | ⚠️ UNVERIFIED | Inferred from staff_members pattern, not yet implemented. |
| Self-profile edit limitations (what BARBER can/can't change) | ⚠️ UNVERIFIED | Based on `iam.self.*` capabilities but exact field-level permissions not codified. |
| U02 timeline relative to U01 acceptance | ⚠️ UNVERIFIED | H01 certification status affects when U02 can be formally started. |

**Important**: All unverified items must be flagged and not assumed as architectural decisions. They should be validated before committing to any implementation.

---

## 40. EVIDENCE INDEX

| Claim | File | Symbol / lines | Classification |
|-------|------|---------------|----------------|
| StaffMember.id is stable UUID identity | apps/api/src/modules/team/service.ts | Lines 15-17 (listStaff query), 30-34 (getStaff) | CURRENT |
| employment_status lifecycle: ONBOARDING/ACTIVE/INACTIVE | apps/api/src/modules/team/service.ts | Line 108 (lifecycle function) | CURRENT |
| BARBER role capabilities: `iam.self.read` + `iam.self.update` | packages/contracts/src/index.ts | Lines 55-58 (roleCapabilities) | CURRENT |
| Role max 3 per staff member | packages/contracts/src/index.ts | Line 38 (createStaffSchema.roles.max(3)) | CURRENT |
| No professional profile entity exists yet | packages/database/src/schema.ts | Not found (tables: persons, staff_members, role_assignments, etc.) | GAP — U02 will create |
| `professional` string not in active runtime | Database collision search (sec 20) | Not found in DB/contracts/API | UNVERIFIED (prototype possible) |
| `professional_profile` not in DB | Database collision search (sec 20) | Not found | UNVERIFIED (will be created by U02) |
| `barber` is active IAM role | Role audit (sec 9) | `role_assignments.role = 'BARBER'` | CURRENT |
| `iam.self.read` enables self-read | Authorization service (sec 16) | `actor.capabilities.has("iam.self.read")` | CURRENT |
| `iam.self.update` enables self-update | Authorization service (sec 16) | `actor.capabilities.has("iam.self.update")` | CURRENT |
| Revision increment pattern: `revision+1` | apps/api/src/modules/team/service.ts | Lines 66, 68, 111 (updateStaff, updateStaff, lifecycle) | CURRENT |
| `staff_relationship_periods` tracks hire/fire periods | apps/api/src/modules/team/service.ts | Line 44 (create), 109 (offboard ended_at) | CURRENT |
| New table `team.professional_profiles` proposed | This audit report | Section 29, Alternative A | DRY-RUN proposal |
| `professional.read`/`professional.manage` capabilities proposed | This audit report | Section 15, Alternative A | DRY-RUN proposal |
| One-to-one StaffProfessionalProfile | This audit report | Section 30, likely relations | DRY-RUN proposal |
| U02 depends only on shared infra, not U01 entities | Section 21 | — | DRY-RUN conclusion |

---

## 41. FINAL RECOMMENDATION

## `SAFE_WITH_CONSTRAINTS`

**Verdict**: Current infrastructure supports U02 specification with concrete constraints.

### Why not `SAFE_TO_CONTINUE_SPECIFY`?
The current evidence is sufficient to begin specifying U02, but there are concrete constraints that must be addressed in the decision register (D1-D13). The `SAFE_TO_CONTINUE_SPECIFY` rating would imply no constraints, which is false — the boundary decisions (especially D1, D2, D4) are critical.

### Why not `INSUFFICIENT_CURRENT_EVIDENCE`?
Sufficient evidence exists across the codebase (DB schema, API contracts, authorization infrastructure, test patterns). The professional profile entity does not collide with any existing runtime entity. However, the boundary decisions require careful specification.

### Why not `WAIT_FOR_U01_ACCEPTANCE`?
U02 depends only on shared infrastructure (AuthorizationService, Actor context, capability grants, audit events, revision pattern) — none of which require U01 to be formally accepted first. U01 candidate introduces catalog infrastructure but no professional profile entities or conflicts. U02 can be specified independently.

### Concrete constraints (from decision register):
1. **D1**: Professional identity must be linked to StaffMember, not BARBER role or Person
2. **D2**: 1:1 cardinality between StaffMember and ProfessionalProfile (one profile per staff)
3. **D4**: Professional lifecycle independent of Staff employment (Alternative C: Profile stable + ActivityPeriods)
4. **D6**: Profile fields are professional display_name, bio, public_title, profile_photo — NOT on Person
5. **D8**: Authorization uses `professional.read`/`professional.manage` capabilities granted via `iam.capability_grants`, NOT conflating with `iam.self.*`
6. **D10**: U03 consumes `professionalProfileId` + `professionalStatus` + `activityPeriods`
7. **D11**: U04 consumes `professionalProfileId` with same-business FK constraint
8. **D13**: Persistence in `team.professional_profiles` table (new table, low blast radius)

### Recommended next step:
Proceed to `H02.U02 — SPECIFY` with the decision register (D1-D13) as the anchoring framework. The current CURRENT + U01 CANDIDATE CURRENT provides sufficient foundation, with the above constraints explicitly documented and addressed in the specification.

**Final recommendation**: `SAFE_WITH_CONSTRAINTS` — specify U02 with the decision register closed, recognizing the concrete constraints but not blocking progress.

---