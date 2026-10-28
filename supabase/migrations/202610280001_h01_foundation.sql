create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists business;
create schema if not exists iam;
create schema if not exists team;
create schema if not exists system;

create type business.business_status as enum ('PROVISIONED','ACTIVE','SUSPENDED');
create type iam.account_status as enum ('PENDING','ACTIVE','LOCKED','RECOVERY','DISABLED');
create type iam.invitation_status as enum ('PENDING','ACCEPTED','REVOKED','EXPIRED','SUPERSEDED');
create type iam.delivery_status as enum ('QUEUED','SENDING','SENT','FAILED');
create type iam.role_code as enum ('OWNER','RECEPTIONIST','BARBER');
create type iam.access_status as enum ('PENDING_ACTIVATION','ACTIVE','SUSPENDED','REVOKED');
create type team.employment_status as enum ('ONBOARDING','ACTIVE','INACTIVE');
create type system.operation_status as enum ('STARTED','SUCCEEDED','FAILED','UNKNOWN');

create table business.businesses (
  id uuid primary key default gen_random_uuid(),
  provisioning_key text not null unique,
  display_name text not null,
  timezone text not null,
  status business.business_status not null default 'PROVISIONED',
  version bigint not null default 1 check (version > 0),
  authorization_revision bigint not null default 1 check (authorization_revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table iam.persons (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table iam.user_accounts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references iam.persons(id),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  verified_email citext unique,
  status iam.account_status not null default 'PENDING',
  security_revision bigint not null default 1,
  credentials_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table team.staff_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business.businesses(id),
  person_id uuid not null references iam.persons(id),
  employment_status team.employment_status not null default 'ONBOARDING',
  access_status iam.access_status not null default 'PENDING_ACTIVATION',
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, person_id),
  unique (business_id, id)
);

create table team.staff_relationship_periods (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  staff_member_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_reason text,
  created_at timestamptz not null default now(),
  foreign key (business_id, staff_member_id) references team.staff_members(business_id, id),
  check (ended_at is null or ended_at >= started_at)
);
create unique index one_open_staff_period on team.staff_relationship_periods(staff_member_id) where ended_at is null;

create table iam.account_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  staff_member_id uuid not null,
  email citext not null,
  token_hash text not null unique,
  status iam.invitation_status not null default 'PENDING',
  delivery_status iam.delivery_status not null default 'QUEUED',
  expires_at timestamptz not null,
  accepted_by_account_id uuid references iam.user_accounts(id),
  accepted_at timestamptz,
  revoked_at timestamptz,
  supersedes_id uuid references iam.account_invitations(id),
  delivery_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, staff_member_id) references team.staff_members(business_id, id)
);
create unique index one_pending_invitation_per_staff on iam.account_invitations(staff_member_id) where status = 'PENDING';

create table iam.role_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  staff_member_id uuid not null,
  role iam.role_code not null,
  effective_at timestamptz,
  revoked_at timestamptz,
  assigned_by_account_id uuid references iam.user_accounts(id),
  revoked_by_account_id uuid references iam.user_accounts(id),
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  foreign key (business_id, staff_member_id) references team.staff_members(business_id, id)
);
create unique index one_active_staff_role on iam.role_assignments(staff_member_id, role) where revoked_at is null;
create index active_owner_lookup on iam.role_assignments(business_id) where role = 'OWNER' and revoked_at is null and effective_at is not null;

create table iam.capability_grants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  staff_member_id uuid not null,
  role_assignment_id uuid not null references iam.role_assignments(id),
  capability text not null,
  scope jsonb not null default '{"type":"BUSINESS"}'::jsonb,
  granted_by_account_id uuid not null references iam.user_accounts(id),
  valid_from timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by_account_id uuid references iam.user_accounts(id),
  created_at timestamptz not null default now(),
  foreign key (business_id, staff_member_id) references team.staff_members(business_id, id),
  check (expires_at is null or expires_at > valid_from)
);
create unique index one_active_capability_grant on iam.capability_grants(role_assignment_id, capability) where revoked_at is null;

