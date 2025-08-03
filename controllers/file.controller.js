const File = require('../models/file.model');
const supabase = require('../config/supabase');

const uploadFile = async (req, res) => {
  try {
    // First check if file exists
    if (!req.file) {
      throw new Error('No file uploaded. Make sure your form has enctype="multipart/form-data"');
    }

    console.log('Received file:', {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

    // Create unique filename
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const filePath = `users/${req.user._id}/${fileName}`;

    // Upload to Supabase
    const { error } = await supabase.storage
      .from('user-files')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Save to MongoDB
    const file = new File({
      filename: req.file.originalname,
      path: filePath,
      size: req.file.size,
      mimetype: req.file.mimetype,
      owner: req.user._id
    });

    await file.save();
    console.log('File saved to database:', file);

    req.session.uploadSuccess = true;
    res.redirect('/home');
    
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).render('error', { 
      error: `Upload failed: ${err.message}`
    });
  }
};

const listFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.render('home', {
      user: req.user,
      files: files,
      loginSuccess: req.session.loginSuccess,
      uploadSuccess: req.session.uploadSuccess
    });
  } catch (err) {
    res.status(500).render('error', { error: err.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Get download URL
    const { data: { signedUrl } } = await supabase.storage
      .from('user-files')
      .createSignedUrl(file.path, 3600); // 1 hour expiry

    res.redirect(signedUrl);
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