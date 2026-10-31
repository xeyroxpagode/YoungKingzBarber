import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

const LOCAL_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:55322/postgres";
const EXPECTED_PROJECT = 'project_id = "youngkingz-h01"';
const EXPECTED_PORT = "port = 55322";

async function main(): Promise<void> {
  const root = process.cwd();
  const config = await readFile(resolve(root, "supabase/config.toml"), "utf8");
  if (!config.includes(EXPECTED_PROJECT) || !config.includes(EXPECTED_PORT)) {
    throw new Error("Refusing to seed: the isolated YoungKingZ local Supabase target was not verified.");
  }

  const seed = await readFile(resolve(root, "supabase/seeds/local-qa.sql"), "utf8");
  const sql = postgres(LOCAL_DATABASE_URL, { max: 1 });

  try {
    await sql.unsafe(seed);
    const [verification] = await sql<{
      business_name: string;
      account_count: number;
      active_profile_count: number;
      barber_without_profile_count: number;
    }[]>`
      select
        b.display_name as business_name,
        count(distinct ua.id)::int as account_count,
        count(distinct pp.id) filter (where pp.status = 'ACTIVE')::int as active_profile_count,
        count(distinct sm.id) filter (
          where ra.role = 'BARBER' and pp.id is null
        )::int as barber_without_profile_count
      from business.businesses b
      join team.staff_members sm on sm.business_id = b.id
      join iam.user_accounts ua on ua.person_id = sm.person_id
      join iam.role_assignments ra on ra.staff_member_id = sm.id and ra.revoked_at is null
      left join team.professional_profiles pp on pp.staff_member_id = sm.id
      where b.provisioning_key = 'young-kingz-dev-local-v1'
      group by b.id
    `;

    if (
      verification?.business_name !== "Young KingZ Dev" ||
      verification.account_count !== 3 ||
      verification.active_profile_count < 1 ||
      verification.barber_without_profile_count < 1
    ) {
      throw new Error("The local manual-QA seed did not satisfy its required invariants.");
    }

    console.log("Local manual-QA seed ready: Young KingZ Dev (3 accounts, ACTIVE profile, Barber without profile).");
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
