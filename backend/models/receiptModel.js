const mongoose = require('mongoose')

// One row per receipt upload. The photo itself is not kept: it is checked in memory and
// dropped, so only what is needed (who, when, what kind of file) is stored.
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
  },
  { timestamps: true }
)

receiptSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Receipt', receiptSchema)
