const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'assets')));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

// Add response logging middleware
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    console.log('Response:', {
      url: req.url,
      method: req.method,
      status: res.statusCode,
      data: data
    });
    return originalJson.call(this, data);
  };
  next();
});

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: 'postgresql://hackindia_euz3_user:WeAxCS1RgaV6F7kTfNIIK5Z6w7BAvNzt@dpg-cvm88dggjchc73cfu090-a.singapore-postgres.render.com/hackindia_euz3',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test database connection immediately and create table if needed
(async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    
    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Emails table created or already exists');
  } catch (err) {
    console.error('Database initialization error:', err);
  } finally {
    if (client) {
      client.release();
    }
  }
})();

// API endpoint to store email
app.post('/api/subscribe', async (req, res) => {
  console.log('Received subscription request:', req.body);
  
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email) {
      console.log('No email provided in request');
      return res.status(400).json({ 
        success: false,
        error: 'Email is required' 
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format' 
      });
    }

    const client = await pool.connect();
    
    try {
      // Check if email exists
      const existingEmail = await client.query(
        'SELECT email FROM emails WHERE email = $1',
        [email]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Email already exists' 
        });
      }

      // Insert email
      const result = await client.query(
        'INSERT INTO emails (email) VALUES ($1) RETURNING *',
        [email]
      );
      
      console.log('Successfully inserted email:', result.rows[0]);
      return res.status(201).json({ 
        success: true,
        message: 'Email stored successfully', 
        data: result.rows[0] 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  console.log('Received chat request:', req.body);
  
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: 'Prompt is required' 
      });
    }

    // For now, return a simple response
    return res.status(200).json({ 
      success: true,
      data: {
        message: "Hello! I'm Coffee-coders.ai, your friendly AI assistant. How can I help you today?",
        metadata: {
          response_type: "general",
          topic: "Greeting",
          complexity: "Low"
        }
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    console.log('CORS enabled for all origins');
  });
} 