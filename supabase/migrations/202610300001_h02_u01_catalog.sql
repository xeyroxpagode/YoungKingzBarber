create schema if not exists catalog;

create type catalog.lifecycle as enum ('ACTIVE','ARCHIVED');
create type catalog.publication as enum ('UNPUBLISHED','PUBLISHED');

create table catalog.service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business.businesses(id),
  name text not null check (length(trim(name)) between 1 and 80),
  lifecycle catalog.lifecycle not null default 'ACTIVE',
  revision bigint not null default 1 check (revision > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id,id)
);
create unique index catalog_active_category_name
  on catalog.service_categories(business_id,lower(trim(name))) where lifecycle='ACTIVE';
create index catalog_categories_business_created
  on catalog.service_categories(business_id,created_at desc,id desc);

create table catalog.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business.businesses(id),
  name text not null check (length(trim(name)) between 1 and 120),
  description text check (description is null or length(description) <= 2000),
  category_id uuid,
  current_terms_version_id uuid,
  lifecycle catalog.lifecycle not null default 'ACTIVE',
  publication catalog.publication not null default 'UNPUBLISHED',
  revision bigint not null default 1 check (revision > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id,id),
  constraint catalog_service_category_fk foreign key (business_id,category_id)
    references catalog.service_categories(business_id,id),
  check (lifecycle <> 'ARCHIVED' or publication = 'UNPUBLISHED'),
  check ((lifecycle = 'ARCHIVED') = (archived_at is not null))
);
create index catalog_services_list
  on catalog.services(business_id,created_at desc,id desc);
create index catalog_services_category
  on catalog.services(business_id,category_id,publication,lifecycle);

create table catalog.service_terms_versions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  service_id uuid not null,
  version_number bigint not null check (version_number > 0),
  price_minor bigint not null check (price_minor >= 0),
  currency text not null check (currency = 'ARS'),
  duration_minutes integer not null check (duration_minutes > 0),
  pre_buffer_minutes integer not null default 0 check (pre_buffer_minutes >= 0),
  post_buffer_minutes integer not null default 0 check (post_buffer_minutes >= 0),
  conditions text check (conditions is null or length(conditions) <= 2000),
  effective_from timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint catalog_terms_service_fk foreign key (business_id,service_id)
    references catalog.services(business_id,id),
  unique (business_id,service_id,version_number),
  unique (business_id,service_id,id)
);
create index catalog_terms_history
  on catalog.service_terms_versions(business_id,service_id,version_number desc);

create function catalog.reject_terms_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Commercial Terms versions are immutable' using errcode = '55000';
end;
$$;
create trigger catalog_terms_immutable
  before update on catalog.service_terms_versions
  for each row execute function catalog.reject_terms_update();

alter table catalog.services add constraint catalog_service_current_terms_fk
  foreign key (business_id,id,current_terms_version_id)
  references catalog.service_terms_versions(business_id,service_id,id);

revoke all on schema catalog from anon, authenticated;
revoke all on all tables in schema catalog from anon, authenticated;
grant usage on schema catalog to service_role;
grant all on all tables in schema catalog to service_role;

alter table catalog.service_categories enable row level security;
alter table catalog.services enable row level security;
alter table catalog.service_terms_versions enable row level security;
