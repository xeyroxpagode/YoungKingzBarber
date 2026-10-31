-- Development/manual-QA seed. Never apply this file to a linked or production database.
-- It is intentionally outside migrations and outside Supabase's automatic seed path.
-- The guarded `pnpm db:reset` wrapper is its only entry point and targets 127.0.0.1:55322.

begin;

select pg_advisory_xact_lock(hashtext('youngkingz-local-qa-seed-v1'));

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '30000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'owner@youngkingz.local',
    crypt('YoungKingZ-Owner-2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Olivia","last_name":"Owner"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '30000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'receptionist@youngkingz.local',
    crypt('YoungKingZ-Reception-2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Renata","last_name":"Reception"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '30000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'barber@youngkingz.local',
    crypt('YoungKingZ-Barber-2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Bruno","last_name":"Barber"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '31000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '{"sub":"30000000-0000-4000-8000-000000000001","email":"owner@youngkingz.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    '{"sub":"30000000-0000-4000-8000-000000000002","email":"receptionist@youngkingz.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '31000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    '{"sub":"30000000-0000-4000-8000-000000000003","email":"barber@youngkingz.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  );

insert into business.businesses (
  id,
  provisioning_key,
  display_name,
  timezone,
  status
)
values (
  '10000000-0000-4000-8000-000000000001',
  'young-kingz-dev-local-v1',
  'Young KingZ Dev',
  'America/Argentina/Buenos_Aires',
  'ACTIVE'
);

insert into iam.persons (id, first_name, last_name, phone)
values
  ('20000000-0000-4000-8000-000000000001', 'Olivia', 'Owner', '+5491100000001'),
  ('20000000-0000-4000-8000-000000000002', 'Renata', 'Reception', '+5491100000002'),
  ('20000000-0000-4000-8000-000000000003', 'Bruno', 'Barber', '+5491100000003');

insert into iam.user_accounts (
  id,
  person_id,
  auth_user_id,
  verified_email,
  status,
  credentials_changed_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'owner@youngkingz.local',
    'ACTIVE',
    now()
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    'receptionist@youngkingz.local',
    'ACTIVE',
    now()
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    'barber@youngkingz.local',
    'ACTIVE',
    now()
  );

insert into team.staff_members (
  id,
  business_id,
  person_id,
  employment_status,
  access_status
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'ACTIVE',
    'ACTIVE'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'ACTIVE',
    'ACTIVE'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    'ACTIVE',
    'ACTIVE'
  );

insert into team.staff_relationship_periods (id, business_id, staff_member_id)
values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000003');

insert into iam.staff_role_states (business_id, staff_member_id)
values
  ('10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000003');

insert into iam.role_assignments (
  id,
  business_id,
  staff_member_id,
  role,
  effective_at,
  assigned_by_account_id
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'OWNER',
    now(),
    '40000000-0000-4000-8000-000000000001'
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000002',
    'RECEPTIONIST',
    now(),
    '40000000-0000-4000-8000-000000000001'
  ),
  (
    '70000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000003',
    'BARBER',
    now(),
    '40000000-0000-4000-8000-000000000001'
  );

insert into iam.account_security_states (account_id)
values
  ('40000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000002'),
  ('40000000-0000-4000-8000-000000000003');

insert into iam.account_invitations (
  id,
  business_id,
  staff_member_id,
  email,
  token_hash,
  status,
  delivery_status,
  expires_at,
  accepted_by_account_id,
  accepted_at
)
values
  (
    '80000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'owner@youngkingz.local',
    encode(digest('youngkingz-dev-owner-accepted', 'sha256'), 'hex'),
    'ACCEPTED',
    'SENT',
    now() + interval '365 days',
    '40000000-0000-4000-8000-000000000001',
    now()
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000002',
    'receptionist@youngkingz.local',
    encode(digest('youngkingz-dev-receptionist-accepted', 'sha256'), 'hex'),
    'ACCEPTED',
    'SENT',
    now() + interval '365 days',
    '40000000-0000-4000-8000-000000000002',
    now()
  ),
  (
    '80000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000003',
    'barber@youngkingz.local',
    encode(digest('youngkingz-dev-barber-accepted', 'sha256'), 'hex'),
    'ACCEPTED',
    'SENT',
    now() + interval '365 days',
    '40000000-0000-4000-8000-000000000003',
    now()
  );

-- U01: one active category and one published service with immutable commercial terms.
insert into catalog.service_categories (id, business_id, name)
values (
  'a0000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Cortes'
);

insert into catalog.services (
  id,
  business_id,
  name,
  description,
  category_id,
  lifecycle,
  publication
)
values (
  'b0000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Corte clásico',
  'Fixture local para recorrer publicación, versionado y archivo del catálogo.',
  'a0000000-0000-4000-8000-000000000001',
  'ACTIVE',
  'PUBLISHED'
);

insert into catalog.service_terms_versions (
  id,
  business_id,
  service_id,
  version_number,
  price_minor,
  currency,
  duration_minutes,
  pre_buffer_minutes,
  post_buffer_minutes,
  conditions
)
values (
  'c0000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  1,
  2500000,
  'ARS',
  45,
  5,
  5,
  'Incluye lavado y terminación.'
);

update catalog.services
set current_terms_version_id = 'c0000000-0000-4000-8000-000000000001'
where id = 'b0000000-0000-4000-8000-000000000001';

-- U02: Receptionist has an ACTIVE profile; Barber deliberately has none.
insert into team.professional_profiles (
  id,
  business_id,
  staff_member_id,
  status,
  professional_display_name,
  bio,
  public_title
)
values (
  '90000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000002',
  'ACTIVE',
  'Renata Reception',
  'Perfil de QA local para recorrer consulta, edición y ciclo de vida profesional.',
  'Atención y experiencia del cliente'
);

commit;
