// migration.js
require('dotenv').config()
const mongoose = require('mongoose')
const ListName = require('./models/listNameModel')

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI)

  const result = await ListName.updateMany(
    { $or: [{ name: '' }, { name: { $exists: false } }] },
    [{ $set: { name: '$ItemName' } }]
  )

  console.log(`Fixed ${result.modifiedCount} document(s)`)
  await mongoose.disconnect()
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})