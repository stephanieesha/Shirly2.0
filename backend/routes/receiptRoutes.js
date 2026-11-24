const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { createUploadReceipt } = require('../middleware/uploadReceipt')
const { createReceiptController } = require('../controllers/receiptController')

// The login check runs before the upload is read, so a visitor who is not logged in
// cannot make the server read a large file.
const createReceiptRouter = ({ protectRoute, Receipt, upload = createUploadReceipt(), now }) => {
  const { uploadReceipt } = createReceiptController({ Receipt, now })
  const router = express.Router()
  router.use(protectRoute)
  router.post('/', upload, uploadReceipt)
  return router
}

module.exports = createReceiptRouter({
  protectRoute: protect,
  Receipt: require('../models/receiptModel'),
})
module.exports.createReceiptRouter = createReceiptRouter
