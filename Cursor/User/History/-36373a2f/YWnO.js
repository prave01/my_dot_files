require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://praveenthanikachalam408:praveenthanikachalam408@cluster0.yk0vavq.mongodb.net/inventory?retryWrites=true&w=majority&appName=Cluster0';

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
            // Create default admin user
            const admin = new User({
                username: 'pasu',
                password: '123',
                role: 'admin'
            });
            await admin.save();
            console.log('Default admin user created successfully');
        } else {
            console.log('Default admin user already exists');
        }

        console.log('Database initialization completed');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDB(); 