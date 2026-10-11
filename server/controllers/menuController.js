// server/controllers/menuController.js
// All the database code for the menu lives here.

const oracledb = require("oracledb");
const { execute } = require("../config/db");

const CATEGORIES = ["Starters", "Mains", "Desserts", "Drinks"];
const COLUMNS = "id, name, description, price, category, image, is_special, is_available";

// Turns a database row (UPPERCASE keys, 0/1 numbers) into the JSON the app uses.
function toItem(row) {
  return {
    id: row.ID,
    name: row.NAME,
    description: row.DESCRIPTION,
    price: row.PRICE,
    category: row.CATEGORY,
    image: row.IMAGE,
    isSpecial: row.IS_SPECIAL === 1,
    isAvailable: row.IS_AVAILABLE === 1,
  };
}

// "12" -> 12. Anything that is not a plain positive whole number -> null.
// (This is the Oracle version of "invalid MongoDB id": it stops "abc" or "-5".)
function parseId(value) {
  return /^[1-9]\d{0,8}$/.test(value) ? Number(value) : null;
}

// Checks the data sent by the client.
//   isNew = true  -> name, price and category are required
//   isNew = false -> every field is optional, but must be valid if it is sent
// Returns { error } or { data } (data = cleaned values, using column names).
function validateItem(body, isNew) {
  if (!body || typeof body !== "object") return { error: "Request body is missing" };
  const data = {};

  if (isNew || body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim() === "") {
      return { error: "Name is required" };
    }
    if (body.name.trim().length > 100) return { error: "Name must be 100 characters or less" };
    data.name = body.name.trim();
  }

  if (isNew || body.price !== undefined) {
    if (typeof body.price !== "number" || !Number.isFinite(body.price)) {
      return { error: "Price must be a number" };
    }
    if (body.price < 0) return { error: "Price cannot be negative" };
    if (body.price > 999999.99) return { error: "Price is too large" };
    data.price = Math.round(body.price * 100) / 100;
  }

  if (isNew || body.category !== undefined) {
    const match =
      typeof body.category === "string"
        ? CATEGORIES.find((c) => c.toLowerCase() === body.category.trim().toLowerCase())
        : undefined;
    if (!match) return { error: `Category must be one of: ${CATEGORIES.join(", ")}` };
    data.category = match;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string" || body.description.length > 500) {
      return { error: "Description must be text of 500 characters or less" };
    }
    data.description = body.description;
  }

  if (body.image !== undefined) {
    if (typeof body.image !== "string" || body.image.length > 50) {
      return { error: "Image must be text of 50 characters or less" };
    }
    data.image = body.image;
  }

  if (body.isSpecial !== undefined) {
    if (typeof body.isSpecial !== "boolean") return { error: "isSpecial must be true or false" };
    data.is_special = body.isSpecial ? 1 : 0;
  }

  if (body.isAvailable !== undefined) {
    if (typeof body.isAvailable !== "boolean") return { error: "isAvailable must be true or false" };
    data.is_available = body.isAvailable ? 1 : 0;
  }

  return { data };
}

// Finds one item by id. Returns the item, or null if there is none.
async function findItem(id) {
  const result = await execute(`SELECT ${COLUMNS} FROM menu_items WHERE id = :1`, [id]);
  return result.rows.length > 0 ? toItem(result.rows[0]) : null;
}

function serverError(res, err, where) {
  console.error(`${where} error:`, err);
  res.status(500).json({ message: "Server error. Please try again." });
}

// GET /api/menu  (optional ?category=Mains and ?search=chicken)
async function getMenu(req, res) {
  try {
    const category = String(req.query.category || "").trim().toLowerCase();
    const search = String(req.query.search || "").trim().toLowerCase();

    const conditions = [];
    const binds = [];
    if (category) {
      binds.push(category);
      conditions.push(`LOWER(category) = :${binds.length}`);
    }
    if (search) {
      // INSTR finds the text anywhere in the name; LOWER makes it not case sensitive.
      binds.push(search);
      conditions.push(`INSTR(LOWER(name), :${binds.length}) > 0`);
    }

    let sql = `SELECT ${COLUMNS} FROM menu_items`;
    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY id";

    const result = await execute(sql, binds);
    res.status(200).json(result.rows.map(toItem));
  } catch (err) {
    serverError(res, err, "getMenu");
  }
}

// GET /api/menu/:id
async function getMenuItem(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid item id" });

    const item = await findItem(id);
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    res.status(200).json(item);
  } catch (err) {
    serverError(res, err, "getMenuItem");
  }
}

// POST /api/menu
async function createMenuItem(req, res) {
  try {
    const { error, data } = validateItem(req.body, true);
    if (error) return res.status(400).json({ message: error });

    const result = await execute(
      `INSERT INTO menu_items (name, description, price, category, image, is_special, is_available)
       VALUES (:p_name, :p_description, :p_price, :p_category, :p_image, :p_special, :p_available)
       RETURNING id INTO :p_newid`,
      {
        p_name: data.name,
        p_description: data.description ?? null,
        p_price: data.price,
        p_category: data.category,
        p_image: data.image ?? null,
        p_special: data.is_special ?? 0,
        p_available: data.is_available ?? 1,
        p_newid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    // RETURNING gives back the id Oracle just created for the new row.
    const out = result.outBinds.p_newid;
    const newId = Array.isArray(out) ? out[0] : out;

    res.status(201).json(await findItem(newId));
  } catch (err) {
    serverError(res, err, "createMenuItem");
  }
}

// PUT /api/menu/:id  (send only the fields you want to change)
async function updateMenuItem(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid item id" });

    const { error, data } = validateItem(req.body, false);
    if (error) return res.status(400).json({ message: error });
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Send at least one field to update" });
    }

    if (!(await findItem(id))) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Column names come from validateItem (never from the user), so this is safe.
    const sets = [];
    const binds = [];
    for (const [column, value] of Object.entries(data)) {
      binds.push(value);
      sets.push(`${column} = :${binds.length}`);
    }
    binds.push(id);
    await execute(`UPDATE menu_items SET ${sets.join(", ")} WHERE id = :${binds.length}`, binds);

    res.status(200).json(await findItem(id));
  } catch (err) {
    serverError(res, err, "updateMenuItem");
  }
}

// DELETE /api/menu/:id
async function deleteMenuItem(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid item id" });

    if (!(await findItem(id))) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    await execute("DELETE FROM menu_items WHERE id = :1", [id]);
    res.status(200).json({ message: "Menu item deleted" });
  } catch (err) {
    // ORA-02292: this item is used by an order, so the database refuses to delete it.
    if (err.errorNum === 2292) {
      return res.status(409).json({
        message: "This item is part of existing orders and cannot be deleted. Mark it unavailable instead.",
      });
    }
    serverError(res, err, "deleteMenuItem");
  }
}

module.exports = { getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem };