// server/config/db.js
// A2 Question 3 - Oracle database connection

const oracledb = require("oracledb");

// Return each row as an object like { ID: 1, NAME: "Pizza" } instead of an array
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// Save (commit) automatically after every INSERT / UPDATE / DELETE
oracledb.autoCommit = true;

let pool;

// Connect once when the server starts. If it fails, print the error and stop.
async function connectDB() {
  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      poolMin: 1,
      poolMax: 5,
    });

    // Test the connection with a tiny query
    const connection = await pool.getConnection();
    await connection.execute("SELECT 1 FROM dual");
    await connection.close();

    console.log("Oracle connected");
  } catch (err) {
    console.error("Oracle connection failed:", err.message);
    process.exit(1);
  }
}

// Run one SQL statement. Controllers use this so they never handle connections.
async function execute(sql, binds = [], options = {}) {
  const connection = await pool.getConnection();
  try {
    return await connection.execute(sql, binds, options);
  } finally {
    await connection.close(); // always give the connection back to the pool
  }
}

// For work that needs several statements to succeed together (used later for orders)
function getConnection() {
  return pool.getConnection();
}

// Used by the seed script so the program can finish
async function closeDB() {
  if (pool) await pool.close(0);
}

module.exports = { connectDB, execute, getConnection, closeDB };