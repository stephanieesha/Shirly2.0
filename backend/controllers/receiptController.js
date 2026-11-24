const asyncHandler = require('express-async-handler')
const {
  DAY_MS,
  dailyReceiptLimit,
  checkReceiptFile,
  limitReachedMessage,
  safeFileName,
} = require('../utils/receiptRules')

// Everything the controller needs comes in as an argument, so the tests can use a fake
// database and a fixed clock.
const createReceiptController = ({ Receipt, now = () => new Date() }) => {
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

    res.status(201).json({
      receipt: {
        id: receipt._id,
        originalName: receipt.originalName,
        mediaType: receipt.mediaType,
        sizeBytes: receipt.sizeBytes,
        status: receipt.status,
      },
      remainingToday: Math.max(0, limit - recent.length),
    })
  })

  return { uploadReceipt }
}

module.exports = { createReceiptController }
