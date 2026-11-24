const asyncHandler = require('express-async-handler')
const {
  DAY_MS,
  dailyReceiptLimit,
  checkReceiptFile,
  limitReachedMessage,
  safeFileName,
} = require('../utils/receiptRules')
const { ReceiptReadError } = require('../utils/receiptReader')
const { validateReceiptData } = require('../utils/receiptValidation')
const { matchItemsToLists } = require('../utils/receiptMatcher')

// Everything the controller needs comes in as an argument, so the tests can use a fake
// database, a fake reader and a fixed clock.
const createReceiptController = ({ Receipt, Item, readReceipt, now = () => new Date() }) => {
  const uploadReceipt = asyncHandler(async (req, res) => {
    const check = checkReceiptFile(req.file)
    if (!check.ok) {
      res.status(check.status)
      throw new Error(check.message)
    }

    // Save first, then count: two uploads sent at the same moment cannot both slip under
    // the limit. A receipt that turns out to be over the limit is removed again.
    const receipt = await Receipt.create({
      user: req.user._id,
      originalName: safeFileName(req.file.originalname),
      mediaType: check.mediaType,
      sizeBytes: req.file.size,
      status: 'uploaded',
    })

    const limit = dailyReceiptLimit()
    const since = new Date(now().getTime() - DAY_MS)
    const recent = await Receipt.find({
      user: req.user._id,
      createdAt: { $gte: since },
      status: { $ne: 'failed' },
    })

    if (recent.length > limit) {
      await Receipt.deleteOne({ _id: receipt._id })
      const oldest = recent
        .map((r) => new Date(r.createdAt).getTime())
        .sort((a, b) => a - b)[0]
      res.status(429)
      throw new Error(limitReachedMessage(limit, oldest, now()))
    }

    // A receipt that cannot be read is marked failed, so it does not use up the allowance.
    const fail = async (status, message) => {
      receipt.status = 'failed'
      await receipt.save()
      res.status(status)
      throw new Error(message)
    }

    let raw
    try {
      raw = await readReceipt(req.file.buffer, check.mediaType)
    } catch (error) {
      if (error instanceof ReceiptReadError) return fail(error.status, error.message)
      console.error('Receipt reading failed:', error && error.message)
      return fail(502, 'Could not read this receipt. Try again.')
    }

    if (raw && raw.looks_like_receipt === false) {
      return fail(422, "This doesn't look like a receipt. Upload a photo of a shopping receipt.")
    }

    const data = validateReceiptData(raw, { now: now() })
    if (data.items.length === 0) {
      return fail(422, 'No items could be read from this photo. Try a flatter, brighter photo of the whole receipt.')
    }

    // Only the person's own items that are still switched on can be matched.
    const userItems = await Item.find({ user: req.user._id, itemDisabled: false })
    const items = matchItemsToLists(data.items, userItems)

    receipt.status = 'read'
    receipt.store = data.store
    receipt.receiptDate = data.date
    receipt.total = data.total
    receipt.warnings = data.warnings
    receipt.items = items.map((line) => ({
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      price: line.price,
      issues: line.issues,
      itemId: line.match ? line.match.itemId : null,
      listId: line.match ? line.match.listId : null,
      matchConfidence: line.match ? line.match.confidence : null,
    }))
    await receipt.save()

    res.status(201).json({
      receipt: {
        id: receipt._id,
        originalName: receipt.originalName,
        mediaType: receipt.mediaType,
        sizeBytes: receipt.sizeBytes,
        status: receipt.status,
        store: data.store,
        date: data.date,
        total: data.total,
        warnings: data.warnings,
        items,
      },
      remainingToday: Math.max(0, limit - recent.length),
    })
  })

  return { uploadReceipt }
}

module.exports = { createReceiptController }
