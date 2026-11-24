const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const { ReceiptReadError } = require('../utils/receiptReader')
const { HOUR, files, FakeReceipts, FakeItems, sampleReading, startApp, upload } = require('./helpers')

const originalEnv = { ...process.env }
const originalConsoleError = console.error
let app
afterEach(async () => {
  process.env = { ...originalEnv }
  console.error = originalConsoleError
  if (app) await app.close()
  app = null
})

const NOW = new Date('2026-11-24T12:00:00Z')
const clock = () => NOW

const myItems = () => new FakeItems([
  { _id: 'i1', user: 'ada', listName: 'dairy', name: 'Milk', brand: '' },
  { _id: 'i2', user: 'ada', listName: 'bakery', name: 'Brown bread', brand: '' },
  { _id: 'i3', user: 'ada', listName: 'dairy', name: 'Butter', brand: '', itemDisabled: true },
  { _id: 'x1', user: 'ben', listName: 'ben-list', name: 'Eggs', brand: '' },
])

// --- A good receipt -------------------------------------------------------

test('a receipt is read and its lines come back matched to the person\'s items and lists', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, items: myItems(), now: clock })
  const { status, body } = await upload(app, { bytes: files.jpeg })

  assert.equal(status, 201)
  assert.equal(body.receipt.status, 'read')
  assert.equal(body.receipt.store, 'Corner Shop')
  assert.equal(body.receipt.date, '2026-11-23')
  assert.equal(body.receipt.total, 8.5)
  assert.deepEqual(body.receipt.warnings, [])

  const [milk, bread] = body.receipt.items
  assert.equal(milk.name, 'Milk 1L')
  assert.deepEqual(milk.match, { itemId: 'i1', listId: 'dairy', name: 'Milk', confidence: 'exact' })
  assert.equal(bread.quantity, 2)
  assert.equal(bread.unitPrice, 3)
  assert.equal(bread.match.itemId, 'i2')
  assert.equal(bread.match.confidence, 'close')
})

test('what was read is saved with the receipt, ready for the review screen', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, items: myItems(), now: clock })
  await upload(app, { bytes: files.jpeg })

  const saved = receipts.rows[0]
  assert.equal(saved.status, 'read')
  assert.equal(saved.store, 'Corner Shop')
  assert.equal(saved.receiptDate, '2026-11-23')
  assert.equal(saved.total, 8.5)
  assert.equal(saved.items.length, 2)
  assert.deepEqual(saved.items[0], {
    name: 'Milk 1L', quantity: 1, unitPrice: 2.5, price: 2.5, issues: [],
    itemId: 'i1', listId: 'dairy', matchConfidence: 'exact',
  })
})

test('the photo itself is not kept anywhere', async () => {
  const receipts = new FakeReceipts(clock)
  app = await startApp({ receipts, items: myItems(), now: clock })
  await upload(app, { bytes: files.jpeg })
  const saved = receipts.rows[0]
  assert.deepEqual(Object.keys(saved).filter((key) => /buffer|image|data|photo/i.test(key)), [])
  assert.ok(!JSON.stringify(saved).includes(files.jpeg.toString('base64')))
})

test('the reader is given the photo bytes and the type found from them', async () => {
  const calls = []
  const readReceipt = async (buffer, mediaType) => {
    calls.push({ buffer, mediaType })
    return sampleReading()
  }
  app = await startApp({ receipts: new FakeReceipts(clock), readReceipt, now: clock })
  await upload(app, { bytes: files.webp, name: 'photo.jpg', type: 'image/jpeg' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].mediaType, 'image/webp')
  assert.ok(calls[0].buffer.equals(files.webp))
})

// --- Matching only uses the person's own, switched-on items ---------------

test('only the person\'s own items that are switched on are looked at', async () => {
  const items = myItems()
  const readReceipt = async () => ({
    looks_like_receipt: true,
    items: [
      { name: 'Eggs', quantity: 1, price: 3 },
      { name: 'Butter', quantity: 1, price: 4 },
    ],
  })
  app = await startApp({ receipts: new FakeReceipts(clock), items, readReceipt, now: clock })
  const { body } = await upload(app, { bytes: files.jpeg, user: 'ada' })

  assert.deepEqual(items.queries[0], { user: 'ada', itemDisabled: false })
  assert.equal(body.receipt.items[0].match, null, "another person's item is never matched")
  assert.equal(body.receipt.items[1].match, null, 'a switched-off item is not matched')
})

test('lines with no matching item come back with no match and are still kept', async () => {
  const readReceipt = async () => ({ looks_like_receipt: true, items: [{ name: 'Dish soap', quantity: 1, price: 2 }] })
  app = await startApp({ receipts: new FakeReceipts(clock), items: myItems(), readReceipt, now: clock })
  const { status, body } = await upload(app, { bytes: files.jpeg })
  assert.equal(status, 201)
  assert.equal(body.receipt.items[0].match, null)
  assert.equal(body.receipt.items[0].name, 'Dish soap')
})

// --- What the AI returns is checked ---------------------------------------

