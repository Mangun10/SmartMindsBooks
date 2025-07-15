// Simple test script to check if the server starts
const express = require('express');
require('dotenv').config();

const app = express();

app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Try to load the auth route
try {
  const authRoute = require('./routes/auth');
  app.use('/api/auth', authRoute);
  console.log('✅ Auth route loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth route:', error.message);
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📍 Test URL: http://localhost:${PORT}/test`);
  console.log(`🔑 Auth test URL: http://localhost:${PORT}/api/auth/test`);
});
