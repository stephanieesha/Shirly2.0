const multer = require('multer')
const { maxReceiptBytes, tooLargeMessage } = require('../utils/receiptRules')

// Reads one photo, from the form field "receipt", into memory. Problems are passed to the
// error handler with a status and a message the page can show as it is.
const createUploadReceipt = ({ maxBytes = maxReceiptBytes() } = {}) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 5, parts: 10 },
  }).single('receipt')

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413)
        return next(new Error(tooLargeMessage(maxBytes)))
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        res.status(400)
        return next(new Error('Send one photo, in the "receipt" field.'))
      }
      res.status(400)
      return next(new Error('The upload could not be read. Try again.'))
    })
  }
}

module.exports = { createUploadReceipt }
