-- H02.U04 Staff <-> Service capability assignment (U04 §11-15).
-- Aggregate: StaffMember -> StaffServiceSet -> 0..N StaffServiceAssignment -> Service.
-- Tenant-safe composite FKs mirror the U02/U03 pattern (business_id + id).

create table team.staff_service_sets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  staff_member_id uuid not null,
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_service_sets_business_staff_key unique (business_id, staff_member_id),
  constraint staff_service_sets_business_id_key unique (business_id, id),
  constraint staff_service_sets_staff_fk foreign key (business_id, staff_member_id)
    references team.staff_members(business_id, id) on delete restrict
);

create table team.staff_service_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  staff_service_set_id uuid not null,
  service_id uuid not null,
  created_at timestamptz not null default now(),
  constraint staff_service_assignments_business_set_service_key unique (business_id, staff_service_set_id, service_id),
  constraint staff_service_assignments_set_fk foreign key (business_id, staff_service_set_id)
    references team.staff_service_sets(business_id, id) on delete cascade,
  constraint staff_service_assignments_service_fk foreign key (business_id, service_id)
    references catalog.services(business_id, id) on delete restrict
);

create index staff_service_assignments_lookup_idx
  on team.staff_service_assignments(business_id, staff_service_set_id, service_id);

alter table team.staff_service_sets enable row level security;
alter table team.staff_service_assignments enable row level security;
