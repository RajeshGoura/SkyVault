const express = require('express');
const router = express.Router();
const { uploadFile, listFiles, downloadFile } = require('../controllers/file.controller');
const auth = require('../middleware/auth');
const upload = require('../config/multer'); // Import the multer config

// Debug middleware
router.use((req, res, next) => {
  console.log(`File route: ${req.method} ${req.path}`);
  console.log('Authenticated user:', req.user?.username);
  next();
});

// Home page with file list
router.get('/home', auth, async (req, res) => {
  try {
    const files = await req.user.getFiles();
    
    res.render('home', {
      user: req.user,
      files: files || [],
      loginSuccess: req.session.loginSuccess,
      uploadSuccess: req.session.uploadSuccess
    });

    // Clear session messages
    req.session.loginSuccess = false;
    req.session.uploadSuccess = false;
  } catch (err) {
    console.error('Home error:', err);
    res.status(500).render('error', { error: 'Failed to load files' });
  }
});

// Fixed file upload route with proper middleware order
router.post('/upload', 
  auth, // Authentication first
  upload.single('file'), // Then file processing
  uploadFile // Then controller
);

// File download
router.get('/download/:id', auth, downloadFile);

module.exports = router;