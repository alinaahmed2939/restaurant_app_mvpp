// server/createTables.js
// Creates all tables from the model files.
// WARNING: it first DROPS the old tables, so any existing data is deleted.
// Run it with:  npm run create-tables

require("dotenv").config();
const { connectDB, execute, closeDB } = require("./config/db");
const models = require("./models");

async function createTables() {
  // 1. Drop old tables (the ones that depend on others go first).
  const allTables = models.flatMap((m) => m.tables).reverse();
  for (const table of allTables) {
    try {
      await execute(`DROP TABLE ${table} CASCADE CONSTRAINTS PURGE`);
      console.log("Dropped old table:", table);
    } catch (err) {
      // ORA-00942 just means "that table does not exist yet", which is fine.
      if (!err.message.includes("ORA-00942")) throw err;
    }
  }

  // 2. Create the tables (and triggers) from every model file.
  for (const model of models) {
    for (const sql of model.statements) {
      await execute(sql);
    }
    console.log("Created:", model.tables.join(", "));
  }
}

module.exports = { createTables };

// Runs only when you type "npm run create-tables" (not when seed.js imports it).
if (require.main === module) {
  (async () => {
    await connectDB();
    await createTables();
    await closeDB();
    console.log("All tables are ready.");
  })().catch(async (err) => {
    console.error("createTables failed:", err.message);
    await closeDB();
    process.exit(1);
  });
}