test('doubtful lines are cleaned, flagged or left out before anything is saved', async () => {
  const receipts = new FakeReceipts(clock)
  const readReceipt = async () => ({
    looks_like_receipt: true,
    total: 50,
    isAdmin: true,
    items: [
      { name: 'Milk', quantity: 'lots', price: 2, user: 'someone-else' },
      { name: '', quantity: 1, price: 1 },
      { name: 'Staff discount', quantity: 1, price: -3 },
      { name: 'Mystery item', quantity: 1, price: 'free' },
    ],
  })
  app = await startApp({ receipts, items: myItems(), readReceipt, now: clock })
  const { status, body } = await upload(app, { bytes: files.jpeg })

  assert.equal(status, 201)
  assert.deepEqual(body.receipt.items.map((i) => i.name), ['Milk', 'Mystery item'])
  assert.deepEqual(body.receipt.items[0].issues, ['Quantity was unclear, so it was set to 1.'])
  assert.deepEqual(body.receipt.items[1].issues, ['Price could not be read.'])
  assert.ok(body.receipt.warnings.some((w) => /2 lines were left out/.test(w)))
  assert.ok(body.receipt.warnings.some((w) => /add up to 2\.00 but the receipt total is 50\.00/.test(w)))
  assert.ok(!('isAdmin' in body.receipt))
  assert.ok(!('user' in body.receipt.items[0]))
  assert.equal(String(receipts.rows[0].user), 'ada')
})

// --- Receipts that cannot be read -----------------------------------------

test('a photo that is not a receipt is refused and does not use up the allowance', async () => {
  process.env.RECEIPT_LIMIT_PER_DAY = '1'
  const receipts = new FakeReceipts(clock)
  let reading = { looks_like_receipt: false, items: [] }
  app = await startApp({ receipts, now: clock, readReceipt: async () => reading })

  const refused = await upload(app, { bytes: files.jpeg })
  assert.equal(refused.status, 422)
  assert.equal(refused.body.message, "This doesn't look like a receipt. Upload a photo of a shopping receipt.")
  assert.equal(receipts.rows[0].status, 'failed')

  reading = sampleReading()
  assert.equal((await upload(app, { bytes: files.jpeg })).status, 201)
})

test('a receipt with no readable items is refused with advice', async () => {
  const receipts = new FakeReceipts(clock)
  const readReceipt = async () => ({ looks_like_receipt: true, items: [{ name: '', quantity: 1, price: 1 }] })
  app = await startApp({ receipts, now: clock, readReceipt })
  const { status, body } = await upload(app, { bytes: files.jpeg })
  assert.equal(status, 422)
  assert.match(body.message, /No items could be read/)
  assert.equal(receipts.rows[0].status, 'failed')
})

for (const [label, status, message] of [
  ['not set up', 503, "Receipt reading isn't set up on this server yet."],
  ['busy', 503, 'Receipt reading is busy right now. Try again in a minute.'],
  ['too slow', 504, 'Reading the receipt took too long. Try again.'],
]) {
  test(`when reading is ${label}, the person gets that message and the upload is marked failed`, async () => {
    const receipts = new FakeReceipts(clock)
    const readReceipt = async () => { throw new ReceiptReadError(message, status) }
    app = await startApp({ receipts, now: clock, readReceipt })
    const result = await upload(app, { bytes: files.jpeg })
    assert.equal(result.status, status)
    assert.equal(result.body.message, message)
    assert.equal(receipts.rows[0].status, 'failed')
  })
}

test('an unexpected reader failure gives a plain message, with no details', async () => {
  console.error = () => {}
  const receipts = new FakeReceipts(clock)
  const readReceipt = async () => { throw new TypeError('secret internal detail') }
  app = await startApp({ receipts, now: clock, readReceipt })
  const { status, body } = await upload(app, { bytes: files.jpeg })
  assert.equal(status, 502)
  assert.equal(body.message, 'Could not read this receipt. Try again.')
  assert.ok(!JSON.stringify(body).includes('secret internal detail'))
  assert.equal(receipts.rows[0].status, 'failed')
})

test('a failed read does not use up the daily allowance', async () => {
  process.env.RECEIPT_LIMIT_PER_DAY = '2'
  const receipts = new FakeReceipts(clock)
  let broken = true
  const readReceipt = async () => {
    if (broken) throw new ReceiptReadError('Reading the receipt took too long. Try again.', 504)
    return sampleReading()
  }
  app = await startApp({ receipts, now: clock, readReceipt })
  for (let i = 0; i < 4; i += 1) assert.equal((await upload(app, { bytes: files.jpeg })).status, 504)
  broken = false
  assert.equal((await upload(app, { bytes: files.jpeg })).body.remainingToday, 1)
  assert.equal((await upload(app, { bytes: files.jpeg })).body.remainingToday, 0)
  assert.equal((await upload(app, { bytes: files.jpeg })).status, 429)
})

test('the reader is never called for a file that fails the checks, or when over the limit', async () => {
  process.env.RECEIPT_LIMIT_PER_DAY = '1'
  let calls = 0
  const readReceipt = async () => { calls += 1; return sampleReading() }
  const receipts = new FakeReceipts(clock)
  receipts.seed({ user: 'ada', createdAt: new Date(NOW.getTime() - HOUR) })
  app = await startApp({ receipts, now: clock, readReceipt, maxBytes: 1024 })
  await upload(app, { bytes: files.pdf })
  await upload(app, { bytes: Buffer.concat([files.jpeg, Buffer.alloc(2000)]) })
  await upload(app, { bytes: files.heic })
  await upload(app, { bytes: files.jpeg })
  assert.equal(calls, 0, 'no paid reading was started for any of these')
})
