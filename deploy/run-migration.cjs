#!/usr/bin/env node
// run-migration.js — Execute FULL_MIGRATION.sql against Supabase
// Usage: node run-migration.js <database-password>
//
// Get your database password from:
// https://supabase.com/dashboard/project/ctrcrcgfkwexkjwbwwvh/settings/database
// (It's NOT the API keys — it's the database password under "Connection string")

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error("Usage: node run-migration.js <database-password>");
    console.error("");
    console.error("Get your database password from:");
    console.error("https://supabase.com/dashboard/project/ctrcrcgfkwexkjwbwwvh/settings/database");
    console.error('Look for "Connection string" or "Password" under Database settings.');
    process.exit(1);
  }

  // Try multiple Supabase connection string formats
  const projectRef = "ctrcrcgfkwexkjwbwwvh";
  const hostnames = [
    `aws-0-us-east-2.pooler.supabase.com`,
    `aws-0-us-east-1.pooler.supabase.com`,
    `aws-0-ap-south-1.pooler.supabase.com`,
    `aws-0-us-west-1.pooler.supabase.com`,
    `aws-0-eu-west-1.pooler.supabase.com`,
  ];

  let client = null;
  let connected = false;

  for (const host of hostnames) {
    const connectionString = `postgresql://postgres.${projectRef}:${password}@${host}:6543/postgres`;
    console.log(`Trying ${host}...`);
    const testClient = new Client({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try {
      await testClient.connect();
      await testClient.end();
      console.log(`Connected to ${host}!`);
      // Store the working connection string, create fresh client later
      client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
      connected = true;
      break;
    } catch (err) {
      console.log(`  Failed: ${err.message}`);
      try { await testClient.end(); } catch {}
    }
  }

  if (!connected) {
    // Try direct connection (non-pooler)
    const directConnStr = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
    console.log("Trying direct connection...");
    const testClient = new Client({ connectionString: directConnStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try {
      await testClient.connect();
      await testClient.end();
      console.log("Connected via direct connection!");
      client = new Client({ connectionString: directConnStr, ssl: { rejectUnauthorized: false } });
      connected = true;
    } catch (err) {
      console.log(`  Failed: ${err.message}`);
      try { await testClient.end(); } catch {}
    }
  }

  if (!connected) {
    console.error("\nCould not connect to any Supabase database host.");
    console.error("Please get the correct connection string from:");
    console.error("https://supabase.com/dashboard/project/ctrcrcgfkwexkjwbwwvh/settings/database");
    console.error('Look for "Connection string" -> "URI" under Database settings.');
    process.exit(1);
  }

  try {
    await client.connect();
    console.log("Connected!");

    const sql = fs.readFileSync(path.join(__dirname, "FULL_MIGRATION.sql"), "utf8");
    console.log(`Executing migration (${sql.length} chars)...`);

    await client.query(sql);
    console.log("Migration complete!");

    // Verify
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log("\nTables in database:");
    for (const row of tables.rows) {
      console.log(`  - ${row.table_name}`);
    }

    // Check feedback_entries columns
    const feedbackCols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'feedback_entries' ORDER BY ordinal_position
    `);
    console.log("\nfeedback_entries columns:");
    for (const row of feedbackCols.rows) {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    }

    // Check for pgvector
    const vecExt = await client.query(`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `);
    console.log(`\npgvector extension: ${vecExt.rows.length > 0 ? "ENABLED" : "NOT FOUND"}`);

    // Check for search functions
    const funcs = await client.query(`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name LIKE 'search_%'
    `);
    console.log("Search functions:");
    for (const row of funcs.rows) {
      console.log(`  - ${row.routine_name}()`);
    }

  } catch (err) {
    console.error("Migration failed:", err.message);
    if (err.message.includes("ENOTFOUND") || err.message.includes("ECONNREFUSED")) {
      console.error("\nCould not connect to database. Check:");
      console.error("1. Your database password is correct");
      console.error("2. You're not behind a firewall blocking port 6543");
      console.error("3. The connection string matches your Supabase project region");
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
