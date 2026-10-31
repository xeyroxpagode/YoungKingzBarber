create type team.professional_status as enum ('ACTIVE','INACTIVE');

create table team.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  staff_member_id uuid not null,
  status team.professional_status not null default 'ACTIVE',
  professional_display_name text,
  bio text,
  public_title text,
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_profiles_staff_member_key unique (staff_member_id),
  constraint professional_profiles_business_id_key unique (business_id,id),
  constraint professional_profiles_staff_fk foreign key (business_id,staff_member_id)
    references team.staff_members(business_id,id) on delete restrict,
  constraint professional_display_name_length check (professional_display_name is null or (length(professional_display_name) between 1 and 80 and professional_display_name=trim(professional_display_name))),
  constraint professional_bio_length check (bio is null or (length(bio) between 1 and 500 and bio=trim(bio))),
  constraint professional_public_title_length check (public_title is null or (length(public_title) between 1 and 80 and public_title=trim(public_title)))
);

create index professional_profiles_business_status_idx
  on team.professional_profiles(business_id,status,created_at desc,id desc);

alter table team.professional_profiles enable row level security;
