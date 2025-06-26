const express = require('express');
const Inventory = require('../models/Inventory');
const Transaction = require('../models/Transaction');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Search inventory
router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        const items = await Inventory.find(
            { $text: { $search: query } },
            { score: { $meta: 'textScore' } }
        ).sort({ score: { $meta: 'textScore' } });
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all inventory items
router.get('/', auth, async (req, res) => {
    try {
        const items = await Inventory.find().sort({ name: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add new item (admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const { name, make, model, specification, rack, bin, available } = req.body;
        
        if (await Inventory.findOne({ name: name.toLowerCase() })) {
            return res.status(400).json({ error: 'Item already exists' });
        }

        const item = new Inventory({
            name: name.toLowerCase(),
            make,
            model,
            specification,
            rack,
            bin,
            available,
            updatedBy: req.user.username
        });

        await item.save();

        // Record transaction
        await new Transaction({
            type: 'new_item',
            itemName: name.toLowerCase(),
            quantity: available,
            user: req.user.username,
            details: { make, model, specification, rack, bin }
        }).save();

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update item quantity
router.put('/:name/quantity', auth, async (req, res) => {
    try {
        const { quantityTaken } = req.body;
        const item = await Inventory.findOne({ name: req.params.name.toLowerCase() });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (quantityTaken > item.available) {
            return res.status(400).json({ error: 'Insufficient quantity available' });
        }

        item.available -= quantityTaken;
        item.quantityTaken += quantityTaken;
        item.updated = new Date();
        item.updatedBy = req.user.username;

        await item.save();

        // Record transaction
        await new Transaction({
            type: 'take',
            itemName: item.name,
            quantity: quantityTaken,
            user: req.user.username,
            details: { previousQuantity: item.available + quantityTaken }
        }).save();

        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update available quantity (admin only)
router.put('/:name/available', adminAuth, async (req, res) => {
    try {
        const { quantity } = req.body;
        const item = await Inventory.findOne({ name: req.params.name.toLowerCase() });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const previousQuantity = item.available;
        item.available += quantity;
        item.updated = new Date();
        item.updatedBy = req.user.username;

        await item.save();

        // Record transaction
        await new Transaction({
            type: 'add',
            itemName: item.name,
            quantity: quantity,
            user: req.user.username,
            details: { previousQuantity }
        }).save();

        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete item (admin only)
router.delete('/:name', adminAuth, async (req, res) => {
    try {
        const item = await Inventory.findOne({ name: req.params.name.toLowerCase() });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await item.remove();

        // Record transaction
        await new Transaction({
            type: 'delete_item',
            itemName: item.name,
            quantity: item.available,
            user: req.user.username,
            details: {
                make: item.make,
                model: item.model,
                specification: item.specification,
                rack: item.rack,
                bin: item.bin
            }
        }).save();

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 