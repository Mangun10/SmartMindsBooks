const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('Auth route loaded successfully');

// Test endpoint
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Auth route is working!' });
});

// Simple admin login
router.post('/login', async (req, res) => {
  console.log('Login route hit:', req.body);
  console.log('Expected username:', process.env.ADMIN_USERNAME);
  console.log('Expected password:', process.env.ADMIN_PASSWORD);
  console.log('JWT Secret exists:', !!process.env.JWT_SECRET);
  try {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { username: username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token: token,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

router.verifyAdmin = verifyAdmin;
module.exports = router;