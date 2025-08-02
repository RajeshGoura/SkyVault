const supabase = require('../config/supabase');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const fileName = `${Date.now()}_${req.file.originalname}`;

  const { data, error } = await supabase.storage
    .from('user-files') 
    .upload(`uploads/${fileName}`, req.file.buffer, {
      contentType: req.file.mimetype,
    });

  if (error) return res.status(500).send("Upload failed: " + error.message);

  // Set success flash message
  req.session.uploadSuccess = true;
  res.redirect('/home');
};

const listFiles = async (req, res) => {
  try {
    const { data: files, error } = await supabase.storage
      .from('user-files')
      .list('uploads');

    if (error) throw error;

    const filesWithUrls = files.map(file => {
      // Manually construct the URL to ensure correct format
      const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/user-files/uploads/${file.name}`;
      
      return {
        ...file,
        downloadUrl: publicUrl,
        // Alternative method using getPublicUrl()
        signedUrl: supabase.storage
          .from('user-files')
          .getPublicUrl(`uploads/${file.name}`).data.publicUrl
      };
    });

    res.render('home', {
      files: filesWithUrls,
      uploadSuccess: req.session.uploadSuccess || false
    });
    
    req.session.uploadSuccess = false;
  } catch (err) {
    console.error("Error listing files:", err);
    res.status(500).render('home', {
      files: [],
      error: "Error loading files"
    });
  }
};

module.exports = {
  upload,
  uploadFile,
  listFiles
};