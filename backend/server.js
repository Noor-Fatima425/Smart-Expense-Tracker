const axios = require('axios');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
    console.log(`Request made to: ${req.url}`);
    next();
});

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'expenses_project',
    password: 'cse',
    port: 5432,
});



async function categorizeExpense(description) {
  try {
    const response = await axios.post('http://localhost:8001/api/categorize', { description });
    return response.data.category || 'Other';
  } catch (err) {
    console.error('Error calling ML categorizer:', err);
    return 'Other';
  }
}


app.get('/api/groups/:groupId/expenses/pdf', async (req, res) => {
  const groupId = req.params.groupId;
  try {
    const query = `
      SELECT e.*, p.name as payer_name
      FROM expenses e
      LEFT JOIN participant p ON e.payer_id = p.id
      WHERE e.group_id = $1
    `;
    const result = await pool.query(query, [groupId]);
    const expenses = result.rows;

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.pdf');

    doc.pipe(res);

    doc.fontSize(18).text('Expense Report', { align: 'center' });
    doc.moveDown();

    let totalAmount = 0;

    expenses.forEach((expense, i) => {
      const description = expense.description || 'No description';
      const amount = Number(expense.amount);
      if (isNaN(amount)) {
        console.warn(`Skipping expense with invalid amount: ${expense.amount}`);
        return;
      }
      totalAmount += amount;

      const payerName = expense.payer_name || 'Unknown payer';

      doc.fontSize(12).text(`${i + 1}. ${description} — Rs.${amount.toFixed(2)} (Paid by: ${payerName})`);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total Expense: Rs.${totalAmount.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
});

// Delete participant
app.delete('/api/participant/:id', async (req, res) => {
  const participantId = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM participant WHERE id = $1 RETURNING *', [participantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json({ message: 'Participant deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting participant:', err);
    res.status(500).json({ error: 'Failed to delete participant' });
  }
});

app.get('/api/groups/:groupId/expenses', async (req, res) => {
  const groupId = req.params.groupId;
  try {
    const result = await pool.query('SELECT * FROM expenses WHERE group_id = $1', [groupId]);
    res.json({ expenses: result.rows });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { group_id, amount, description, payer_id } = req.body;
  const category = await categorizeExpense(description);

  try {
    const result = await pool.query(
      'INSERT INTO expenses (group_id, amount, description, payer_id, category, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [group_id, amount, description, payer_id, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});


app.post('/api/createGroup', async (req, res) => {
  const { group_name, key } = req.body;
  if (!group_name || !key) {
    return res.status(400).json({ error: 'Group name and key are required' });
  }

  try {
    // Case‑insensitive check for existing group
    const existing = await pool.query(
      `SELECT id FROM groups WHERE LOWER(group_name) = LOWER($1)`,
      [group_name.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Group name already exists' });
    }

    // Insert new group
    const result = await pool.query(
      `INSERT INTO groups (group_name, key) VALUES ($1, $2) RETURNING id`,
      [group_name.trim(), key]
    );
    res.status(201).json({ group_id: result.rows[0].id });
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.post('/api/participant', async (req, res) => {
  const { group_id, name } = req.body;
  if (!group_id || !name) {
    return res.status(400).json({ error: 'group_id and name are required' });
  }

  try {
    // Check if participant with the same name (case-insensitive) exists in the group
    const existing = await pool.query(
      `SELECT * FROM participant WHERE group_id = $1 AND LOWER(name) = LOWER($2)`,
      [group_id, name.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Participant with this name already exists' });
    }

    // Insert new participant
    const result = await pool.query(
      `INSERT INTO participant (group_id, name) VALUES ($1, $2) RETURNING *`,
      [group_id, name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});


app.get('/api/groups', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM groups');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

app.get('/test', (req, res) => {
    res.send('Test route is working!');
});

app.get('/api/groups/:groupId/participant', async (req, res) => {
    const groupId = req.params.groupId;
    if (!groupId) return res.status(400).json({ error: 'Group ID is required' });
    try {
        const result = await pool.query('SELECT * FROM participant WHERE group_id = $1', [groupId]);
        res.json({ participants: result.rows });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { group_name, key } = req.body;
    try {
        const groupRes = await pool.query('SELECT id, key FROM groups WHERE group_name = $1', [group_name]);
        if (groupRes.rows.length === 0) {
            return res.status(400).json({ error: 'Group not found' });
        }
        const group = groupRes.rows[0];
        if (group.key !== key) {
            return res.status(400).json({ error: 'Invalid key' });
        }
        const participantRes = await pool.query('SELECT * FROM participant WHERE group_id = $1', [group.id]);
        const participant = participantRes.rows.length > 0 ? participantRes.rows : [];
        res.json({
            success: true,
            group_id: group.id,
            group_name: group_name,
            participant: participant,
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/payments', async (req, res) => {
  const { expense_id, payer_id, payee_id, amount, group_id } = req.body;
  if (!payer_id || !payee_id || !amount || !group_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await pool.query(
      `INSERT INTO payments (expense_id, payer_id, payee_id, amount, group_id) VALUES ($1, $2, $3, $4, $5)`,
      [expense_id || null, payer_id, payee_id, amount, group_id]
    );
    res.status(201).json({ message: 'Payment recorded successfully' });
  } catch (err) {
    console.error('Error recording payment:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});


app.get('/api/groups/:groupId/payments', async (req, res) => {
  const groupId = req.params.groupId;
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE group_id = $1',
      [groupId]
    );
    res.json({ payments: result.rows });
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const expenseId = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [expenseId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

app.get('/', (req, res) => res.send('Backend working!'));
