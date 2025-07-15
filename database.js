const { Pool } = require('pg');

// PostgreSQL connection pool setup
const pool = new Pool({
    user: 'postgres',             // Your PostgreSQL username
    host: 'localhost',            // Your host, usually localhost
    database: 'expense_tracker',  // Your database name
    password: 'neelu',            // Your PostgreSQL password
    port: 5432                    // Default PostgreSQL port
});

// General query function
async function query(text, params) {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (err) {
        console.error('Error executing query', err);
        throw err;
    }
}

// Fetch all transactions for a user
async function getTransactions(userId) {
    const result = await query(
        'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
        [userId]
    );
    return result.rows;
}

// Add a new transaction
async function addTransaction(userId, date, title, type, category, amount, description) {
    const result = await query(
        'INSERT INTO transactions (user_id, date, title, type, category, amount, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [userId, date, title, type, category, amount, description]
    );
    return result.rows[0];
}

// Get dashboard summary data
async function getDashboardData(userId) {
    const totalTransactionsResult = await query(
        'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
        [userId]
    );
    const totalIncomeResult = await query(
        'SELECT SUM(amount) FROM transactions WHERE type = \'income\' AND user_id = $1',
        [userId]
    );
    const totalExpensesResult = await query(
        'SELECT SUM(amount) FROM transactions WHERE type = \'expense\' AND user_id = $1',
        [userId]
    );

    const totalTransactions = totalTransactionsResult.rows[0].count;
    const totalIncome = parseFloat(totalIncomeResult.rows[0].sum || 0).toFixed(2);
    const totalExpenses = parseFloat(totalExpensesResult.rows[0].sum || 0).toFixed(2);
    const balance = (parseFloat(totalIncome) - parseFloat(totalExpenses)).toFixed(2);

    return {
        totalTransactions,
        totalIncome,
        totalExpenses,
        balance,
    };
}

// Get the most recent transactions
async function getRecentTransactions(userId, limit = 5) {
    const result = await query(
        'SELECT date, title, type, amount FROM transactions WHERE user_id = $1 ORDER BY date DESC LIMIT $2',
        [userId, limit]
    );
    return result.rows;
}

// Get user by username
async function getUserByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
}

// Create a new user
async function createUser(username, hashedPassword) {
    const result = await query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
        [username, hashedPassword]
    );
    return result.rows[0];
}

// ✅ Get a specific transaction by ID
async function getTransactionById(transactionId, userId) {
    const result = await query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
        [transactionId, userId]
    );
    return result.rows[0];
}

// ✅ Update a transaction
async function updateTransaction(transactionId, userId, date, title, type, category, amount, description) {
    const result = await query(
        `UPDATE transactions
         SET date = $1, title = $2, type = $3, category = $4, amount = $5, description = $6
         WHERE id = $7 AND user_id = $8`,
        [date, title, type, category, amount, description, transactionId, userId]
    );
    return result.rowCount;
}

// ✅ Delete a transaction
async function deleteTransaction(transactionId, userId) {
    const result = await query(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
        [transactionId, userId]
    );
    return result.rowCount;
}

// Export all database functions
module.exports = {
    pool,
    query,
    getTransactions,
    addTransaction,
    getDashboardData,
    getRecentTransactions,
    getUserByUsername,
    createUser,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};
