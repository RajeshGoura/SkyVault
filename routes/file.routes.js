// routes/file.routes.js
const express = require('express');
const router = express.Router();
const { upload, uploadFile, listFiles } = require('../controllers/file.controller');

// Show home page with file list
router.get('/home', listFiles);

// Handle upload
router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;
