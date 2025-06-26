const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add new user (admin only)
router.post('/users', adminAuth, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        if (await User.findOne({ username })) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = new User({ username, password, role });
        await user.save();

        res.status(201).json({
            username: user.username,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password (admin only)
router.put('/users/:username/password', adminAuth, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findOne({ username: req.params.username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.password = password;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only)
router.delete('/users/:username', adminAuth, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ error: 'Cannot delete admin user' });
        }

        await user.remove();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 