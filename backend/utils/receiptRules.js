// The rules for a receipt upload: which files are accepted, how big they can be, and how
// many receipts one person can send per day. Kept free of Express and the database so
// they are easy to test.
//
// Settings (all optional):
//   RECEIPT_MAX_MB         largest photo accepted, in megabytes (default 5)
//   RECEIPT_LIMIT_PER_DAY  receipts one person can upload in any 24 hours (default 10)

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_MAX_MB = 5
const DEFAULT_LIMIT_PER_DAY = 10

const positiveNumber = (value, fallback) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

const maxReceiptBytes = () =>
  Math.floor(positiveNumber(process.env.RECEIPT_MAX_MB, DEFAULT_MAX_MB) * 1024 * 1024)

const dailyReceiptLimit = () =>
  Math.floor(positiveNumber(process.env.RECEIPT_LIMIT_PER_DAY, DEFAULT_LIMIT_PER_DAY))

const megabytes = (bytes) => Number((bytes / (1024 * 1024)).toFixed(1))

// What a file really is, judged by its first bytes. The type the browser reports
// (and the file name) can be wrong or made up, so they are not trusted.
const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  if (buffer.toString('ascii', 4, 8) === 'ftyp' &&
      ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis'].includes(buffer.toString('ascii', 8, 12))) {
    return 'image/heic'
  }
  return null
}

const tooLargeMessage = (maxBytes = maxReceiptBytes()) =>
  `That photo is larger than ${megabytes(maxBytes)} MB. Crop it or take it again at a lower quality.`

// Returns { ok: true, mediaType } or { ok: false, status, message }.
const checkReceiptFile = (file) => {
  if (!file) return { ok: false, status: 400, message: 'Choose a receipt photo to upload.' }
  if (!file.buffer || file.buffer.length === 0) {
    return { ok: false, status: 400, message: 'That file is empty.' }
  }
  const mediaType = detectImageType(file.buffer)
  if (mediaType === 'image/heic') {
    return {
      ok: false,
      status: 415,
      message: "iPhone HEIC photos can't be read. Take a screenshot of the photo, or set Camera > Formats to Most Compatible, then upload again.",
    }
  }
  if (!mediaType) {
    return { ok: false, status: 415, message: 'Upload a JPEG, PNG or WebP photo of the receipt.' }
  }
  return { ok: true, mediaType }
}

// Receipts count against the limit for 24 hours after they are uploaded.
const limitReachedMessage = (limit, oldestCountedAt, now = new Date()) => {
  const hours = Math.max(1, Math.ceil((new Date(oldestCountedAt).getTime() + DAY_MS - now.getTime()) / (60 * 60 * 1000)))
  return `You have used all ${limit} receipt uploads for today. You can upload again in about ${hours} ${hours === 1 ? 'hour' : 'hours'}.`
}

// A file name that is safe to store and show: no folders, no odd characters, not too long.
const safeFileName = (name) => {
  const base = String(name || '').split(/[\\/]/).pop()
  const cleaned = base.replace(/[^\w.\- ]+/g, '_').trim().slice(0, 100)
  return cleaned || 'receipt'
}

module.exports = {
  DAY_MS,
  maxReceiptBytes,
  dailyReceiptLimit,
  detectImageType,
  checkReceiptFile,
  tooLargeMessage,
  limitReachedMessage,
  safeFileName,
}
