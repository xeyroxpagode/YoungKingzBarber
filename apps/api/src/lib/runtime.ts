import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createDatabase } from "@youngkingz/database";

config({ path: process.env.ENV_FILE ?? ".env" });

export const runtime = {
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:55322/postgres",
  supabaseUrl: process.env.SUPABASE_URL ?? "http://127.0.0.1:55321",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  host: process.env.API_HOST ?? "127.0.0.1",
  port: Number(process.env.API_PORT ?? 4100),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3100"
};

export const database = createDatabase(runtime.databaseUrl);
export const supabaseAdmin = createClient(runtime.supabaseUrl, runtime.serviceRoleKey || "local-key-required", { auth: { autoRefreshToken: false, persistSession: false } });
