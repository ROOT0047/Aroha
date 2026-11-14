import postgres from "postgres";
import { env } from "../config/env";
import { createClient } from "@supabase/supabase-js";

async function clearUserData() {
  console.log("=== Clearing User Data (Retaining All Product Properties & Schemas) ===");

  const dbUrl = env.DATABASE_URL;
  let clearedSql = false;

  if (dbUrl) {
    console.log("[PostgreSQL] Connecting to database via DATABASE_URL...");
    try {
      const sql = postgres(dbUrl, { max: 1 });
      
      console.log("[PostgreSQL] Truncating auth tables with CASCADE...");
      await sql`
        DO $$
        BEGIN
          -- Truncate auth module tables if they exist
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_otps') THEN
            TRUNCATE TABLE email_otps CASCADE;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens') THEN
            TRUNCATE TABLE password_reset_tokens CASCADE;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_history') THEN
            TRUNCATE TABLE password_history CASCADE;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
            TRUNCATE TABLE audit_logs CASCADE;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            TRUNCATE TABLE users CASCADE;
          END IF;

          -- Optionally clear user application logs/sessions if desired
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
            TRUNCATE TABLE goals CASCADE;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_logs') THEN
            TRUNCATE TABLE daily_logs CASCADE;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'focus_sessions') THEN
            TRUNCATE TABLE focus_sessions CASCADE;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_reviews') THEN
            TRUNCATE TABLE daily_reviews CASCADE;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedule_templates') THEN
            TRUNCATE TABLE schedule_templates CASCADE;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
            TRUNCATE TABLE profiles CASCADE;
          END IF;
        END $$;
      `;
      console.log("  ✓ Successfully cleared PostgreSQL user tables.");
      await sql.end();
      clearedSql = true;
    } catch (err) {
      console.warn("  ⚠ Direct PostgreSQL truncate notice:", err instanceof Error ? err.message : err);
    }
  } else {
    console.log("[Notice] DATABASE_URL is not set in environment or .env file.");
  }

  // Also check Supabase Admin API if service role key is available
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("[Supabase] Connecting to Supabase Admin API...");
    try {
      const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) {
        console.warn("  ⚠ Supabase listUsers warning:", error.message);
      } else if (users?.users?.length) {
        console.log(`[Supabase] Found ${users.users.length} user(s) in auth.users. Deleting...`);
        for (const u of users.users) {
          await supabaseAdmin.auth.admin.deleteUser(u.id);
        }
        console.log("  ✓ Cleared Supabase auth users.");
      } else {
        console.log("  ✓ Supabase auth.users is already empty.");
      }
    } catch (err) {
      console.warn("  ⚠ Supabase Admin cleanup notice:", err instanceof Error ? err.message : err);
    }
  }

  console.log("\n=== User Data Clear Operation Completed ===");
}

clearUserData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
