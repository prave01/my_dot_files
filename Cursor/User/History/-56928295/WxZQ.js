const express = require('express');
const Transaction = require('../models/Transaction');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all transactions (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = {};

        if (month !== undefined && year !== undefined) {
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, parseInt(month) + 1, 0, 23, 59, 59);
            query.timestamp = { $gte: startDate, $lte: endDate };
        }

        const transactions = await Transaction.find(query)
            .sort({ timestamp: -1 });
        
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get monthly summary (admin only)
router.get('/summary', adminAuth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, parseInt(month) + 1, 0, 23, 59, 59);

        const summary = await Transaction.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' }
                }
            }
        ]);

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get top consumed items (admin only)
router.get('/top-items', adminAuth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, parseInt(month) + 1, 0, 23, 59, 59);

        const topItems = await Transaction.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate, $lte: endDate },
                    type: 'take'
                }
            },
            {
                $group: {
                    _id: '$itemName',
                    totalQuantity: { $sum: '$quantity' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { totalQuantity: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json(topItems);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user activity (admin only)
router.get('/user-activity', adminAuth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, parseInt(month) + 1, 0, 23, 59, 59);

        const userActivity = await Transaction.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$user',
                    totalTransactions: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' }
                }
            },
            {
                $sort: { totalTransactions: -1 }
            }
        ]);

        res.json(userActivity);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Clear transaction history (admin only)
router.delete('/', adminAuth, async (req, res) => {
    try {
        await Transaction.deleteMany({});
        res.json({ message: 'Transaction history cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 