const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://smartforge-landing.vercel.app',
    'https://smartforge-landing-git-main-yourusername.vercel.app'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'assets')));

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'hackindia_euz3_user',
  host: 'dpg-cvm88dggjchc73cfu090-a.singapore-postgres.render.com',
  database: 'hackindia_euz3',
  password: 'WeAxCS1RgaV6F7kTfNIIK5Z6w7BAvNzt',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Successfully connected to PostgreSQL database');
  release();
});

// Create emails table if it doesn't exist
async function createEmailsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Emails table created or already exists');
  } catch (error) {
    console.error('Error creating emails table:', error);
  } finally {
    client.release();
  }
}

// Initialize table
createEmailsTable();

// API endpoint to store email
app.post('/api/subscribe', async (req, res) => {
  console.log('Received subscription request:', req.body);
  const { email } = req.body;
  
  if (!email) {
    console.log('No email provided in request');
    return res.status(400).json({ error: 'Email is required' });
  }

  const client = await pool.connect();
  try {
    console.log('Attempting to insert email:', email);
    const result = await client.query(
      'INSERT INTO emails (email) VALUES ($1) RETURNING *',
      [email]
    );
    console.log('Successfully inserted email:', result.rows[0]);
    res.status(201).json({ message: 'Email stored successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    client.release();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Something broke!' });
});

// Export the Express app for Vercel
module.exports = app;

// Only start the server if we're not in a Vercel environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`CORS enabled for origins: ${corsOptions.origin.join(', ')}`);
  });
} 