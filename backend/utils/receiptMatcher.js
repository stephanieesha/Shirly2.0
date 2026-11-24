// Matches the lines read from a receipt to items the person already has, so a bought
// item lands on its own list. Matching is by name only, and a doubtful match is marked
// "close" so the review screen can ask the person to confirm it.

const IGNORED_WORDS = new Set([
  'kg', 'g', 'gm', 'mg', 'ml', 'l', 'lt', 'ltr', 'oz', 'lb', 'lbs',
  'pk', 'pack', 'pcs', 'pc', 'ea', 'each', 'x', 'of', 'the', 'and',
])

const singular = (word) => {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

const tokens = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word && !IGNORED_WORDS.has(word) && !/^\d+(g|kg|ml|l|oz|lb|pk|pcs|x)?$/.test(word))
    .map(singular)

// 1 for the same words, 0.6 to 0.9 when one name's words are all inside the other
// ("milk" in "whole milk"), otherwise the share of words they have in common.
const score = (a, b) => {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  const shared = [...setA].filter((word) => setB.has(word)).length
  if (shared === 0) return 0
  if (shared === setA.size && shared === setB.size) return 1
  const union = new Set([...setA, ...setB]).size
  const jaccard = shared / union
  const smaller = Math.min(setA.size, setB.size)
  const larger = Math.max(setA.size, setB.size)
  const contained = shared === smaller ? 0.6 + 0.3 * (smaller / larger) : 0
  return Math.max(jaccard, contained)
}

const confidenceFor = (value) => {
  if (value >= 0.99) return 'exact'
  if (value >= 0.6) return 'close'
  return null
}

const bestMatch = (receiptName, userItems) => {
  const wanted = tokens(receiptName)
  let best = null
  for (const item of userItems) {
    const byName = score(wanted, tokens(item.name))
    // "Heinz Beans" on the receipt can be the item "Beans" with the brand "Heinz".
    const byBrandAndName = item.brand ? score(wanted, tokens(`${item.brand} ${item.name}`)) : 0
    const value = Math.max(byName, byBrandAndName)
    if (!best || value > best.value) best = { item, value }
  }
  const confidence = best ? confidenceFor(best.value) : null
  if (!confidence) return null
  return {
    itemId: best.item._id,
    listId: best.item.listName,
    name: best.item.name,
    confidence,
  }
}

// Returns the same lines with a `match` added: { itemId, listId, name, confidence }, or null
// when nothing on the person's lists looks like it.
const matchItemsToLists = (receiptItems, userItems) =>
  receiptItems.map((line) => ({ ...line, match: bestMatch(line.name, userItems) }))

module.exports = { matchItemsToLists, tokens, score }
