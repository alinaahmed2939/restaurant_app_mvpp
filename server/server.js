// server/server.js
// A2 Question 2 - Express server setup
// A2 Question 3 - connects to Oracle before listening
// A2 Question 4 - menu routes

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware: must come BEFORE the routes.
app.use(cors());          // lets the app talk to this server
app.use(express.json());  // lets us read JSON sent in req.body

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Menu routes
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));

// 404 handler: runs only if no route above matched the URL
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler: must be the LAST thing, and must have 4 parameters.
// Mistakes by the client (like broken JSON) get their own 4xx status;
// everything else is a real server error (500).
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  const message = status === 500 ? "Internal server error" : err.message;
  res.status(status).json({ message });
});

// Connect to the database first. Only start listening if it worked.
// "0.0.0.0" lets other devices on the Wi-Fi (your phone) reach the server.
connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});