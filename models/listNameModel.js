const mongoose = require('mongoose')

const listNameSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      trim: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ListName', listNameSchema)