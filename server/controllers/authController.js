const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { execute } = require("../config/db");

const makeToken = (user) =>
  jwt.sign({ id: user.ID, role: user.ROLE }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

// Never send the password back, not even the hashed one
const publicUser = (user) => ({
  name: user.FULL_NAME,
  email: user.EMAIL,
  role: user.ROLE,
});

exports.register = async (req, res) => {
  try {
    const fullName = req.body.fullName || req.body.name;
    const { email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Full name, email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await execute(
      "SELECT id FROM users WHERE LOWER(email) = :email",
      { email: cleanEmail }
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await execute(
      `INSERT INTO users (full_name, email, password, role)
       VALUES (:fullName, :email, :password, :role)`,
      {
        fullName: fullName.trim(),
        email: cleanEmail,
        password: hashed,
        role: role === "manager" ? "manager" : "customer",
      }
    );

    const result = await execute(
      "SELECT id, full_name, email, role FROM users WHERE LOWER(email) = :email",
      { email: cleanEmail }
    );
    const user = result.rows[0];

    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.message && err.message.includes("ORA-00001")) {
      return res.status(409).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const result = await execute(
      `SELECT id, full_name, email, password, role
       FROM users WHERE LOWER(email) = :email`,
      { email: email.trim().toLowerCase() }
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.PASSWORD))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};