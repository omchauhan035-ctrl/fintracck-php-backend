# Finance Tracker (PHP & MySQL Backend + React Frontend)

This project is a full-featured **Personal Finance & Expense Tracker** application built with a **PHP & MySQL (XAMPP)** backend and a modern **React 19 + Tailwind CSS** frontend.

---

## 🏗️ Architecture & Tech Stack

- **Frontend (`/client`)**:
  - React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, React Router v7, Axios.
  - Proxies `/api` requests to `http://localhost:5000`.

- **Backend (`/server`)**:
  - **PHP 8.x** with native PDO (zero composer dependencies required).
  - **MySQL / MariaDB** (standard XAMPP default: `localhost:3306`, user `root`, no password).
  - REST API with CORS headers, HTTP-only cookie JWT authentication, and bcrypt password hashing.

- **Database (`finance_tracker`)**:
  - Schema file: `server/database/schema.sql` (Creates tables: `users`, `categories`, `transactions`, `budgets`, `savings_goals`, `goal_contributions`).

---

## 🚀 Quick Start Guide

### Step 1: Start XAMPP
1. Open **XAMPP Control Panel**.
2. Click **Start** on **Apache** (optional if using PHP built-in server) and **MySQL** (required).
3. *(Optional)* Open `http://localhost/phpmyadmin/`, click **Import**, select `server/database/schema.sql`, and click **Go**.  
   *(Note: The PHP backend automatically creates the `finance_tracker` database and tables if they don't exist yet!)*

---

### Step 2: Run the PHP Backend Server
Open a terminal in `project(2)/server` and run:

```bash
php -S localhost:5000 index.php
```

> **Tip:** You can also simply double-click the `run.bat` file inside the `server` folder!

Verify by opening: [http://localhost:5000](http://localhost:5000) (You will see the JSON status message).

---

### Step 3: Run the React Frontend
Open another terminal in `project(2)/client` and run:

```bash
npm install
npm run dev
```

Now open your browser at:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 📋 API Endpoints Replicated in PHP

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new account and seed default categories |
| `POST` | `/api/auth/login` | Authenticate user and issue HTTP-only JWT cookie |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `GET` | `/api/auth/me` | Fetch currently logged-in user |
| `PATCH`| `/api/auth/profile` | Update user profile and preferred currency |
| `PATCH`| `/api/auth/password` | Change user password |
| `GET` | `/api/transactions` | Paginated transactions with category/date/search filters |
| `POST` | `/api/transactions` | Add new income or expense transaction |
| `PATCH`| `/api/transactions/:id` | Update transaction details |
| `DELETE`| `/api/transactions/:id` | Delete transaction |
| `GET` | `/api/categories` | Fetch category list (custom + defaults) |
| `POST` | `/api/categories` | Create custom category |
| `GET` | `/api/budgets` | Fetch budgets with real-time spending calculations |
| `POST` | `/api/budgets` | Create category budget with date overlap checks |
| `GET` | `/api/goals` | Fetch savings goals with contribution history |
| `POST` | `/api/goals` | Create savings target |
| `POST` | `/api/goals/:id/contributions` | Add funds to a savings goal |
| `POST` | `/api/goals/:id/withdrawals` | Withdraw funds from a savings goal |
| `GET` | `/api/dashboard/summary` | Summary totals, recent list, and chart distributions |
| `GET` | `/api/analytics/*` | Monthly trends, category spending, income vs expenses |
| `GET` | `/api/admin/stats` | Executive telemetry, counts, and cash flow trends |
| `GET` | `/api/admin/users` | Paginated user accounts directory with flow metrics |
| `PATCH`| `/api/admin/users/:id/status`| Suspend or activate user accounts |
| `PATCH`| `/api/admin/users/:id/role` | Promote or demote user to/from administrator |
| `DELETE`| `/api/admin/users/:id` | Cascade delete user account and associated ledger |
| `GET` | `/api/admin/transactions` | Global audit feed of all platform transactions |
| `DELETE`| `/api/admin/transactions/:id`| Administrator transaction purge |
| `GET` | `/api/admin/categories` | Default category master list and usage stats |
| `POST` | `/api/admin/categories` | Create system-wide default category |
| `DELETE`| `/api/admin/categories/:id` | Remove default category |
| `GET` | `/api/admin/system-health` | PHP 8.x runtime memory, uptime, and MySQL state |

---

## 🛡️ Administrator Panel & Credentials

The Administrator Command Center (`/admin`) provides full oversight of the PHP & MySQL finance platform:

- **Admin Login Route:** [http://localhost:5173/login](http://localhost:5173/login)
- **Admin Panel URL:** [http://localhost:5173/admin](http://localhost:5173/admin)
- **Email:** `om40@gmail.com`
- **Password:** `om@123`
- **Role:** `admin` (Stored in MySQL `users` table)
