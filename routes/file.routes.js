//routes/file.routes.js
const express = require('express');
const router = express.Router();
const { uploadFile, listFiles, downloadFile } = require('../controllers/file.controller');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Debug middleware
router.use((req, res, next) => {
  console.log(`File route: ${req.method} ${req.path}`);
  console.log('Authenticated user:', req.user?.username);
  next();
});

// Home page with file list
router.get('/home', auth, async (req, res) => {
  try {
    if (!req.user) {
      console.error('No user found in request');
      return res.redirect('/user/login');
    }

    console.log('Rendering home page for:', req.user.username);
    
    // Get files using the user method
    const files = await req.user.getFiles();
    console.log('Files found:', files.length);

    res.render('home', {
      user: req.user,
      files: files || [],
      loginSuccess: req.session.loginSuccess || false,
      uploadSuccess: req.session.uploadSuccess || false
    });

    // Clear session messages
    if (req.session) {
      req.session.loginSuccess = false;
      req.session.uploadSuccess = false;
    }
  } catch (err) {
    console.error('Home route error:', err);
    res.status(500).render('error', { error: 'Failed to load files' });
  }
});

// File upload
router.post('/upload', auth, upload.single('file'), uploadFile);

// File download
router.get('/download/:id', auth, downloadFile);

module.exports = router;