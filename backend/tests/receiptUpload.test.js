const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const { HOUR, files, FakeReceipts, fakeProtect, startApp, upload } = require('./helpers')

const originalEnv = { ...process.env }
let app
afterEach(async () => {
  process.env = { ...originalEnv }
  if (app) await app.close()
  app = null
})

const NOW = new Date('2026-11-24T12:00:00Z')
const clock = () => NOW

// --- Who can upload -------------------------------------------------------

test('a visitor who is not logged in is turned away before the file is read', async () => {
  const receipts = new FakeReceipts(clock)
  const calls = { count: 0 }
  app = await startApp({ receipts, now: clock, protectRoute: fakeProtect(calls) })
  const { status } = await upload(app, { bytes: files.jpeg, user: null })
  assert.equal(status, 401)
  assert.equal(calls.count, 1)
  assert.equal(receipts.rows.length, 0)
})

// --- File type ------------------------------------------------------------

for (const [label, bytes, mediaType] of [['JPEG', files.jpeg, 'image/jpeg'], ['PNG', files.png, 'image/png'], ['WebP', files.webp, 'image/webp']]) {
  test(`a ${label} photo is accepted and recorded`, async () => {
    const receipts = new FakeReceipts(clock)
    app = await startApp({ receipts, now: clock })
    const { status, body } = await upload(app, { bytes, type: mediaType })
    assert.equal(status, 201)
    assert.equal(body.receipt.mediaType, mediaType)
    assert.equal(body.receipt.status, 'read')
    assert.equal(body.receipt.sizeBytes, bytes.length)
    assert.equal(receipts.rows.length, 1)
    assert.equal(String(receipts.rows[0].user), 'ada')
  })
}

test('the real contents decide the type, not the name or the type the browser sent', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock })
  const { status, body } = await upload(app, { bytes: files.png, name: 'photo.jpg', type: 'image/jpeg' })
  assert.equal(status, 201)
  assert.equal(body.receipt.mediaType, 'image/png')
})

test('a text file renamed to .jpg is refused', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock })
  const { status, body } = await upload(app, { bytes: files.text, name: 'receipt.jpg', type: 'image/jpeg' })
  assert.equal(status, 415)
  assert.equal(body.message, 'Upload a JPEG, PNG or WebP photo of the receipt.')
  assert.equal(receipts.rows.length, 0)
})

test('a PDF is refused', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock })
  const { status } = await upload(app, { bytes: files.pdf, name: 'receipt.pdf', type: 'application/pdf' })
  assert.equal(status, 415)
  assert.equal(receipts.rows.length, 0)
})

test('an iPhone HEIC photo gets a message that says how to fix it', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock })
  const { status, body } = await upload(app, { bytes: files.heic, name: 'IMG_0042.HEIC', type: 'image/heic' })
  assert.equal(status, 415)
  assert.match(body.message, /HEIC/)
  assert.match(body.message, /Most Compatible/)
  assert.equal(receipts.rows.length, 0)
})

// --- Missing, empty or misplaced files ------------------------------------

test('no file at all is refused', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock })
  const { status, body } = await upload(app, {})
  assert.equal(status, 400)
  assert.equal(body.message, 'Choose a receipt photo to upload.')
})

test('an empty file is refused', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock })
  const { status, body } = await upload(app, { bytes: Buffer.alloc(0) })
  assert.equal(status, 400)
  assert.equal(body.message, 'That file is empty.')
})

test('a file sent under the wrong field name is refused', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock })
  const { status, body } = await upload(app, { bytes: files.jpeg, field: 'photo' })
  assert.equal(status, 400)
  assert.match(body.message, /"receipt" field/)
  assert.equal(receipts.rows.length, 0)
})

// --- Size -----------------------------------------------------------------

test('a photo over the size limit is refused and nothing is saved', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock, maxBytes: 1024 })
  const big = Buffer.concat([files.jpeg, Buffer.alloc(2000)])
  const { status, body } = await upload(app, { bytes: big })
  assert.equal(status, 413)
  assert.match(body.message, /larger than/)
  assert.equal(receipts.rows.length, 0)
})

test('a photo just under the size limit is accepted', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock, maxBytes: 1024 })
  const nearlyFull = Buffer.concat([files.jpeg, Buffer.alloc(1024 - files.jpeg.length)])
  assert.equal(nearlyFull.length, 1024)
  const { status } = await upload(app, { bytes: nearlyFull })
  assert.equal(status, 201)
})

