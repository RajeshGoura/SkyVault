//middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async (req, res, next) => {
  try {
    // Skip authentication for login and register routes
    if (req.path === '/login' || req.path === '/register') {
      return next();
    }

    const token = req.cookies.token;
    
    if (!token) {
      console.log('No token found, redirecting to login');
      return res.redirect('/user/login');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Find user and attach all methods
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found in database');
      return res.redirect('/user/login');
    }

    // Properly attach the full user model with methods
    req.user = user;
    res.locals.user = user; // Also make available to views
    
    console.log('Authenticated user:', user.username);
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.clearCookie('token');
    res.redirect('/user/login');
  }
};