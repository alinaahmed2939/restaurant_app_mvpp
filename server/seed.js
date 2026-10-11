const bcrypt = require("bcryptjs");
// server/seed.js
// Empties the database and fills it with the data from A1.
// Run it with:  npm run seed

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB, execute, closeDB } = require("./config/db");
const { createTables } = require("./createTables");

const users = [
  { fullName: "Ayesha Khan", email: "customer@demo.com", password: "Pass1234", role: "customer" },
  { fullName: "Bilal Ahmed", email: "manager@demo.com", password: "Manager123", role: "manager" },
];

// Same 16 items as the A1 menu.js (categories now start with a capital letter).
// Last two values: isSpecial, isAvailable (1 = yes, 0 = no)
const menuItems = [
  ["Chicken Samosas", "Crispy pastry filled with spiced chicken mince.", 5.5, "Starters", "🥟", 1, 1],
  ["Loaded Nachos", "Tortilla chips with cheese, jalapenos, and salsa.", 6.0, "Starters", "🌮", 0, 1],
  ["Garlic Bread", "Toasted baguette with garlic butter and herbs.", 4.0, "Starters", "🍞", 0, 1],
  ["Soup of the Day", "Chef's daily selection, served with croutons.", 4.5, "Starters", "🍲", 0, 0],
  ["Grilled Chicken Steak", "Char-grilled chicken breast with peri-peri glaze.", 12.5, "Mains", "🍗", 1, 1],
  ["Beef Burger", "Smash patty, cheddar, lettuce, house sauce.", 10.0, "Mains", "🍔", 0, 1],
  ["Margherita Pizza", "Classic tomato, mozzarella, and fresh basil.", 11.0, "Mains", "🍕", 0, 1],
  ["Chicken Alfredo Pasta", "Creamy alfredo sauce with grilled chicken strips.", 11.5, "Mains", "🍝", 0, 1],
  ["Vegetable Biryani", "Fragrant basmati rice with mixed vegetables and spices.", 9.5, "Mains", "🍛", 0, 0],
  ["Fish and Chips", "Beer-battered fish fillet with crispy fries.", 12.0, "Mains", "🐟", 0, 1],
  ["Chocolate Lava Cake", "Warm chocolate cake with a molten center.", 6.5, "Desserts", "🍫", 1, 1],
  ["New York Cheesecake", "Classic baked cheesecake with berry compote.", 6.0, "Desserts", "🍰", 0, 1],
  ["Ice Cream Sundae", "Three scoops with chocolate sauce and nuts.", 5.0, "Desserts", "🍨", 0, 1],
  ["Fresh Lemonade", "Chilled, made fresh with mint leaves.", 3.0, "Drinks", "🍋", 0, 1],
  ["Iced Coffee", "Cold brew coffee over ice with milk.", 3.5, "Drinks", "🧊", 0, 1],
  ["Mango Smoothie", "Blended mango, yogurt, and a hint of honey.", 4.0, "Drinks", "🥭", 1, 1],
];

// Six tables: name and number of seats
const diningTables = [
  ["Window Table 1", 2],
  ["Window Table 2", 2],
  ["Garden Table 1", 4],
  ["Garden Table 2", 4],
  ["Family Booth", 6],
  ["Private Dining", 12],
];

async function seed() {
  await connectDB();

  // Empty everything: drop the old tables and create them fresh.
  await createTables();

  for (const u of users) {
    // Never store a plain password: hash it first (10 = how strong the hash is).
    const hashed = await bcrypt.hash(u.password, 10);
    await execute(
      "INSERT INTO users (full_name, email, password, role) VALUES (:1, :2, :3, :4)",
      [u.fullName, u.email, hashed, u.role]
    );
  }

  for (const item of menuItems) {
    await execute(
      `INSERT INTO menu_items (name, description, price, category, image, is_special, is_available)
       VALUES (:1, :2, :3, :4, :5, :6, :7)`,
      item
    );
  }

  for (const t of diningTables) {
    await execute("INSERT INTO dining_tables (name, seats) VALUES (:1, :2)", t);
  }

  // Count the rows so you can see it worked
  for (const table of ["users", "menu_items", "dining_tables"]) {
    const result = await execute(`SELECT COUNT(*) AS TOTAL FROM ${table}`);
    console.log(`${table}: ${result.rows[0].TOTAL} rows`);
  }

  await closeDB();
  console.log("Seeding finished.");
}

seed().catch(async (err) => {
  console.error("Seeding failed:", err.message);
  await closeDB();
  process.exit(1);
});