// --- Daily limit ----------------------------------------------------------

test('the answer says how many uploads are left today', async () => {
  process.env.RECEIPT_LIMIT_PER_DAY = '3'
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock })
  assert.equal((await upload(app, { bytes: files.jpeg })).body.remainingToday, 2)
  assert.equal((await upload(app, { bytes: files.jpeg })).body.remainingToday, 1)
  assert.equal((await upload(app, { bytes: files.jpeg })).body.remainingToday, 0)
})

test('the upload after the limit is refused with the time to wait, and is not kept', async () => {
  process.env.RECEIPT_LIMIT_PER_DAY = '2'
  const receipts = new FakeReceipts(clock)
  receipts.seed({ user: 'ada', createdAt: new Date(NOW.getTime() - 5 * HOUR) })
  receipts.seed({ user: 'ada', createdAt: new Date(NOW.getTime() - 1 * HOUR) })
  app = await startApp({ receipts, now: clock })
  const { status, body } = await upload(app, { bytes: files.jpeg })
  assert.equal(status, 429)
  assert.equal(body.message, 'You have used all 2 receipt uploads for today. You can upload again in about 19 hours.')
  assert.equal(receipts.rows.length, 2, 'the refused upload is not saved')
})

test('the limit is per person', async () => {
  process.env.RECEIPT_LIMIT_PER_DAY = '1'
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock })
  assert.equal((await upload(app, { bytes: files.jpeg, user: 'ada' })).status, 201)
  assert.equal((await upload(app, { bytes: files.jpeg, user: 'ada' })).status, 429)
  assert.equal((await upload(app, { bytes: files.jpeg, user: 'ben' })).status, 201)
})

test('uploads older than 24 hours no longer count', async () => {
  process.env.RECEIPT_LIMIT_PER_DAY = '1'
  const receipts = new FakeReceipts(clock)
  receipts.seed({ user: 'ada', createdAt: new Date(NOW.getTime() - 25 * HOUR) })
  app = await startApp({ receipts, now: clock })
  assert.equal((await upload(app, { bytes: files.jpeg })).status, 201)
})

test('receipts that failed to read do not count', async () => {
  process.env.RECEIPT_LIMIT_PER_DAY = '1'
  const receipts = new FakeReceipts(clock)
  receipts.seed({ user: 'ada', status: 'failed', createdAt: new Date(NOW.getTime() - HOUR) })
  app = await startApp({ receipts, now: clock })
  assert.equal((await upload(app, { bytes: files.jpeg })).status, 201)
})

test('refused uploads (wrong type, too big) do not use up the allowance', async () => {
  process.env.RECEIPT_LIMIT_PER_DAY = '1'
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock, maxBytes: 1024 })
  await upload(app, { bytes: files.pdf })
  await upload(app, { bytes: Buffer.concat([files.jpeg, Buffer.alloc(2000)]) })
  assert.equal((await upload(app, { bytes: files.jpeg })).status, 201)
})

test('uploads sent at the same moment cannot all slip under the limit', async () => {
  process.env.RECEIPT_LIMIT_PER_DAY = '2'
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, now: clock })
  const results = await Promise.all(Array.from({ length: 5 }, () => upload(app, { bytes: files.jpeg })))
  const accepted = results.filter((r) => r.status === 201).length
  assert.ok(accepted <= 2, `${accepted} uploads were accepted with a limit of 2`)
  assert.ok(accepted >= 1)
  assert.ok(results.every((r) => r.status === 201 || r.status === 429))
})

// --- The route the server really mounts ------------------------------------

test('the real route, with the real login check, refuses a request that has no token', async () => {
  const express = require('express')
  const { errorHandler } = require('../middleware/errorMiddleware')
  const realRouter = require('../routes/receiptRoutes')

  const server = express()
  server.use('/api/receipts', realRouter)
  server.use(errorHandler)
  const listener = await new Promise((resolve) => {
    const s = server.listen(0, '127.0.0.1', () => resolve(s))
  })
  try {
    const form = new FormData()
    form.append('receipt', new Blob([files.jpeg], { type: 'image/jpeg' }), 'receipt.jpg')
    const response = await fetch(`http://127.0.0.1:${listener.address().port}/api/receipts`, { method: 'POST', body: form })
    assert.equal(response.status, 401)
  } finally {
    await new Promise((resolve) => listener.close(resolve))
  }
})
