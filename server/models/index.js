// server/models/index.js
// The ORDER matters: a table that other tables point to (users, dining_tables,
// menu_items) must be created BEFORE the tables that point to it.

module.exports = [
  require("./User"),
  require("./DiningTable"),
  require("./MenuItem"),
  require("./Reservation"),
  require("./Order"),
];