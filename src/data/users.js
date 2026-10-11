// src/data/users.js

const users = [
  {
    id: "u1",
    fullName: "Ayesha Khan",
    email: "customer@demo.com",
    password: "Pass1234",
    role: "customer",
  },
  {
    id: "u2",
    fullName: "Bilal Ahmed",
    email: "manager@demo.com",
    password: "Manager123",
    role: "manager",
  },
];

export function findUser(email, password) {
  const match = users.find(
    (u) =>
      u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
      u.password === password
  );
  if (!match) return null;
  const { password: _pw, ...safeUser } = match;
  return safeUser;
}

export function emailExists(email) {
  return users.some(
    (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
  );
}

export function registerUser({ fullName, email, password, role }) {
  const newUser = {
    id: "u" + (users.length + 1),
    fullName,
    email,
    password,
    role,
  };
  users.push(newUser);
  const { password: _pw, ...safeUser } = newUser;
  return safeUser;
}

export default users;