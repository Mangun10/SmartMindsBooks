const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
console.log("Server is starting...");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Global MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    isConnected = mongoose.connection.readyState === 1;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Ensure database connection before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
console.log('Registering routes...');
app.use('/api/books', require('./routes/books'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth'));
console.log('Routes registered successfully');

// Serve static files
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/products.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/admin-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;

// Export for Vercel (always export the app)
module.exports = app;

// Only start the server if not in Vercel environment
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}