# Assignment 2 - Submission Folder

This folder holds the A2 files that are not source code.

| File / folder | Question | Description |
| --- | --- | --- |
| `SRS_v2.pdf` | Q1 | Updated SRS: scope, new definitions, database design, 17 API endpoints, two diagrams |
| `SRS_v2.docx` | Q1 | Editable version of the same document |
| `diagrams/sequence_place_order.png` | Q1 | Sequence diagram: App, Express server, database |
| `diagrams/deployment.png` | Q1 | Deployment diagram: phones, laptop, database |
| `restaurant-api.postman_collection.json` | Q4 | Postman collection (12 requests, 5 must fail) |
| `screenshots/` | Q2 to Q7 | Evidence screenshots (list below) |

## Screenshot index

| File | Question | Shows |
| --- | --- | --- |
| `q2-health-check-laptop-pretty.jpg` | Q2 | `/api/health` in the laptop browser (formatted) |
| `q2-health-check-laptop-raw.jpg` | Q2 | Same response, raw JSON |
| `q3-oracle-menu-items-table.jpg` | Q3 | `SELECT` on `menu_items`: 16 rows, Oracle 21.3 |
| `q3-oracle-menu-items-table-alt.jpg` | Q3 | Same, second photo |
| `q4-postman-get-all-menu-200.jpg` | Q4 | GET all menu items, 200 OK (working request) |
| `q4-postman-fail-negative-price-400.jpg` | Q4 | POST with negative price, 400 "Price cannot be negative" (failing request) |
| `q4-postman-runner-12-requests.jpg` | Q4 | Postman Runner with all 12 requests selected |
| `q4-browser-menu-all-1..6-*.jpg` | Q4 | `/api/menu` in the browser, all 16 items (6 photos, scrolled) |
| `q4-browser-search-chicken-3-items.jpg` | Q4 | `?search=chicken` returns 3 items |
| `q5-postman-login-manager-200.jpg` | Q5 | Login as manager: token and user with role `manager` |

### Still to add before submission

| Needed file | Question |
| --- | --- |
| Postman `/api/health` screenshot | Q2 |
| Phone browser `/api/health` screenshot (laptop IP) | Q2 |
| Postman Runner result screenshot (all green) | Q4 |
| Add item with **no token** (401), **customer token** (403), **manager token** (201) | Q5 |
| Two-device screenshots with the same new price | Q6 |
| Screen recording link (max 4 minutes) in the main README | Q7 |

## Commit plan (one proper commit per question)

```bash
git add server/package.json server/server.js server/.env.example .gitignore
git commit -m "A2 Q2: Express server with /api/health, 404 and error handler"

git add server/config server/models server/seed.js
git commit -m "A2 Q3: Oracle connection, tables and seed script"

git add server/routes/menuRoutes.js server/controllers/menuController.js A2/restaurant-api.postman_collection.json
git commit -m "A2 Q4: menu API (CRUD, category filter, search) with Postman tests"

git add server/routes/authRoutes.js server/controllers/authController.js server/middleware
git commit -m "A2 Q5: register, login, bcrypt, JWT, protect and managerOnly"

git add src
git commit -m "A2 Q6: API client, useApi hook, saved login, manager dashboard"

git add server/routes server/controllers
git commit -m "A2 Q7: orders and reservations with server-side rules, 10 s polling"

git add A2 README.md server/README.md
git commit -m "A2 Q1: SRS_v2, diagrams, README and screenshots"
git push origin main
```

Before pushing, run `git status` and make sure **`.env` is not listed**. Only `.env.example` may be pushed.
