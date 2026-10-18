// server/controllers/orderController.js
// A2 Question 7 - orders. All database code for orders lives here.

const oracledb = require("oracledb");
const { execute, getConnection } = require("../config/db");

const ORDER_TYPES = ["Dine-in", "Takeaway"];
const STATUSES = ["Pending", "Preparing", "Ready", "Served", "Cancelled"];

// Status can only move ONE step forward. "Cancelled" is allowed only from Pending
// (it is not in this map on purpose: nothing can move forward from Served or Cancelled).
const NEXT_STATUS = { Pending: "Preparing", Preparing: "Ready", Ready: "Served" };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM

function parseId(value) {
  return /^[1-9]\d{0,8}$/.test(value) ? Number(value) : null;
}

function serverError(res, err, where) {
  console.error(`${where} error:`, err);
  res.status(500).json({ message: "Server error. Please try again." });
}

// Reads orders (and their items) from the database and turns rows into the JSON the app uses.
// whereSql is fixed text written in this file (never from the user); user values go in binds.
async function loadOrders(whereSql, binds) {
  const result = await execute(
    `SELECT o.id, o.customer_id, u.full_name, o.order_type, o.table_id, t.name AS table_name,
            o.pickup_time, o.total, o.status, o.created_at, o.updated_at
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       LEFT JOIN dining_tables t ON t.id = o.table_id
       ${whereSql}
      ORDER BY o.id DESC`,
    binds
  );
  if (result.rows.length === 0) return [];

  const ids = result.rows.map((r) => r.ID);
  const marks = ids.map((_, i) => `:${i + 1}`).join(", ");
  const itemResult = await execute(
    `SELECT oi.order_id, oi.menu_item_id, m.name, m.image, oi.quantity, oi.unit_price, oi.note
       FROM order_items oi
       JOIN menu_items m ON m.id = oi.menu_item_id
      WHERE oi.order_id IN (${marks})
      ORDER BY oi.id`,
    ids
  );

  const byOrder = {};
  for (const r of itemResult.rows) {
    (byOrder[r.ORDER_ID] = byOrder[r.ORDER_ID] || []).push({
      menuItemId: r.MENU_ITEM_ID,
      name: r.NAME,
      image: r.IMAGE,
      quantity: r.QUANTITY,
      unitPrice: r.UNIT_PRICE,
      note: r.NOTE,
    });
  }

  return result.rows.map((r) => ({
    id: r.ID,
    customerId: r.CUSTOMER_ID,
    customerName: r.FULL_NAME,
    orderType: r.ORDER_TYPE,
    tableId: r.TABLE_ID,
    tableName: r.TABLE_NAME,
    pickupTime: r.PICKUP_TIME,
    total: r.TOTAL,
    status: r.STATUS,
    createdAt: r.CREATED_AT,
    updatedAt: r.UPDATED_AT,
    items: byOrder[r.ID] || [],
  }));
}

