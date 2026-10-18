// server/controllers/tableController.js
// The app needs the list of tables so the customer can pick one.

const { execute } = require("../config/db");

// GET /api/tables   (logged-in user)
async function getTables(req, res) {
  try {
    const result = await execute("SELECT id, name, seats, is_available FROM dining_tables ORDER BY id");
    res.status(200).json(
      result.rows.map((r) => ({ id: r.ID, name: r.NAME, seats: r.SEATS, isAvailable: r.IS_AVAILABLE === 1 }))
    );
  } catch (err) {
    console.error("getTables error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

module.exports = { getTables };
