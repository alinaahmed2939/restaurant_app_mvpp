// server/controllers/reservationController.js
// A2 Question 7 - table reservations. All database code for reservations lives here.

const oracledb = require("oracledb");
const { execute } = require("../config/db");

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;     // HH:MM
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;           // YYYY-MM-DD
const PHONE_RE = /^[0-9+\-\s]{7,15}$/;

function parseId(value) {
  return /^[1-9]\d{0,8}$/.test(value) ? Number(value) : null;
}

function serverError(res, err, where) {
  console.error(`${where} error:`, err);
  res.status(500).json({ message: "Server error. Please try again." });
}

// True only for a real calendar date such as 2026-10-20 (not 2026-02-31).
function isRealDate(text) {
  if (!DATE_RE.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

function todayText() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function loadReservations(whereSql, binds) {
  const result = await execute(
    `SELECT r.id, r.customer_id, u.full_name, r.table_id, t.name AS table_name, t.seats,
            TO_CHAR(r.reservation_date, 'YYYY-MM-DD') AS res_date,
            r.time_slot, r.party_size, r.contact_phone, r.status, r.created_at, r.updated_at
       FROM reservations r
       JOIN users u ON u.id = r.customer_id
       JOIN dining_tables t ON t.id = r.table_id
       ${whereSql}
      ORDER BY r.reservation_date DESC, r.time_slot DESC, r.id DESC`,
    binds
  );
  return result.rows.map((r) => ({
    id: r.ID,
    customerId: r.CUSTOMER_ID,
    customerName: r.FULL_NAME,
    tableId: r.TABLE_ID,
    tableName: r.TABLE_NAME,
    seats: r.SEATS,
    date: r.RES_DATE,
    timeSlot: r.TIME_SLOT,
    partySize: r.PARTY_SIZE,
    contactPhone: r.CONTACT_PHONE,
    status: r.STATUS,
    createdAt: r.CREATED_AT,
    updatedAt: r.UPDATED_AT,
  }));
}

// POST /api/reservations   (logged-in user)
// Body: { tableId, date: "2026-10-20", timeSlot: "19:00", partySize: 4, contactPhone: "03001234567" }
async function createReservation(req, res) {
  try {
    const b = req.body || {};
    const tableId = Number(b.tableId);
    const date = b.date;
    const timeSlot = b.timeSlot ?? b.time;
    const partySize = Number(b.partySize ?? b.guests);
    const rawPhone = b.contactPhone ?? b.phone;
    const phone = typeof rawPhone === "string" ? rawPhone.trim() : "";

    if (!Number.isInteger(tableId) || tableId < 1) return res.status(400).json({ message: "tableId is required" });
    if (typeof date !== "string" || !isRealDate(date)) return res.status(400).json({ message: "date must be a real date like 2026-10-20" });
    if (date < todayText()) return res.status(400).json({ message: "You cannot book a date in the past" });
    if (typeof timeSlot !== "string" || !TIME_RE.test(timeSlot)) return res.status(400).json({ message: "timeSlot must look like 19:00" });
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 12) return res.status(400).json({ message: "partySize must be a whole number from 1 to 12" });
    if (!PHONE_RE.test(phone)) return res.status(400).json({ message: "contactPhone must be 7 to 15 digits" });

    const t = await execute("SELECT id, name, seats FROM dining_tables WHERE id = :1 AND is_available = 1", [tableId]);
    if (t.rows.length === 0) return res.status(404).json({ message: "Table not found" });
    const table = t.rows[0];

    // Rule 1: enough seats.
    if (partySize > table.SEATS) {
      return res.status(400).json({ message: `${table.NAME} has only ${table.SEATS} seats` });
    }

    // Rule 2: the table must be free at that date and time.
    // Pending and Accepted bookings block the table. Declined and Cancelled ones do not.
    const clash = await execute(
      `SELECT COUNT(*) AS TOTAL FROM reservations
        WHERE table_id = :1
          AND reservation_date = TO_DATE(:2, 'YYYY-MM-DD')
          AND time_slot = :3
          AND status IN ('Pending', 'Accepted')`,
      [tableId, date, timeSlot]
    );
    if (clash.rows[0].TOTAL > 0) {
      return res.status(409).json({ message: "This table is already booked at that date and time" });
    }

    const ins = await execute(
      `INSERT INTO reservations (customer_id, table_id, reservation_date, time_slot, party_size, contact_phone)
       VALUES (:cid, :tid, TO_DATE(:rdate, 'YYYY-MM-DD'), :slot, :party, :phone)
       RETURNING id INTO :newid`,
      {
        cid: req.user.id,
        tid: tableId,
        rdate: date,
        slot: timeSlot,
        party: partySize,
        phone,
        newid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    const out = ins.outBinds.newid;
    const newId = Array.isArray(out) ? out[0] : out;

    const [reservation] = await loadReservations("WHERE r.id = :1", [newId]);
    res.status(201).json(reservation);
  } catch (err) {
    serverError(res, err, "createReservation");
  }
}

// GET /api/reservations/my   (logged-in user: only his own)
async function getMyReservations(req, res) {
  try {
    res.status(200).json(await loadReservations("WHERE r.customer_id = :1", [req.user.id]));
  } catch (err) {
    serverError(res, err, "getMyReservations");
  }
}

// GET /api/reservations   (manager: all)
async function getAllReservations(req, res) {
  try {
    res.status(200).json(await loadReservations("", []));
  } catch (err) {
    serverError(res, err, "getAllReservations");
  }
}

// PATCH /api/reservations/:id   (manager)   Body: { status: "Accepted" } or { status: "Declined" }
async function updateReservationStatus(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid reservation id" });

    const newStatus = req.body && req.body.status;
    if (newStatus !== "Accepted" && newStatus !== "Declined") {
      return res.status(400).json({ message: "Status must be Accepted or Declined" });
    }

    const current = await execute("SELECT status FROM reservations WHERE id = :1", [id]);
    if (current.rows.length === 0) return res.status(404).json({ message: "Reservation not found" });
    const oldStatus = current.rows[0].STATUS;
    if (oldStatus !== "Pending") {
      return res.status(400).json({ message: `Only Pending reservations can be changed (this one is ${oldStatus})` });
    }

    const upd = await execute(
      "UPDATE reservations SET status = :1 WHERE id = :2 AND status = 'Pending'",
      [newStatus, id]
    );
    if (upd.rowsAffected === 0) {
      return res.status(400).json({ message: "The reservation was just changed by someone else. Refresh and try again." });
    }

    const [reservation] = await loadReservations("WHERE r.id = :1", [id]);
    res.status(200).json(reservation);
  } catch (err) {
    serverError(res, err, "updateReservationStatus");
  }
}

module.exports = { createReservation, getMyReservations, getAllReservations, updateReservationStatus };
