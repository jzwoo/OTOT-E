const mongoose = require('mongoose')

const Schema = mongoose.Schema

const contactSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    contact: {
        type: Number,
        required: true,
        unique: true
    }
}, {timestamps: true})

module.exports = mongoose.model('Contact', contactSchema);