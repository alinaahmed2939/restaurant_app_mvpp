// server/routes/tableRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getTables } = require("../controllers/tableController");

router.get("/", protect, getTables); // GET /api/tables

module.exports = router;
