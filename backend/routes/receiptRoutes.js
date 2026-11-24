const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { createUploadReceipt } = require('../middleware/uploadReceipt')
const { createReceiptController } = require('../controllers/receiptController')
const { createReceiptReader } = require('../utils/receiptReader')

// The login check runs before the upload is read, so a visitor who is not logged in
// cannot make the server read a large file.
const createReceiptRouter = ({ protectRoute, Receipt, Item, readReceipt, upload = createUploadReceipt(), now }) => {
  const { uploadReceipt } = createReceiptController({ Receipt, Item, readReceipt, now })
  const router = express.Router()
  router.use(protectRoute)
  router.post('/', upload, uploadReceipt)
  return router
}

module.exports = createReceiptRouter({
  protectRoute: protect,
  Receipt: require('../models/receiptModel'),
  Item: require('../models/itemModel'),
  readReceipt: createReceiptReader(),
})
module.exports.createReceiptRouter = createReceiptRouter
