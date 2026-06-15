const mongoose = require('mongoose')

const purchaseSnapshotSchema = mongoose.Schema(
  {
    name: String,
    brand: String,
    unitPrice: Number,
    quantity: Number,
    price: Number,
    frequency: String,
    comment: String,
  },
  {
    _id: false,
    timestamps: { createdAt: false, updatedAt: 'updatedAt' },
  }
)

const itemSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ListName',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: '' },
    unitPrice: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    frequency: { type: String, default: 'weekly' },
    comment: { type: String, default: '' },
    totalSpent: { type: Number, default: 0 },
    boughtAt: { type: [purchaseSnapshotSchema], default: [] },
    shoppingInProgress: { type: Boolean, default: false },
    itemDisabled: { type: Boolean, default: false },
  },
  { timestamps: true }
)

itemSchema.virtual('lastBought').get(function () {
  if (!this.boughtAt || this.boughtAt.length === 0) return null
  return this.boughtAt.reduce((latest, entry) => {
    return new Date(entry.updatedAt) > new Date(latest.updatedAt) ? entry : latest
  }).updatedAt
})

itemSchema.virtual('daysSinceLastBought').get(function () {
  const last = this.lastBought
  if (!last) return null
  const diff = Date.now() - new Date(last).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

itemSchema.set('toJSON', { virtuals: true })
itemSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Item', itemSchema, 'lists')