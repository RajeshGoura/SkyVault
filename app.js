//app.js
const express = require('express');
const app = express();
const userRouter = require('./routes/user.routes');
const fileRouter = require('./routes/file.routes');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');

dotenv.config();

// Database connection
require('./config/db')();

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false, // Changed to false for security
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// User middleware - simplified
app.use(async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.locals.user = await User.findById(decoded.id);
    } catch (err) {
      console.error('User middleware token error:', err);
    }
  }
  next();
});

// Routes
app.use('/user', userRouter);
app.use('/', fileRouter);

// Home route
app.get('/', (req, res) => {
  res.redirect(res.locals.user ? '/home' : '/user/login');
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).render('error', { 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});