const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    make: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    specification: {
        type: String,
        required: true,
        trim: true
    },
    rack: {
        type: String,
        required: true,
        trim: true
    },
    bin: {
        type: String,
        required: true,
        trim: true
    },
    available: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    quantityTaken: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    updated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: String,
        required: true
    }
});

// Add text index for search functionality
inventorySchema.index({ name: 'text', make: 'text', model: 'text', specification: 'text' });

module.exports = mongoose.model('Inventory', inventorySchema); 