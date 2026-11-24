// Shared setup for the receipt tests: a fake database, a small test app, and sample files.
// Nothing here needs MongoDB, the network or an API key.

const express = require('express')
const { errorHandler } = require('../middleware/errorMiddleware')
const { createReceiptRouter } = require('../routes/receiptRoutes')
const { createUploadReceipt } = require('../middleware/uploadReceipt')

const HOUR = 60 * 60 * 1000

const zeros = (n) => Buffer.alloc(n)
const files = {
  jpeg: Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), zeros(40)]),
  png: Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), zeros(40)]),
  webp: Buffer.concat([Buffer.from('RIFF'), zeros(4), Buffer.from('WEBP'), zeros(40)]),
  heic: Buffer.concat([zeros(4), Buffer.from('ftypheic'), zeros(40)]),
  pdf: Buffer.from('%PDF-1.4 not a photo, just some text that is long enough'),
  text: Buffer.from('this is not an image at all, only some plain text'),
}

// Just enough of a mongoose model for the code under test: create, find, deleteOne.
class FakeReceipts {
  constructor(now = () => new Date()) {
    this.rows = []
    this.nextId = 1
    this.now = now
  }

  seed(row) {
    const saved = { _id: `seed-${this.nextId++}`, status: 'read', createdAt: this.now(), ...row }
    this.rows.push(saved)
    return saved
  }

  async create(data) {
    const row = { _id: `r${this.nextId++}`, createdAt: this.now(), save: async () => {}, ...data }
    this.rows.push(row)
    return row
  }

  async find(query) {
    return this.rows.filter((row) =>
      String(row.user) === String(query.user) &&
      (!query.createdAt || row.createdAt >= query.createdAt.$gte) &&
      (!query.status || row.status !== query.status.$ne))
  }

  async deleteOne({ _id }) {
    this.rows = this.rows.filter((row) => row._id !== _id)
  }
}

// Just enough of the items model: the person's own items, with the switched-off ones filtered out.
class FakeItems {
  constructor(rows = []) {
    this.rows = rows
    this.queries = []
  }

  async find(query) {
    this.queries.push(query)
    return this.rows.filter((row) =>
      String(row.user) === String(query.user) &&
      (query.itemDisabled === undefined || Boolean(row.itemDisabled) === query.itemDisabled))
  }
}

// What the AI reader returns by default: a small, valid receipt.
const sampleReading = () => ({
  looks_like_receipt: true,
  store: 'Corner Shop',
  date: '2026-11-23',
  total: 8.5,
  items: [
    { name: 'Milk 1L', quantity: 1, price: 2.5 },
    { name: 'Bread', quantity: 2, price: 6 },
  ],
})

// The login check is replaced by a header, so a test can be "logged in" as any user.
const fakeProtect = (calls = { count: 0 }) => (req, res, next) => {
  calls.count += 1
  const id = req.headers['x-test-user']
  if (!id) {
    res.status(401)
    return next(new Error('Token Authorized'))
  }
  req.user = { _id: id }
  next()
}

const startApp = async ({ receipts, items = new FakeItems(), readReceipt = async () => sampleReading(), maxBytes, now, protectRoute, ...extra } = {}) => {
  const app = express()
  app.use(express.json())
  app.use('/api/receipts', createReceiptRouter({
    protectRoute: protectRoute || fakeProtect(),
    Receipt: receipts,
    Item: items,
    readReceipt,
    upload: createUploadReceipt({ maxBytes: maxBytes || 1024 * 1024 }),
    now,
    ...extra,
  }))
  app.use(errorHandler)
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  return {
    url: `http://127.0.0.1:${server.address().port}/api/receipts`,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

// Sends a file the way the browser does: a multipart form with the photo in "receipt".
const upload = async (app, { bytes, name = 'receipt.jpg', type = 'image/jpeg', field = 'receipt', user = 'ada' } = {}) => {
  const form = new FormData()
  if (bytes) form.append(field, new Blob([bytes], { type }), name)
  const headers = user ? { 'x-test-user': user } : {}
  const response = await fetch(app.url, { method: 'POST', body: form, headers })
  return { status: response.status, body: await response.json() }
}

module.exports = { HOUR, files, FakeReceipts, FakeItems, sampleReading, fakeProtect, startApp, upload }
