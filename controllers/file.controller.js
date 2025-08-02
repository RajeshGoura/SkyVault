//controllers/file.controller.js
const File = require('../models/file.model');
const supabase = require('../config/supabase');
const multer = require('multer');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const filePath = `uploads/${req.user._id}/${fileName}`;

    // Upload to Supabase
    const { error } = await supabase.storage
      .from('user-files')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) throw error;

    // Save to MongoDB
    const file = new File({
      filename: req.file.originalname,
      path: filePath,
      size: req.file.size,
      mimetype: req.file.mimetype,
      owner: req.user._id
    });

    await file.save();

    req.session.uploadSuccess = true;
    res.redirect('/home');
  } catch (err) {
    res.status(500).render('error', { error: err.message });
  }
};

const listFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id }).sort({ createdAt: -1 });

    res.render('home', {
      user: req.user,
      files: files.map(file => file.toObject()),
      loginSuccess: req.session.loginSuccess || false,
      uploadSuccess: req.session.uploadSuccess || false
    });
    
    if (req.session) {
      req.session.loginSuccess = false;
      req.session.uploadSuccess = false;
    }
  } catch (err) {
    res.status(500).render('error', { error: err.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    
    if (!file) {
      throw new Error('File not found');
    }

    // Get the file data from Supabase
    const { data, error } = await supabase.storage
      .from('user-files')
      .download(file.path);

    if (error) throw error;

    // Set proper headers for file download
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': file.size
    });

    // Send the file data
    res.send(await data.arrayBuffer());
  } catch (err) {
    console.error('Download error:', err);
    res.status(404).render('error', { error: err.message });
  }
};

module.exports = {
  uploadFile,
  listFiles,
  downloadFile
};