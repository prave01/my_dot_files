require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://praveen10:praveen10@cluster0.yk0vavq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
async function initializeDB() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Check if admin user exists
        const adminExists = await User.findOne({ username: 'pasu' });
        if (!adminExists) {
            // Create default admin user with hashed password
            const admin = new User({
                username: 'pasu',
                password: '123',  // This will be hashed by the pre-save middleware
                role: 'admin'
            });
            await admin.save();
            console.log('Default admin user created successfully');
        } else {
            // Update admin password if user exists
            adminExists.password = '123';  // This will be hashed by the pre-save middleware
            await adminExists.save();
            console.log('Default admin user password updated');
        }

        console.log('Database initialization completed');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDB(); 