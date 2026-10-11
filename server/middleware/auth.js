const jwt = require("jsonwebtoken");
const { execute } = require("../config/db");

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not logged in. Token missing" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await execute(
      "SELECT id, full_name, email, role FROM users WHERE id = :id",
      { id: decoded.id }
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = { id: user.ID, name: user.FULL_NAME, email: user.EMAIL, role: user.ROLE };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.managerOnly = (req, res, next) => {
  if (req.user && req.user.role === "manager") return next();
  res.status(403).json({ message: "Managers only" });
};