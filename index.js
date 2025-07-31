import express from 'express';
import pg from 'pg';
const { Pool } = pg;

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // ต้องใช้ก่อน POST

// สร้าง PostgreSQL connection pool
const pool = new Pool({
  host: 'container_postgresql', // ชื่อ container หรือ hostname
  user: 'testuser',
  password: 'testpass',
  database: 'testdb',
  port: 5432,
  max: 10,                // connection limit
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
});

// root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello World from Node + PostgreSQL' });
});

// สร้างผู้ใช้ใหม่
app.post('/users', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'username and email are required' });
    }

    const query = 'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING user_id';
    const result = await pool.query(query, [username, email]);

    res.status(201).json({ message: 'User created successfully', user_id: result.rows[0].user_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ดึงข้อมูลผู้ใช้ตาม user_id
app.get('/users/:user_id', async (req, res) => {
  const userId = req.params.user_id;

  if (userId && !isNaN(Number(userId))) {
    try {
      const result = await pool.query('SELECT user_id, username, email FROM users WHERE user_id = $1', [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.status(400).json({ error: 'Invalid user_id' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
