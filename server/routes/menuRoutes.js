//server/routes/menuRoutes.js
// This file ONLY connects URLs to controller functions. No database code here.

const express = require("express");
const router = express.Router();
const {
  getMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");
const { protect, managerOnly } = require("../middleware/auth");

router.get("/", getMenu);            // GET    /api/menu  (?category=Mains&search=chicken)
router.get("/:id", getMenuItem);     // GET    /api/menu/5
router.post("/", protect, managerOnly, createMenuItem);       // POST   /api/menu
router.put("/:id", protect, managerOnly, updateMenuItem);     // PUT    /api/menu/5
router.delete("/:id", protect, managerOnly, deleteMenuItem);  // DELETE /api/menu/5

module.exports = router;