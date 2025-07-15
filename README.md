# 💸 Expense Tracker

A full-stack web application to manage your personal expenses, track transactions, and stay financially organized — built using **Node.js**, **Express**, **PostgreSQL**, and **EJS** with a modern UI.

---

## 🚀 Features

- 🧾 Add / Edit / Delete transactions
- 📊 Dashboard with categorized summaries
- 🔐 User Authentication (Register/Login)
- 📄 View all transactions in a list view
- 💅 Clean and responsive EJS-based UI
- 🗄️ PostgreSQL database integration

---

## 🛠️ Tech Stack

| Layer      | Technology           |
|------------|----------------------|
| Backend    | Node.js, Express.js  |
| Frontend   | EJS, HTML, CSS       |
| Database   | PostgreSQL           |
| Auth       | Session-based Login  |
| Styling    | Custom CSS           |

---

## 📂 Folder Structure

```
EXPENSE_TRACKER/
│
├── public/                   # Static assets (CSS, JS)
│   ├── style.css
│   └── script.js
│
├── views/                   # EJS templates
│   ├── add_transaction.ejs
│   ├── dashboard.ejs
│   ├── delete_transaction.ejs
│   ├── edit_transaction.ejs
│   ├── index.ejs
│   ├── login.ejs
│   ├── register.ejs
│   └── transactions_list.ejs
│
├── database.js              # DB connection setup
├── server.js                # Main server file
├── .env                     # Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Expense-Tracker.git
cd Expense-Tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your `.env` file

Create a `.env` file and add your PostgreSQL credentials:

```
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_tracker_db
```

### 4. Start the app

```bash
node server.js
```

Or with nodemon (if installed):

```bash
npx nodemon server.js
```
