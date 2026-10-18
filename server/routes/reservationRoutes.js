// server/routes/reservationRoutes.js
// Only connects URLs to controller functions. No database code here.

const express = require("express");
const router = express.Router();
const { protect, managerOnly } = require("../middleware/auth");
const {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
} = require("../controllers/reservationController");

router.post("/", protect, createReservation);                        // POST  /api/reservations
router.get("/my", protect, getMyReservations);                       // GET   /api/reservations/my
router.get("/", protect, managerOnly, getAllReservations);           // GET   /api/reservations
router.patch("/:id", protect, managerOnly, updateReservationStatus); // PATCH /api/reservations/5

module.exports = router;
