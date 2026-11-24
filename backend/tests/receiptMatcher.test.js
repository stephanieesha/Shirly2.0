const { test } = require('node:test')
const assert = require('node:assert/strict')
const { matchItemsToLists, tokens } = require('../utils/receiptMatcher')

const mine = [
  { _id: 'i1', listName: 'dairy', name: 'Milk', brand: '' },
  { _id: 'i2', listName: 'dairy', name: 'Coconut milk', brand: '' },
  { _id: 'i3', listName: 'pantry', name: 'Beans', brand: 'Heinz' },
  { _id: 'i4', listName: 'fruit', name: 'Banana', brand: '' },
  { _id: 'i5', listName: 'bakery', name: 'Brown bread', brand: '' },
]
const matchOne = (name, items = mine) => matchItemsToLists([{ name }], items)[0].match

test('words are compared without sizes, case, accents or plurals', () => {
  assert.deepEqual(tokens('MILK 1L'), ['milk'])
  assert.deepEqual(tokens('Bananas 500g'), ['banana'])
  assert.deepEqual(tokens('Crème Fraîche'), ['creme', 'fraiche'])
  assert.deepEqual(tokens('Berries'), ['berry'])
  assert.deepEqual(tokens(''), [])
  assert.deepEqual(tokens(null), [])
})

test('the same product matches exactly, with the item and list it belongs to', () => {
  assert.deepEqual(matchOne('MILK 1L'), { itemId: 'i1', listId: 'dairy', name: 'Milk', confidence: 'exact' })
  assert.equal(matchOne('Bananas').itemId, 'i4')
  assert.equal(matchOne('Bananas').confidence, 'exact')
})

test('a longer name that contains the item is a close match, for the person to confirm', () => {
  const match = matchOne('Whole Milk')
  assert.equal(match.itemId, 'i1')
  assert.equal(match.confidence, 'close')
  assert.equal(matchOne('Bread').itemId, 'i5')
  assert.equal(matchOne('Bread').confidence, 'close')
})

test('the more specific item wins when two could match', () => {
  assert.equal(matchOne('Coconut Milk 400ml').itemId, 'i2')
  assert.equal(matchOne('Coconut Milk 400ml').confidence, 'exact')
})

test('the brand on the receipt can match an item that stores the brand separately', () => {
  const exact = matchOne('Heinz Beans')
  assert.equal(exact.itemId, 'i3')
  assert.equal(exact.confidence, 'exact')
  assert.equal(matchOne('Heinz Baked Beans 415g').itemId, 'i3')
})

test('a product that is not on any list has no match', () => {
  assert.equal(matchOne('Butter'), null)
  assert.equal(matchOne('Dish soap'), null)
  assert.equal(matchOne('ZZ'), null)
})

test('names with nothing comparable never match', () => {
  assert.equal(matchOne(''), null)
  assert.equal(matchOne('1kg'), null)
  assert.equal(matchOne('   '), null)
})

test('a person with no items gets no matches and no crash', () => {
  assert.equal(matchOne('Milk', []), null)
})

test('every line keeps its own fields and gains a match', () => {
  const lines = [
    { name: 'Milk', quantity: 2, unitPrice: 1.25, price: 2.5, issues: [] },
    { name: 'Butter', quantity: 1, unitPrice: 3, price: 3, issues: ['Price could not be read.'] },
  ]
  const result = matchItemsToLists(lines, mine)
  assert.equal(result.length, 2)
  assert.deepEqual({ ...result[0], match: undefined }, { ...lines[0], match: undefined })
  assert.equal(result[0].match.itemId, 'i1')
  assert.equal(result[1].match, null)
  assert.deepEqual(result[1].issues, ['Price could not be read.'])
  assert.equal(lines[0].match, undefined, 'the input is not changed')
})

test('a receipt can list the same product twice', () => {
  const result = matchItemsToLists([{ name: 'Milk' }, { name: 'Milk' }], mine)
  assert.equal(result[0].match.itemId, 'i1')
  assert.equal(result[1].match.itemId, 'i1')
})
