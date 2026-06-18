const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const familyController = require('./controllers/familyController');
const recordController = require('./controllers/recordController');

const app = express();
const PORT = 3001;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('只允许上传图片文件'));
  }
});

const compressImage = async (req, res, next) => {
  if (!req.file) return next();
  
  const filePath = req.file.path;
  const ext = path.extname(filePath).toLowerCase();
  const compressedPath = path.join(path.dirname(filePath), 'compressed_' + path.basename(filePath));
  
  try {
    if (ext === '.gif') {
      fs.renameSync(filePath, compressedPath);
      req.file.path = compressedPath;
      req.file.filename = path.basename(compressedPath);
    } else {
      await sharp(filePath)
        .resize({ width: 800, withoutEnlargement: true })
        .toFormat('jpeg', { quality: 85 })
        .toFile(compressedPath);
      
      fs.unlinkSync(filePath);
      req.file.path = compressedPath;
      req.file.filename = path.basename(compressedPath);
      req.file.originalname = req.file.originalname.replace(path.extname(req.file.originalname), '.jpg');
    }
    next();
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath);
    next(err);
  }
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'uploads')));

app.upload = upload;
app.compressImage = compressImage;

familyController(app);
recordController(app);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
