import 'dotenv/config'
import express from 'express'
import postgres from 'postgres'

const app = express()
const port = process.env.PORT || 3000

app.use(express.json()) // ต้องใช้ก่อน POST

// สร้าง PostgreSQL client (auto pool ในตัว)
const sql = postgres({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 5432),
  max: 10,                        // connection limit
  idle_timeout: 30,               // วินาที (ไม่ใช่ ms)
  connect_timeout: 60,            // วินาที
})

// root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello World from Node' })
})

// สร้างผู้ใช้ใหม่
app.post('/users', async (req, res) => {
  try {
    const { username, email } = req.body
    if (!username || !email) {
      return res.status(400).json({ error: 'username and email are required' })
    }

    // postgres ใช้ template literal
    const [user] = await sql/*sql*/`
      INSERT INTO users (username, email) 
      VALUES (${username}, ${email}) 
      RETURNING user_id
    `

    res.status(201).json({ message: 'User created successfully', user_id: user.user_id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// ดึงข้อมูลผู้ใช้ตาม user_id
app.get('/users/:user_id', async (req, res) => {
  const userId = Number(req.params.user_id)
  if (!userId) {
    return res.status(400).json({ error: 'Invalid user_id' })
  }

  try {
    const users = await sql/*sql*/`
      SELECT user_id, username, email 
      FROM users 
      WHERE user_id = ${userId}
    `

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json(users[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
