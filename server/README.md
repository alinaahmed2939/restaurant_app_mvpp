# Restaurant App Server

Node.js + Express REST API with an Oracle database. This is the backend for the Restaurant App (see the main [README](../README.md) for the whole project).

## Folders

| Folder / file | Purpose |
| --- | --- |
| `server.js` | Creates the Express app, middleware, routes, 404 and error handler, connects to Oracle, then listens on `0.0.0.0:PORT` |
| `config/db.js` | Oracle connection pool and the `execute()` helper |
| `models/` | Table scripts and data-access code (the Oracle version of Mongoose models) |
| `routes/` | Only maps URLs to controller functions |
| `controllers/` | All database code and validation |
| `middleware/auth.js` | `protect` (checks the JWT) and `managerOnly` (role check, 403) |
| `seed.js` | Empties the tables and inserts the seed data with hashed passwords |

## Scripts

| Command | What it does |
| --- | --- |
| `npm install` | Installs the packages |
| `npm run seed` | Resets the tables and loads 2 users, 16 menu items, 6 tables |
| `npm run dev` | Starts the server with nodemon |
| `npm start` | Starts the server with node |

## Environment variables

Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.

| Variable | Meaning |
| --- | --- |
| `PORT` | Server port (5000) |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_CONNECT_STRING` | `host:port/service_name`, for example `localhost:1521/XEPDB1` |
| `JWT_SECRET` | Secret used to sign tokens |

## Design notes

- Controllers use **bind variables** (`:1`, `:name`) for all values, so user input cannot change the SQL. Column names in `UPDATE` come from the validation code, never from the user.
- A menu item that is part of an order cannot be deleted. Oracle raises `ORA-02292`, and the controller turns it into a 409 with a helpful message.
- An invalid id such as `abc` or `-5` returns 400 and does not reach the database (Oracle version of the invalid ObjectId check).
- Broken JSON in a request returns 400. Real server errors return 500 with `Internal server error`.
- The server listens on `0.0.0.0` so that phones on the same Wi-Fi can reach it.

## Quick test

```bash
curl http://localhost:5000/api/health
curl "http://localhost:5000/api/menu?category=Mains"
curl "http://localhost:5000/api/menu?search=chicken"
```

Expected: health returns `ok`, Mains returns 6 items, search for `chicken` returns 3 items (Chicken Samosas, Grilled Chicken Steak, Chicken Alfredo Pasta).