create table iam.access_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references iam.user_accounts(id),
  business_id uuid not null references business.businesses(id),
  staff_member_id uuid not null references team.staff_members(id),
  active_role_assignment_id uuid references iam.role_assignments(id),
  context_revision bigint not null default 0,
  auth_session_id text,
  user_agent_hash text,
  ip_hash text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_reason text
);
create index active_sessions_by_account on iam.access_sessions(account_id) where revoked_at is null;

create table iam.staff_role_states (
  business_id uuid not null,
  staff_member_id uuid not null,
  authorization_revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  primary key (business_id, staff_member_id),
  foreign key (business_id, staff_member_id) references team.staff_members(business_id, id)
);

create table iam.user_context_preferences (
  account_id uuid not null references iam.user_accounts(id),
  business_id uuid not null references business.businesses(id),
  role_assignment_id uuid not null references iam.role_assignments(id),
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  primary key (account_id, business_id)
);

create table iam.account_security_states (
  account_id uuid primary key references iam.user_accounts(id),
  compromised_at timestamptz,
  recovery_required boolean not null default false,
  sessions_valid_after timestamptz not null default '-infinity',
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);

create table iam.credential_operations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references iam.user_accounts(id),
  kind text not null check (kind in ('PASSWORD_RESET','PASSWORD_CHANGE','EMAIL_CHANGE','COMPROMISE_RECOVERY')),
  status system.operation_status not null default 'STARTED',
  external_reference_hash text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  result_code text
);

create table iam.account_recovery_cases (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references iam.user_accounts(id),
  business_id uuid not null references business.businesses(id),
  authorized_operator text not null,
  authorization_reference text not null,
  evidence_references jsonb not null,
  reason text not null,
  status text not null check (status in ('OPEN','APPROVED','REJECTED','COMPLETED')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table system.operation_attempts (
  operation_id uuid primary key,
  business_id uuid references business.businesses(id),
  actor_account_id uuid references iam.user_accounts(id),
  command_name text not null,
  request_hash text not null,
  status system.operation_status not null default 'STARTED',
  response_status integer,
  response_body jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table system.audit_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references business.businesses(id),
  actor_account_id uuid references iam.user_accounts(id),
  operation_id uuid references system.operation_attempts(operation_id),
  action text not null,
  capability text,
  scope jsonb,
  resource_type text not null,
  resource_id uuid,
  outcome text not null check (outcome in ('SUCCEEDED','DENIED','FAILED','UNKNOWN')),
  changes jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index audit_business_time on system.audit_events(business_id, occurred_at desc);

create or replace function iam.valid_owner_count(target_business uuid)
returns bigint language sql stable security definer set search_path = '' as $$
  select count(*) from iam.role_assignments ra
  join team.staff_members sm on sm.id = ra.staff_member_id and sm.business_id = ra.business_id
  join iam.user_accounts ua on ua.person_id = sm.person_id
  where ra.business_id = target_business and ra.role = 'OWNER' and ra.revoked_at is null
    and ra.effective_at is not null and sm.employment_status = 'ACTIVE'
    and sm.access_status = 'ACTIVE' and ua.status = 'ACTIVE' and ua.auth_user_id is not null
$$;

revoke all on schema business, iam, team, system from anon, authenticated;
revoke all on all tables in schema business, iam, team, system from anon, authenticated;
grant usage on schema business, iam, team, system to service_role;
grant all on all tables in schema business, iam, team, system to service_role;

alter table business.businesses enable row level security;
alter table iam.persons enable row level security;
alter table iam.user_accounts enable row level security;
alter table team.staff_members enable row level security;
alter table team.staff_relationship_periods enable row level security;
alter table iam.account_invitations enable row level security;
alter table iam.role_assignments enable row level security;
alter table iam.capability_grants enable row level security;
alter table iam.access_sessions enable row level security;
alter table iam.staff_role_states enable row level security;
alter table iam.user_context_preferences enable row level security;
alter table iam.account_security_states enable row level security;
alter table iam.credential_operations enable row level security;
alter table iam.account_recovery_cases enable row level security;
alter table system.operation_attempts enable row level security;
alter table system.audit_events enable row level security;
