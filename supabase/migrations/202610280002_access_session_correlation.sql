-- H01 V1.1: preserve every historical row while reconciling erroneous open
-- duplicates created by concurrent first requests for one Supabase session.
with ranked as (
  select id,
         row_number() over (
           partition by account_id,business_id,auth_session_id
           order by last_seen_at desc,created_at desc,id desc
         ) as position
  from iam.access_sessions
  where revoked_at is null and auth_session_id is not null
)
update iam.access_sessions s
set revoked_at=now(),
    revoked_reason='CORRELATION_DUPLICATE_RECONCILED'
from ranked r
where s.id=r.id and r.position>1;

create unique index access_sessions_one_open_provider_session
  on iam.access_sessions(account_id,business_id,auth_session_id)
  where revoked_at is null and auth_session_id is not null;
