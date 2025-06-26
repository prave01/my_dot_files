const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['take', 'add', 'new_item', 'delete_item'],
    },
    itemName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    quantity: {
        type: Number,
        required: true
    },
    user: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    details: {
        type: Object,
        default: {}
    }
});

module.exports = mongoose.model('Transaction', transactionSchema); 