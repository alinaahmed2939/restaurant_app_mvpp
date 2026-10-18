// server/routes/orderRoutes.js
// Only connects URLs to controller functions. No database code here.

const express = require("express");
const router = express.Router();
const { protect, managerOnly } = require("../middleware/auth");
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

router.post("/", protect, createOrder);                               // POST  /api/orders
router.get("/my", protect, getMyOrders);                              // GET   /api/orders/my
router.get("/", protect, managerOnly, getAllOrders);                  // GET   /api/orders
router.patch("/:id/status", protect, managerOnly, updateOrderStatus); // PATCH /api/orders/5/status

module.exports = router;
