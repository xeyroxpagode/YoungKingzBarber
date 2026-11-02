-- H02.U03 weekly schedules owned by StaffMember (U03 §5, §15).
-- Time is stored as local minutes-of-day (no timestamps, no UTC weekly data,
-- U03 §13). Business.timezone is interpreted by the application (U03 §27).

create table team.staff_weekly_schedules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  staff_member_id uuid not null,
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_weekly_schedules_staff_member_key unique (staff_member_id),
  constraint staff_weekly_schedules_business_id_key unique (business_id, id),
  constraint staff_weekly_schedules_staff_fk foreign key (business_id, staff_member_id)
    references team.staff_members(business_id, id) on delete restrict
);

create table team.staff_schedule_intervals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  weekly_schedule_id uuid not null,
  weekday integer not null check (weekday between 1 and 7),
  start_minute integer not null check (start_minute >= 0 and start_minute <= 1439),
  end_minute integer not null check (end_minute >= 1 and end_minute <= 1440),
  check (start_minute < end_minute),
  constraint staff_schedule_intervals_business_id_key unique (business_id, id),
  constraint staff_schedule_intervals_schedule_fk foreign key (business_id, weekly_schedule_id)
    references team.staff_weekly_schedules(business_id, id) on delete cascade
);

create index staff_schedule_intervals_lookup_idx
  on team.staff_schedule_intervals(business_id, weekly_schedule_id, weekday);

alter table team.staff_weekly_schedules enable row level security;
alter table team.staff_schedule_intervals enable row level security;
