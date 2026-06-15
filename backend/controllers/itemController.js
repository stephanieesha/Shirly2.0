const asyncHandler = require('express-async-handler')
const Item = require('../models/itemModel')
const ListName = require('../models/listNameModel')

const frequencyToDays = (frequency) => {
  if (!frequency) return 7
  const f = frequency.toLowerCase().trim()
  if (f === 'nill')            return 9999
  if (f === 'everyday' || f === 'daily') return 1
  if (f === 'every 2 days')   return 2
  if (f === 'every 3 days')   return 3
  if (f === 'weekly')          return 7
  if (f === 'every 2 weeks')  return 14
  if (f === 'monthly')         return 30
  if (f === 'every 2 months') return 60
  if (f === 'every 3 months') return 90
  if (f === 'every 6 months') return 180
  if (f === 'yearly')          return 365
  const daysMatch  = f.match(/every\s+(\d+)\s+day/)
  const weeksMatch = f.match(/every\s+(\d+)\s+week/)
  if (daysMatch)  return parseInt(daysMatch[1])
  if (weeksMatch) return parseInt(weeksMatch[1]) * 7
  return 7
}

const getItems = asyncHandler(async (req, res) => {
  const { listId, includeDisabled } = req.query
  const query = { user: req.user._id }
  if (!includeDisabled) query.itemDisabled = false
  if (listId) query.listName = listId
  const items = await Item.find(query).sort({ createdAt: -1 })
  res.json(items)
})

const getItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) { res.status(404); throw new Error('Item not found') }
  if (item.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised')
  }
  res.json(item)
})

const createItem = asyncHandler(async (req, res) => {
  const { listId, name, brand, unitPrice, quantity, price, frequency, comment } = req.body
  if (!listId || !name) { res.status(400); throw new Error('listId and name are required') }
  const listName = await ListName.findById(listId)
  if (!listName || listName.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Category not found or not authorised')
  }
  const item = await Item.create({
    user: req.user._id,
    listName: listId,
    name,
    brand:     brand     || '',
    unitPrice: unitPrice || 0,
    quantity:  quantity  || 1,
    price:     price     || 0,
    frequency: frequency || 'weekly',
    comment:   comment   || '',
    totalSpent: 0,
    boughtAt: [],
  })
  res.status(201).json(item)
})

const updateItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) { res.status(404); throw new Error('Item not found') }
  if (item.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised')
  }
  const { name, brand, unitPrice, quantity, price, frequency, comment } = req.body
  item.name      = name      ?? item.name
  item.brand     = brand     ?? item.brand
  item.unitPrice = unitPrice ?? item.unitPrice
  item.quantity  = quantity  ?? item.quantity
  item.price     = price     ?? item.price
  item.frequency = frequency ?? item.frequency
  item.comment   = comment   ?? item.comment
  await item.save()
  res.json(item)
})
const buyItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) { res.status(404); throw new Error('Item not found') }
  if (item.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised')
  }
  const {
    name      = item.name,
    brand     = item.brand,
    unitPrice = item.unitPrice,
    quantity  = item.quantity,
    price     = item.price,
    frequency = item.frequency,
    comment   = item.comment,
  } = req.body

  const snapshot = { name, brand, unitPrice, quantity, price, frequency, comment, status: 'bought', updatedAt: new Date() }
  item.name      = name
  item.brand     = brand
  item.unitPrice = unitPrice
  item.quantity  = quantity
  item.price     = price
  item.frequency = frequency
  item.comment   = comment
  item.totalSpent = (item.totalSpent || 0) + price
  await item.save()
  res.json(item)
})

const skipItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) { res.status(404); throw new Error('Item not found') }
  if (item.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised')
  }
  const snapshot = { 
    name: item.name, brand: item.brand, unitPrice: item.unitPrice,
    quantity: item.quantity, price: 0, frequency: item.frequency,
    comment: item.comment, status: 'skipped', updatedAt: new Date() 
  }
  item.boughtAt.unshift(snapshot)
  // totalSpent is NOT updated for skipped items
  await item.save()
  res.json(item)
})

const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) { res.status(404); throw new Error('Item not found') }
  if (item.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised')
  }
  item.itemDisabled = true
  await item.save()
  res.json({ id: req.params.id, message: 'Item removed' })
})

const disableItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) { res.status(404); throw new Error('Item not found') }
  if (item.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised')
  }
  item.itemDisabled = true
  await item.save()
  res.json(item)
})

const enableItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) { res.status(404); throw new Error('Item not found') }
  if (item.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised')
  }
  item.itemDisabled = false
  await item.save()
  res.json(item)
})

const permanentlyDeleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) { res.status(404); throw new Error('Item not found') }
  if (item.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised')
  }
  await item.deleteOne()
  res.json({ id: req.params.id, message: 'Item permanently deleted' })
})

const generateShoppingList = asyncHandler(async (req, res) => {
  const items = await Item.find({ user: req.user._id, itemDisabled: false })
  const today = Date.now()
  const due = items.map((item) => {
    const freqDays = frequencyToDays(item.frequency)
    const lastBought = item.boughtAt?.[0]?.updatedAt ? new Date(item.boughtAt[0].updatedAt).getTime() : null
    const daysSince = lastBought ? Math.floor((today - lastBought) / (1000 * 60 * 60 * 24)) : null
    const isDue = lastBought === null || daysSince >= freqDays
    return {
      _id:        item._id,
      name:       item.name,
      brand:      item.brand,
      unitPrice:  item.unitPrice,
      quantity:   item.quantity,
      price:      item.price,
      frequency:  item.frequency,
      comment:    item.comment,
      listName:   item.listName,
      totalSpent: item.totalSpent,
      lastBought: item.lastBought,
      daysSince,
      freqDays,
      isDue,
      priceTrend: (() => {
        const history = item.boughtAt
        if (history.length < 2) return null
        const latest = history[0].price
        const previous = history[1].price
        if (!previous) return null
        const pct = Math.round(((latest - previous) / previous) * 100)
        return { previous, latest, pct }
      })(),
    }
  })
  .filter((item) => item.isDue)
  .sort((a, b) => {
    if (a.daysSince === null) return -1
    if (b.daysSince === null) return 1
    return (b.daysSince - b.freqDays) - (a.daysSince - a.freqDays)
  })
  res.json(due)
})

module.exports = { getItems, getItem, createItem, updateItem, buyItem, deleteItem, generateShoppingList,skipItem, enableItem, disableItem, permanentlyDeleteItem }