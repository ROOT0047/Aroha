-- Safe User Data Truncation Script
-- Clears all user-generated data, accounts, OTPs, tokens, and logs
-- Leaves all database schemas, tables, indexes, constraints, and product configurations intact.

BEGIN;

-- 1. Truncate Custom Auth Security Module Tables
TRUNCATE TABLE IF EXISTS "email_otps" CASCADE;
TRUNCATE TABLE IF EXISTS "password_reset_tokens" CASCADE;
TRUNCATE TABLE IF EXISTS "password_history" CASCADE;
TRUNCATE TABLE IF EXISTS "audit_logs" CASCADE;
TRUNCATE TABLE IF EXISTS "users" CASCADE;

-- 2. Truncate Application User Data Tables (if populated)
TRUNCATE TABLE IF EXISTS "goals" CASCADE;
TRUNCATE TABLE IF EXISTS "daily_logs" CASCADE;
TRUNCATE TABLE IF EXISTS "focus_sessions" CASCADE;
TRUNCATE TABLE IF EXISTS "daily_reviews" CASCADE;
TRUNCATE TABLE IF EXISTS "schedule_templates" CASCADE;
TRUNCATE TABLE IF EXISTS "profiles" CASCADE;

COMMIT;
