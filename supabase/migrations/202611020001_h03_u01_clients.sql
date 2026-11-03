-- H03.U01 Clientes y CRM · esquema `clients` aislado por Business.
-- Tablas: client_profiles, client_contacts, client_notes, client_account_links.
-- FKs tenant-safe (composite business_id + id sobre client_profiles).
-- RLS habilitado; acceso solo vía backend autorizado.

create schema if not exists clients;

create table clients.client_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  name text not null,
  first_name text,
  last_name text,
  lifecycle_state text not null default 'active',
  revision bigint not null default 1,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_profiles_business_id_key unique (business_id, id),
  constraint client_profiles_business_fk foreign key (business_id)
    references business.businesses(id) on delete restrict,
  constraint client_profiles_name_check check (length(trim(name)) > 0),
  constraint client_profiles_lifecycle_check check (lifecycle_state in ('active','archived')),
  constraint client_profiles_revision_check check (revision >= 1)
);

create table clients.client_contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  client_profile_id uuid not null,
  type text not null,
  value text not null,
  normalized_value text not null,
  label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_contacts_unique_exact_key unique (business_id, client_profile_id, type, normalized_value),
  constraint client_contacts_profile_fk foreign key (business_id, client_profile_id)
    references clients.client_profiles(business_id, id) on delete cascade,
  constraint client_contacts_type_check check (type in ('telefono','email','whatsapp'))
);
create index client_contacts_search_idx
  on clients.client_contacts(business_id, normalized_value);

create table clients.client_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  client_profile_id uuid not null,
  text text not null,
  author_id uuid not null,
  author_name text not null,
  created_at timestamptz not null default now(),
  replaces_note_id uuid,
  constraint client_notes_profile_fk foreign key (business_id, client_profile_id)
    references clients.client_profiles(business_id, id) on delete cascade,
  constraint client_notes_replaces_fk foreign key (replaces_note_id)
    references clients.client_notes(id) on delete set null,
  constraint client_notes_text_check check (length(trim(text)) > 0)
);

create table clients.client_account_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  client_profile_id uuid not null,
  account_id uuid not null,
  auth_method text not null,
  evidence_reference text not null,
  authority_id uuid not null,
  authority_name text not null,
  linked_at timestamptz not null default now(),
  revoked_at timestamptz,
  audit_reference text not null,
  constraint client_account_links_unique_key unique (business_id, client_profile_id, account_id),
  constraint client_account_links_profile_fk foreign key (business_id, client_profile_id)
    references clients.client_profiles(business_id, id) on delete cascade,
  constraint client_account_links_account_fk foreign key (account_id)
    references iam.user_accounts(id) on delete restrict,
  constraint client_account_links_authority_fk foreign key (authority_id)
    references iam.user_accounts(id) on delete restrict,
  constraint client_account_links_auth_method_check check (auth_method in ('staff-verified','document','pending-u02'))
);

alter table clients.client_profiles enable row level security;
alter table clients.client_contacts enable row level security;
alter table clients.client_notes enable row level security;
alter table clients.client_account_links enable row level security;

-- Acceso solo vía service_role (backend autorizado). Nunca expuesto a anon/authenticated.
revoke all on schema clients from anon, authenticated;
revoke all on all tables in schema clients from anon, authenticated;
grant usage on schema clients to service_role;
grant all on all tables in schema clients to service_role;