// POST /api/orders   (logged-in user)
// Body: { orderType: "Dine-in", tableId: 3, items: [{ menuItemId: 5, quantity: 2, note? }] }
//   or  { orderType: "Takeaway", pickupTime: "18:30", items: [...] }
async function createOrder(req, res) {
  let connection;
  try {
    const { orderType, tableId, pickupTime, items } = req.body || {};

    if (!ORDER_TYPES.includes(orderType)) {
      return res.status(400).json({ message: "orderType must be Dine-in or Takeaway" });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ message: "An order needs between 1 and 50 items" });
    }

    // Clean the items and merge the same dish if it appears twice.
    const wanted = new Map();
    for (const it of items) {
      const id = Number(it && (it.menuItemId ?? it.id));
      const qty = Number(it && (it.quantity ?? it.qty));
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "Each item needs a valid menuItemId" });
      }
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: "Quantity must be a whole number of 1 or more" });
      }
      const note = typeof it.note === "string" && it.note.trim() ? it.note.trim().slice(0, 200) : null;
      const prev = wanted.get(id);
      wanted.set(id, { qty: (prev ? prev.qty : 0) + qty, note: note || (prev && prev.note) || null });
    }
    for (const w of wanted.values()) {
      if (w.qty > 99) return res.status(400).json({ message: "You can order at most 99 of one item" });
    }

    // Dine-in needs a real, available table. Takeaway needs a pickup time.
    let tableValue = null;
    let pickupValue = null;
    if (orderType === "Dine-in") {
      const tid = Number(tableId);
      if (!Number.isInteger(tid) || tid < 1) {
        return res.status(400).json({ message: "Dine-in orders need a tableId" });
      }
      const t = await execute("SELECT id FROM dining_tables WHERE id = :1 AND is_available = 1", [tid]);
      if (t.rows.length === 0) return res.status(400).json({ message: "Table not found" });
      tableValue = tid;
    } else {
      if (typeof pickupTime !== "string" || !TIME_RE.test(pickupTime)) {
        return res.status(400).json({ message: "Takeaway orders need pickupTime like 18:30" });
      }
      pickupValue = pickupTime;
    }

    // Read the REAL prices and availability from the database.
    const ids = [...wanted.keys()];
    const marks = ids.map((_, i) => `:${i + 1}`).join(", ");
    const menu = await execute(
      `SELECT id, name, price, is_available FROM menu_items WHERE id IN (${marks})`,
      ids
    );
    const found = {};
    for (const r of menu.rows) found[r.ID] = r;

    let cents = 0;
    for (const id of ids) {
      const row = found[id];
      if (!row) return res.status(400).json({ message: `Menu item ${id} does not exist` });
      if (row.IS_AVAILABLE !== 1) {
        return res.status(400).json({ message: `"${row.NAME}" is not available right now` });
      }
      cents += Math.round(row.PRICE * 100) * wanted.get(id).qty;
    }

    // WHY the server works out the total: the app runs on the customer's phone, so anyone can
    // change the numbers it sends (or it may hold an old price). We ignore any total from the
    // app and calculate it here from the prices in the database.
    const total = cents / 100;

    // Save the order and its items together: both succeed, or nothing is saved.
    connection = await getConnection();
    const ins = await connection.execute(
      `INSERT INTO orders (customer_id, order_type, table_id, pickup_time, total)
       VALUES (:cid, :otype, :tid, :ptime, :total)
       RETURNING id INTO :newid`,
      {
        cid: req.user.id,
        otype: orderType,
        tid: tableValue,
        ptime: pickupValue,
        total,
        newid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: false }
    );
    const out = ins.outBinds.newid;
    const orderId = Array.isArray(out) ? out[0] : out;

    for (const id of ids) {
      const w = wanted.get(id);
      await connection.execute(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, note)
         VALUES (:1, :2, :3, :4, :5)`,
        [orderId, id, w.qty, found[id].PRICE, w.note],
        { autoCommit: false }
      );
    }
    await connection.commit();

    const [order] = await loadOrders("WHERE o.id = :1", [orderId]);
    res.status(201).json(order);
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (e) { /* ignore */ }
    }
    serverError(res, err, "createOrder");
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { /* ignore */ }
    }
  }
}

// GET /api/orders/my   (logged-in user: only his own orders)
async function getMyOrders(req, res) {
  try {
    res.status(200).json(await loadOrders("WHERE o.customer_id = :1", [req.user.id]));
  } catch (err) {
    serverError(res, err, "getMyOrders");
  }
}

// GET /api/orders   (manager: all orders)
async function getAllOrders(req, res) {
  try {
    res.status(200).json(await loadOrders("", []));
  } catch (err) {
    serverError(res, err, "getAllOrders");
  }
}

// PATCH /api/orders/:id/status   (manager)   Body: { status: "Preparing" }
async function updateOrderStatus(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid order id" });

    const newStatus = req.body && req.body.status;
    if (!STATUSES.includes(newStatus)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(", ")}` });
    }

    const current = await execute("SELECT status FROM orders WHERE id = :1", [id]);
    if (current.rows.length === 0) return res.status(404).json({ message: "Order not found" });
    const oldStatus = current.rows[0].STATUS;

    if (newStatus === "Cancelled") {
      if (oldStatus !== "Pending") {
        return res.status(400).json({ message: `An order can be cancelled only while it is Pending (it is ${oldStatus})` });
      }
    } else if (NEXT_STATUS[oldStatus] !== newStatus) {
      const allowed = NEXT_STATUS[oldStatus];
      return res.status(400).json({
        message: allowed
          ? `Cannot change ${oldStatus} to ${newStatus}. The next status is ${allowed}.`
          : `A ${oldStatus} order cannot be changed any more.`,
      });
    }

    // "AND status = :3" makes sure nobody changed it between our check and this update.
    const upd = await execute(
      "UPDATE orders SET status = :1 WHERE id = :2 AND status = :3",
      [newStatus, id, oldStatus]
    );
    if (upd.rowsAffected === 0) {
      return res.status(400).json({ message: "The order was just changed by someone else. Refresh and try again." });
    }

    const [order] = await loadOrders("WHERE o.id = :1", [id]);
    res.status(200).json(order);
  } catch (err) {
    serverError(res, err, "updateOrderStatus");
  }
}

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus };
