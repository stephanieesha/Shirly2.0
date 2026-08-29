const asyncHandler = require('express-async-handler')
const ListName = require('../models/listNameModel')

const getListNames = asyncHandler(async (req, res) => {
  const listNames = await ListName.find({ user: req.user._id, isDeleted: false }).sort({ createdAt: -1 })
  const normalised = listNames.map((l) => ({
    _id: l._id,
    user: l.user,
    name: l.name || l.ItemName || '',
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  }))
  res.json(normalised)
})

const getDeletedListNames = asyncHandler(async (req, res) => {
  const listNames = await ListName.find({ user: req.user._id, isDeleted: true }).sort({ updatedAt: -1 })
  const normalised = listNames.map((l) => ({
    _id: l._id,
    user: l.user,
    name: l.name || l.ItemName || '',
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  }))
  res.json(normalised)
})

const createListName = asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name) {
    res.status(400)
    throw new Error('Please add a category name')
  }
  const listName = await ListName.create({ user: req.user._id, name })
  res.status(201).json({
    _id: listName._id,
    user: listName.user,
    name: listName.name || listName.ItemName || '',
    createdAt: listName.createdAt,
    updatedAt: listName.updatedAt,
  })
})

const updateListName = asyncHandler(async (req, res) => {
  const listName = await ListName.findById(req.params.id)
  if (!listName) {
    res.status(404)
    throw new Error('Category not found')
  }
  if (listName.user.toString() !== req.user._id.toString()) {
    res.status(403)
    throw new Error('Not authorised')
  }
  listName.name = req.body.name || listName.name
  await listName.save()
  res.json(listName)
})

const deleteListName = asyncHandler(async (req, res) => {
  const listName = await ListName.findById(req.params.id)
  if (!listName) {
    res.status(404)
    throw new Error('Category not found')
  }
  if (listName.user.toString() !== req.user._id.toString()) {
    res.status(403)
    throw new Error('Not authorised')
  }
  listName.isDeleted = true
  await listName.save()
  res.json({ id: req.params.id, message: 'Category moved to bin' })
})

const permanentlyDeleteListName = asyncHandler(async (req, res) => {
  const listName = await ListName.findById(req.params.id)
  if (!listName) { res.status(404); throw new Error('Category not found') }
  if (listName.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised')
  }
  await listName.deleteOne()
  res.json({ id: req.params.id, message: 'Category permanently deleted' })
})

const restoreListName = asyncHandler(async (req, res) => {
  const listName = await ListName.findById(req.params.id)
  if (!listName) {
    res.status(404)
    throw new Error('Category not found')
  }
  if (listName.user.toString() !== req.user._id.toString()) {
    res.status(403)
    throw new Error('Not authorised')
  }
  listName.isDeleted = false
  await listName.save()
  res.json(listName)
})

module.exports = { getListNames, getDeletedListNames, createListName, updateListName, deleteListName, restoreListName, permanentlyDeleteListName }
