const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const {
  maxReceiptBytes,
  dailyReceiptLimit,
  detectImageType,
  checkReceiptFile,
  limitReachedMessage,
  safeFileName,
} = require('../utils/receiptRules')
const { files, HOUR } = require('./helpers')

const originalEnv = { ...process.env }
afterEach(() => {
  process.env = { ...originalEnv }
})

test('limits default to 5 MB and 10 receipts a day', () => {
  delete process.env.RECEIPT_MAX_MB
  delete process.env.RECEIPT_LIMIT_PER_DAY
  assert.equal(maxReceiptBytes(), 5 * 1024 * 1024)
  assert.equal(dailyReceiptLimit(), 10)
})

test('limits can be changed with settings', () => {
  process.env.RECEIPT_MAX_MB = '2'
  process.env.RECEIPT_LIMIT_PER_DAY = '3'
  assert.equal(maxReceiptBytes(), 2 * 1024 * 1024)
  assert.equal(dailyReceiptLimit(), 3)
})

test('a setting that is not a positive number falls back to the default', () => {
  for (const bad of ['', 'abc', '0', '-4', 'NaN']) {
    process.env.RECEIPT_MAX_MB = bad
    process.env.RECEIPT_LIMIT_PER_DAY = bad
    assert.equal(maxReceiptBytes(), 5 * 1024 * 1024, `max for ${JSON.stringify(bad)}`)
    assert.equal(dailyReceiptLimit(), 10, `limit for ${JSON.stringify(bad)}`)
  }
})

test('the file type comes from the first bytes, not from the name', () => {
  assert.equal(detectImageType(files.jpeg), 'image/jpeg')
  assert.equal(detectImageType(files.png), 'image/png')
  assert.equal(detectImageType(files.webp), 'image/webp')
  assert.equal(detectImageType(files.heic), 'image/heic')
  assert.equal(detectImageType(files.pdf), null)
  assert.equal(detectImageType(files.text), null)
  assert.equal(detectImageType(Buffer.alloc(3)), null)
  assert.equal(detectImageType(null), null)
})

test('a RIFF file that is not WebP is not accepted', () => {
  const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE'), Buffer.alloc(20)])
  assert.equal(detectImageType(wav), null)
})

test('checkReceiptFile accepts the three supported types', () => {
  assert.deepEqual(checkReceiptFile({ buffer: files.jpeg }), { ok: true, mediaType: 'image/jpeg' })
  assert.deepEqual(checkReceiptFile({ buffer: files.png }), { ok: true, mediaType: 'image/png' })
  assert.deepEqual(checkReceiptFile({ buffer: files.webp }), { ok: true, mediaType: 'image/webp' })
})

test('checkReceiptFile explains each refusal', () => {
  assert.deepEqual(checkReceiptFile(undefined), { ok: false, status: 400, message: 'Choose a receipt photo to upload.' })
  assert.equal(checkReceiptFile({ buffer: Buffer.alloc(0) }).message, 'That file is empty.')
  const heic = checkReceiptFile({ buffer: files.heic })
  assert.equal(heic.status, 415)
  assert.match(heic.message, /HEIC/)
  assert.match(heic.message, /Most Compatible/)
  const pdf = checkReceiptFile({ buffer: files.pdf })
  assert.equal(pdf.status, 415)
  assert.equal(pdf.message, 'Upload a JPEG, PNG or WebP photo of the receipt.')
})

test('the limit message says when the next upload is possible', () => {
  const now = new Date('2026-11-24T12:00:00Z')
  const oldest = new Date(now.getTime() - 21 * HOUR)
  assert.equal(
    limitReachedMessage(10, oldest, now),
    'You have used all 10 receipt uploads for today. You can upload again in about 3 hours.'
  )
  const almostFree = new Date(now.getTime() - 24 * HOUR + 60 * 1000)
  assert.match(limitReachedMessage(1, almostFree, now), /about 1 hour\.$/)
})

test('file names are cleaned before they are stored', () => {
  assert.equal(safeFileName('receipt.jpg'), 'receipt.jpg')
  assert.equal(safeFileName('../../etc/passwd'), 'passwd')
  assert.equal(safeFileName('C:\\Users\\me\\Pictures\\shop receipt.png'), 'shop receipt.png')
  assert.equal(safeFileName('<img onerror=alert(1)>.jpg'), '_img onerror_alert_1_.jpg')
  assert.equal(safeFileName(''), 'receipt')
  assert.equal(safeFileName(undefined), 'receipt')
  assert.equal(safeFileName('a'.repeat(300)).length, 100)
})
