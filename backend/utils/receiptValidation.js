// Checks and cleans what the AI read from a receipt before it goes any further.
//
// The reading is treated as untrusted: it may contain wrong numbers, odd text, or words
// printed on the receipt that try to give instructions. Only the known fields are kept,
// every value is checked, and anything doubtful is flagged for review instead of guessed.

const MAX_ITEMS = 100
const MAX_NAME_LENGTH = 80
const MAX_STORE_LENGTH = 60
const MAX_QUANTITY = 999
const MAX_PRICE = 100000

const round = (number, places) => {
  const factor = 10 ** places
  return Math.round(number * factor) / factor
}

const cleanText = (value, max) =>
  typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : ''

// Accepts a number, or a string that is only a number. Anything else is not a number.
const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN
  if (typeof value === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(value)) return Number(value)
  return NaN
}

const validDate = (value, now) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null
  // A receipt cannot be from the future (one day of slack for time zones).
  if (date.getTime() > now.getTime() + 24 * 60 * 60 * 1000) return null
  return value
}

// Returns { store, date, total, items, warnings }. Each item is
// { name, quantity, unitPrice, price, issues }, where price is the whole line's price.
const validateReceiptData = (raw, { now = new Date() } = {}) => {
  const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const warnings = []

  const lines = Array.isArray(data.items) ? data.items : []
  if (lines.length > MAX_ITEMS) {
    warnings.push(`Only the first ${MAX_ITEMS} lines of the receipt were kept.`)
  }

  const items = []
  let leftOut = 0
  for (const line of lines.slice(0, MAX_ITEMS)) {
    const source = line && typeof line === 'object' ? line : {}
    const name = cleanText(source.name, MAX_NAME_LENGTH)
    const price = toNumber(source.price)

    // No name, or a negative amount (a discount or refund line): not something that was bought.
    if (!name || price < 0) {
      leftOut += 1
      continue
    }

    const issues = []

    let quantity = toNumber(source.quantity)
    if (!(quantity > 0) || quantity > MAX_QUANTITY) {
      quantity = 1
      issues.push('Quantity was unclear, so it was set to 1.')
    }
    quantity = round(quantity, 3)

    let linePrice = price
    if (!(price >= 0) || price > MAX_PRICE) {
      linePrice = 0
      issues.push('Price could not be read.')
    }
    linePrice = round(linePrice, 2)

    items.push({
      name,
      quantity,
      unitPrice: round(linePrice / quantity, 2),
      price: linePrice,
      issues,
    })
  }

  if (leftOut > 0) {
    warnings.push(
      `${leftOut} ${leftOut === 1 ? 'line was' : 'lines were'} left out (no name, or a discount or negative amount).`
    )
  }

  let total = toNumber(data.total)
  total = total >= 0 && total <= MAX_PRICE * MAX_ITEMS ? round(total, 2) : null

  if (total !== null && items.length > 0) {
    const sum = round(items.reduce((acc, item) => acc + item.price, 0), 2)
    if (Math.abs(sum - total) > Math.max(0.05, total * 0.02)) {
      warnings.push(
        `The items add up to ${sum.toFixed(2)} but the receipt total is ${total.toFixed(2)}. Tax, discounts or lines that could not be read can explain the difference.`
      )
    }
  }

  const date = validDate(data.date, now)
  if (typeof data.date === 'string' && data.date.trim() && !date) {
    warnings.push('The date on the receipt could not be read.')
  }

  return {
    store: cleanText(data.store, MAX_STORE_LENGTH),
    date,
    total,
    items,
    warnings,
  }
}

module.exports = { validateReceiptData, MAX_ITEMS, MAX_NAME_LENGTH }
