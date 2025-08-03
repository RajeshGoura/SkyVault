const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async (req, res, next) => {
  try {
    // Skip auth for static files and auth routes
    if (req.path.startsWith('/public/') || 
        req.path === '/login' || 
        req.path === '/register') {
      return next();
    }

    const token = req.cookies.token;
    
    if (!token) {
      console.log('No token found');
      return res.redirect('/user/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log('User not found');
      res.clearCookie('token');
      return res.redirect('/user/login');
    }

    // Attach user to request and response
    req.user = user;
    res.locals.user = user;
    
    console.log('Authenticated user:', user.username);
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.clearCookie('token');
    res.redirect('/user/login');
  }
};