//routes/user.routes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs'); // Changed to bcryptjs which is more reliable
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Debug middleware
router.use((req, res, next) => {
  console.log(`User route: ${req.method} ${req.path}`);
  next();
});

// GET register page
router.get('/register', (req, res) => {
  res.render('register', { errors: null });
});

// POST register
router.post('/register',
  [
    body('email').trim().isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render('register', { errors: errors.array() });
      }

      const { username, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.render('register', { 
          errors: [{ msg: 'Username or email already exists' }] 
        });
      }

      // Create user with hashed password
      const user = new User({ username, email, password });
      await user.save(); // The pre-save hook will hash the password

      // Generate token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1d'
      });

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.redirect('/home');
    } catch (err) {
      console.error('Registration error:', err);
      return res.render('register', { 
        errors: [{ msg: 'Registration failed. Please try again.' }] 
      });
    }
  }
);

// GET login page
router.get('/login', (req, res) => {
  res.render('login', { errors: null });
});

// POST login
router.post('/login',
  [
    body('username').trim().notEmpty().withMessage('Username required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render('login', { errors: errors.array() });
      }

      const { username, password } = req.body;
      
      // Find user by username
      const user = await User.findOne({ username });
      
      if (!user) {
        return res.render('login', { 
          errors: [{ msg: 'Invalid credentials' }] 
        });
      }

      // Compare passwords with bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password comparison result:', isMatch); // Debug log
      
      if (!isMatch) {
        return res.render('login', { 
          errors: [{ msg: 'Invalid credentials' }] // Generic message for security
        });
      }

      // Generate token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.redirect('/home');
    } catch (err) {
      console.error('Login error:', err);
      return res.render('login', { 
        errors: [{ msg: 'Login failed. Please try again.' }] 
      });
    }
  }
);

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/user/login');
});

module.exports = router;