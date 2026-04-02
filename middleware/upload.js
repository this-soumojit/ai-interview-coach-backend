const multer = require('multer');

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Use a plain Error — multer v2 no longer has multer.MulterError on the default export
    cb(new Error(`UNSUPPORTED_FILE_TYPE: Only PDF and DOCX are accepted, got: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

module.exports = upload;
