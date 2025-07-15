const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(session({
    store: new pgSession({
        pool: db.pool,
        tableName: 'session'
    }),
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

const requireLogin = (req, res, next) => {
    if (req.session.userId) next();
    else res.redirect('/login');
};

app.get('/', (req, res) => {
    res.redirect(req.session.userId ? '/login' : '/dashboard');
});

// ======================= AUTH ROUTES =======================

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.getUserByUsername(username);
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login failed' });
    }
});

// ===== REGISTER =====

app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await db.getUserByUsername(username);
        if (existingUser) {
            return res.render('register', { error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.createUser(username, hashedPassword);
        req.session.userId = newUser.id;
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Register error:', error);
        res.render('register', { error: 'Registration failed' });
    }
});

// ======================= DASHBOARD ROUTES =======================

app.get('/dashboard', requireLogin, async (req, res) => {
    try {
        const dashboardData = await db.getDashboardData(req.session.userId);
        const recentTransactions = await db.getRecentTransactions(req.session.userId);
        res.render('dashboard', { dashboardData, recentTransactions });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/api/all-transactions-summary', requireLogin, async (req, res) => {
    const userId = req.session.userId;
    try {
        const incomeResult = await db.query(
            'SELECT SUM(amount) AS total FROM transactions WHERE user_id = $1 AND type = $2',
            [userId, 'income']
        );
        const expenseResult = await db.query(
            'SELECT SUM(amount) AS total FROM transactions WHERE user_id = $1 AND type = $2',
            [userId, 'expense']
        );
        res.json({
            totalIncome: parseFloat(incomeResult.rows[0]?.total || 0).toFixed(2),
            totalExpenses: parseFloat(expenseResult.rows[0]?.total || 0).toFixed(2)
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

app.get('/api/individual-transactions-by-title', requireLogin, async (req, res) => {
    const userId = req.session.userId;
    try {
        const result = await db.query(
            'SELECT title, type, SUM(amount) AS total FROM transactions WHERE user_id = $1 GROUP BY title, type ORDER BY title, type',
            [userId]
        );

        const titles = [...new Set(result.rows.map(row => row.title))].sort();
        const incomeMap = new Map();
        const expenseMap = new Map();

        result.rows.forEach(row => {
            const total = parseFloat(row.total).toFixed(2);
            row.type === 'income' ? incomeMap.set(row.title, total) : expenseMap.set(row.title, total);
        });

        const incomeAmounts = titles.map(title => incomeMap.get(title) || 0);
        const expenseAmounts = titles.map(title => expenseMap.get(title) || 0);

        res.json({ titles, incomeAmounts, expenseAmounts });
    } catch (error) {
        console.error('Chart data error:', error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// ======================= TRANSACTIONS =======================

app.get('/add', requireLogin, (req, res) => {
    res.render('add_transaction');
});

app.post('/add', requireLogin, async (req, res) => {
    const { date, title, type, category, amount, description } = req.body;
    try {
        await db.addTransaction(
            req.session.userId,
            date, title, type, category,
            parseFloat(amount),
            description
        );
        res.redirect('/dashboard');
    } catch (error) {
        console.error("Error adding transaction:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/transactions', requireLogin, async (req, res) => {
    try {
        const transactions = await db.getTransactions(req.session.userId);
        res.render('transactions_list', { transactions });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/transactions/edit/:id', requireLogin, async (req, res) => {
    const transactionId = req.params.id;
    try {
        const transaction = await db.getTransactionById(transactionId, req.session.userId);
        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }
        res.render('edit_transaction', { transaction });
    } catch (error) {
        console.error("Error fetching transaction for edit:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/transactions/edit/:id', requireLogin, async (req, res) => {
    const transactionId = req.params.id;
    const { date, title, type, category, amount, description } = req.body;
    try {
        await db.updateTransaction(
            transactionId,
            req.session.userId,
            date, title, type, category,
            parseFloat(amount),
            description
        );
        res.redirect('/transactions');
    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/transactions/delete/:id', requireLogin, async (req, res) => {
    const transactionId = req.params.id;
    try {
        await db.deleteTransaction(transactionId, req.session.userId);
        res.redirect('/transactions');
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/transactions/delete/:id', requireLogin, async (req, res) => {
    const transactionId = req.params.id;
    try {
        const transaction = await db.getTransactionById(transactionId, req.session.userId);
        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }
        res.render('delete_transaction', { transaction });
    } catch (error) {
        console.error("Error fetching transaction for delete:", error);
        res.status(500).send("Internal Server Error");
    }
});

// ======================= SERVER =======================
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
