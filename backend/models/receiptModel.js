const mongoose = require('mongoose')

// What was read from one line of the receipt, and which of the person's items it matched.
const receiptLineSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    issues: { type: [String], default: [] },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    listId: { type: mongoose.Schema.Types.ObjectId, ref: 'ListName', default: null },
    matchConfidence: { type: String, enum: ['exact', 'close', null], default: null },
  },
  { _id: false }
)

// One row per receipt upload. The photo itself is not kept: it is checked and read in
// memory and then dropped, so only what was read from it is stored.
const receiptSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalName: { type: String, default: 'receipt' },
    mediaType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    // 'failed' receipts do not count towards the daily limit.
    status: { type: String, enum: ['uploaded', 'read', 'failed'], default: 'uploaded' },
    store: { type: String, default: '' },
    receiptDate: { type: String, default: null }, // YYYY-MM-DD as printed on the receipt
    total: { type: Number, default: null },
    items: { type: [receiptLineSchema], default: [] },
    warnings: { type: [String], default: [] },
  },
  { timestamps: true }
)

receiptSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Receipt', receiptSchema)
