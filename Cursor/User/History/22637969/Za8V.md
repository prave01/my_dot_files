# Inventory Management System

A full-stack inventory management system with user authentication, real-time updates, and analytics.

## ⚠️ Default Login Credentials
```
Username: pasu
Password: 123
```
Please make sure to change these credentials after your first login for security purposes.

## Features

- User authentication with role-based access control (Admin/User)
- Inventory management (Add, Update, Delete items)
- Real-time search with voice input support
- Transaction history and analytics
- User management (Admin only)
- CSV export functionality
- Modern and responsive UI

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
MONGODB_URI=mongodb://localhost:27017/inventory
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

## Running the Application

1. Start MongoDB:
```bash
mongod
```

2. Start the backend server:
```bash
npm start
```

3. Open `index.html` in your web browser or serve it using a static file server:
```bash
npx serve .
```

4. Access the application at `http://localhost:3000`

## API Endpoints

### Authentication
- POST /api/auth/login - Login user
- POST /api/auth/users - Add new user (Admin only)
- PUT /api/auth/users/:username/password - Change user password (Admin only)
- GET /api/auth/users - Get all users (Admin only)
- DELETE /api/auth/users/:username - Delete user (Admin only)

### Inventory
- GET /api/inventory/search - Search inventory items
- GET /api/inventory - Get all inventory items
- POST /api/inventory - Add new item (Admin only)
- PUT /api/inventory/:name/quantity - Update item quantity
- PUT /api/inventory/:name/available - Update available quantity (Admin only)
- DELETE /api/inventory/:name - Delete item (Admin only)

### Transactions
- GET /api/transactions - Get all transactions (Admin only)
- GET /api/transactions/summary - Get monthly summary (Admin only)
- GET /api/transactions/top-items - Get top consumed items (Admin only)
- GET /api/transactions/user-activity - Get user activity (Admin only)
- DELETE /api/transactions - Clear transaction history (Admin only)

## License

MIT 