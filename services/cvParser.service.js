const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');

/**
 * Extracts plain text from an uploaded file buffer.
 *
 * @param {Buffer} buffer   - The raw file bytes from multer memoryStorage.
 * @param {string} mimetype - The MIME type reported by multer.
 * @returns {Promise<string>} The extracted plain-text content.
 */
async function parseCVFile(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (mimetype.includes('wordprocessingml')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Unsupported MIME type for CV parsing: ${mimetype}`);
}

module.exports = { parseCVFile };
