const mongoose = require('mongoose')
const { type } = require('os-browserify')

const ReminderListSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
      },
      reminderList: {
        type: String,
        required: false
    },
    createdAt:{},
    updatedAt:{},
    },
    {
        timestamps: true
    },

)

module.exports = mongoose.model('ReminderList', ReminderListSchema)