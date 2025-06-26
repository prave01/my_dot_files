import type { Express, Response } from "express";

import { storage } from "./storage.js";
import { loginSchema, insertUserSchema, insertInventorySchema, updateQuantitySchema, changePasswordSchema, User, InventoryItem, Transaction } from "@shared/schema.js";
import { authenticateToken, requireAdmin, generateToken, AuthRequest } from "./middleware/auth.js";

export async function registerRoutes(app: Express): Promise<void> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req: AuthRequest, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await storage.validateUserPassword(user, password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = generateToken({
        id: user._id || user.id?.toString() || '',
        username: user.username,
        role: user.role
      });

      res.json({
        token,
        user: {
          id: user._id || user.id,
          username: user.username,
          role: user.role,
          fullName: user.fullName
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/auth/validate", authenticateToken, async (req: AuthRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // User management routes (admin only)
  app.post("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      
      // Log transaction
      await storage.createTransaction({
        itemName: "User Management",
        type: "add",
        quantity: 1,
        userId: parseInt(req.user!.id),
        username: req.user!.username,
        details: { action: "create_user", targetUser: user.username }
      });

      res.status(201).json({
        id: user._id || user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        id: user._id || user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        createdAt: user.createdAt
      })));
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id/password", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.params.id;
      const { newPassword } = changePasswordSchema.parse({ ...req.body, userId: parseInt(userId) });
      
      await storage.updateUserPassword(userId, newPassword);
      
      // Log transaction
      await storage.createTransaction({
        itemName: "User Management",
        type: "update",
        quantity: 1,
        userId: parseInt(req.user!.id),
        username: req.user!.username,
        details: { action: "change_password", targetUserId: userId }
      });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.params.id;
      
      // Prevent deletion of current user
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      
      // Log transaction
      await storage.createTransaction({
        itemName: "User Management",
        type: "delete",
        quantity: 1,
        userId: parseInt(req.user!.id),
        username: req.user!.username,
        details: { action: "delete_user", targetUserId: userId }
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const items = await storage.getAllInventory();
      // Convert MongoDB _id to id for frontend compatibility
      const formattedItems = items.map(item => ({
        ...item,
        id: item._id || item.id
      }));
      res.json(formattedItems);
    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/search", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm) {
        return res.json([]);
      }
      
      const items = await storage.searchInventory(searchTerm);
      const formattedItems = items.map(item => ({
        ...item,
        id: item._id || item.id
      }));
      res.json(formattedItems);
    } catch (error) {
      console.error('Search inventory error:', error);
      res.status(500).json({ message: "Failed to search inventory" });
    }
  });

  app.post("/api/inventory", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const itemData = insertInventorySchema.parse(req.body);
      
      // Check if item name already exists
      const existingItem = await storage.getInventoryByName(itemData.name);
      if (existingItem) {
        return res.status(400).json({ message: "Item with this name already exists" });
      }

      const item = await storage.createInventoryItem(itemData);
      
      // Log transaction
      await storage.createTransaction({
        itemName: item.name,
        type: "add",
        quantity: item.quantity,
        newQuantity: item.quantity,
        userId: parseInt(req.user!.id),
        username: req.user!.username,
        details: { action: "create_item", item: itemData }
      });

      const formattedItem = {
        ...item,
        id: item._id || item.id
      };

      res.status(201).json(formattedItem);
    } catch (error) {
}
});

app.get("/api/auth/validate", authenticateToken, async (req: AuthRequest, res: Response) => {
res.json({ user: req.user });
});

// User management routes (admin only)
app.post("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
try {
const userData = insertUserSchema.parse(req.body);
  
// Check if username already exists
const existingUser = await storage.getUserByUsername(userData.username);
if (existingUser) {
  return res.status(400).json({ message: "Username already exists" });
}

const user = await storage.createUser(userData);
  
// Log transaction
await storage.createTransaction({
  itemName: "User Management",
  type: "add",
  quantity: 1,
  userId: parseInt(req.user!.id),
  username: req.user!.username,
  details: { action: "create_user", targetUser: user.username }
});

res.status(201).json({
  id: user._id || user.id,
  username: user.username,
  role: user.role,
  fullName: user.fullName,
  createdAt: user.createdAt
});
} catch (error) {
console.error('Create user error:', error);
res.status(400).json({ message: "Invalid request data" });
}
});

app.get("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
try {
const users = await storage.getAllUsers();
res.json(users.map(user => ({
  id: user._id || user.id,
  username: user.username,
  role: user.role,
  fullName: user.fullName,
  createdAt: user.createdAt
})));
} catch (error) {
console.error('Get users error:', error);
res.status(500).json({ message: "Failed to fetch users" });
}
});

app.put("/api/users/:id/password", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
try {
const userId = req.params.id;
const { newPassword } = changePasswordSchema.parse({ ...req.body, userId: parseInt(userId) });
  
await storage.updateUserPassword(userId, newPassword);
  
// Log transaction
await storage.createTransaction({
  itemName: "User Management",
  type: "update",
  quantity: 1,
  userId: parseInt(req.user!.id),
  username: req.user!.username,
  details: { action: "change_password", targetUserId: userId }
});

res.json({ message: "Password updated successfully" });
} catch (error) {
console.error('Change password error:', error);
res.status(400).json({ message: "Invalid request data" });
}
});

app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
try {
  const userId = req.params.id;
  
  // Prevent deletion of current user
  if (userId === req.user!.id) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }

  await storage.deleteUser(userId);
  
// Log transaction
await storage.createTransaction({
  itemName: "User Management",
  type: "delete",
  quantity: 1,
  userId: parseInt(req.user!.id),
  username: req.user!.username,
  details: { action: "delete_user", targetUserId: userId }
});

res.json({ message: "User deleted successfully" });
} catch (error) {
console.error('Delete user error:', error);
res.status(500).json({ message: "Failed to delete user" });
}
});

// Inventory routes
app.get("/api/inventory", authenticateToken, async (req: AuthRequest, res: Response) => {
try {
const items = await storage.getAllInventory();
// Convert MongoDB _id to id for frontend compatibility
const formattedItems = items.map(item => ({
  ...item,
  id: item._id || item.id
}));
res.json(formattedItems);
} catch (error) {
console.error('Get inventory error:', error);
res.status(500).json({ message: "Failed to fetch inventory" });
}
});

app.get("/api/inventory/search", authenticateToken, async (req: AuthRequest, res: Response) => {
try {
const searchTerm = req.query.q as string;
if (!searchTerm) {
  return res.json([]);
}
  
const items = await storage.searchInventory(searchTerm);
const formattedItems = items.map(item => ({
  ...item,
  id: item._id || item.id
}));
res.json(formattedItems);
} catch (error) {
console.error('Search inventory error:', error);
res.status(500).json({ message: "Failed to search inventory" });
}
});

app.post("/api/inventory", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
try {
const itemData = insertInventorySchema.parse(req.body);
  
// Check if item name already exists
const existingItem = await storage.getInventoryByName(itemData.name);
if (existingItem) {
  return res.status(400).json({ message: "Item with this name already exists" });
}

const item = await storage.createInventoryItem(itemData);
  
// Log transaction
await storage.createTransaction({
  itemName: item.name,
  type: "add",
  quantity: item.quantity,
  newQuantity: item.quantity,
  userId: parseInt(req.user!.id),
  username: req.user!.username,
  details: { action: "create_item", item: itemData }
});

const formattedItem = {
  ...item,
  id: item._id || item.id
};

res.status(201).json(formattedItem);
} catch (error) {
console.error('Create inventory error:', error);
res.status(400).json({ message: "Invalid request data" });
}
});

app.patch("/api/inventory/:id/quantity", authenticateToken, async (req: AuthRequest, res: Response) => {
try {
const itemId = req.params.id;
const updateData = updateQuantitySchema.parse(req.body);
  
const item = await storage.getInventoryItem(itemId);
if (!item) {
  return res.status(404).json({ message: "Item not found" });
}

let newQuantity = item.quantity;
let transactionType = "update";

if (updateData.quantityTaken !== undefined) {
  // Taking items from inventory
  if (updateData.quantityTaken > item.quantity) {
    return res.status(400).json({ message: "Not enough items in stock" });
  }
  newQuantity = item.quantity - updateData.quantityTaken;
  transactionType = "take";
} else if (updateData.availableQuantity !== undefined && req.user!.role === "admin") {
  // Admin setting available quantity
  newQuantity = updateData.availableQuantity;
  transactionType = "update";
}

const updatedItem = await storage.updateInventoryItem(itemId, { quantity: newQuantity });
  
// Log transaction
await storage.createTransaction({
  itemName: item.name,
  type: transactionType,
  quantity: updateData.quantityTaken || updateData.availableQuantity || 0,
  previousQuantity: item.quantity,
  newQuantity: newQuantity,
  userId: parseInt(req.user!.id),
  username: req.user!.username,
  details: { action: "update_quantity", changes: updateData }
});

const formattedItem = {
  ...updatedItem,
  id: updatedItem._id || updatedItem.id
};

res.json(formattedItem);
} catch (error) {
console.error('Update inventory error:', error);
res.status(400).json({ message: "Invalid request data" });
}
});

app.delete("/api/inventory/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
try {
const itemId = req.params.id;
  
const item = await storage.getInventoryItem(itemId);
if (!item) {
  return res.status(404).json({ message: "Item not found" });
}

await storage.deleteInventoryItem(itemId);
  
// Log transaction
await storage.createTransaction({
  itemName: item.name,
  type: "delete",
  quantity: item.quantity,
  previousQuantity: item.quantity,
  newQuantity: 0,
  userId: parseInt(req.user!.id),
  username: req.user!.username,
  details: { action: "delete_item", deletedItem: item }
});

res.json({ message: "Item deleted successfully" });
} catch (error) {
console.error('Delete inventory error:', error);
res.status(500).json({ message: "Failed to delete item" });
}
});

// Transaction and analytics routes
app.get("/api/transactions", authenticateToken, async (req: AuthRequest, res: Response) => {
try {
const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
const itemId = req.query.itemId ? parseInt(req.query.itemId as string) : undefined;
const type = req.query.type as string;
  
const transactions = await storage.getTransactions({ limit, itemId, type });
const formattedTransactions = transactions.map((transaction: Transaction) => ({
  ...transaction,
  id: transaction._id || transaction.id
}));
res.json(formattedTransactions);
} catch (error) {
console.error('Get transactions error:', error);
res.status(500).json({ message: "Failed to fetch transactions" });
}
});

app.get("/api/analytics/stats", authenticateToken, async (req: AuthRequest, res: Response) => {
try {
const stats = await storage.getTransactionStats();
res.json(stats);
} catch (error) {
console.error('Get analytics error:', error);
res.status(500).json({ message: "Failed to fetch statistics" });
}
});

app.get("/api/analytics/most-used", authenticateToken, async (req: AuthRequest, res: Response) => {
try {
const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
const mostUsed = await storage.getMostUsedItems(limit);
res.json(mostUsed);
} catch (error) {
console.error('Get most used items error:', error);
res.status(500).json({ message: "Failed to fetch most used items" });
}
});

app.get("/api/analytics/user-activity", authenticateToken, async (req: AuthRequest, res: Response) => {
try {
const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
const userActivity = await storage.getUserActivity(limit);
res.json(userActivity);
} catch (error) {
console.error('Get user activity error:', error);
res.status(500).json({ message: "Failed to fetch user activity" });
}
});

app.delete("/api/transactions", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
try {
await storage.clearTransactions();
res.json({ message: "Transaction history cleared" });
} catch (error) {
console.error('Clear transactions error:', error);
res.status(500).json({ message: "Failed to clear transactions" });
}
});

// CSV Export route
app.get("/api/inventory/export", authenticateToken, async (req: AuthRequest, res) => {
try {
const items = await storage.getAllInventory();
  
// Generate CSV content
const headers = ["Name", "Make", "Model", "Specification", "Rack", "Bin", "Quantity"];
const csvContent = [
  headers.join(","),
  ...items.map(item => [
    `"${item.name}"`,
    `"${item.make || ''}"`,
    `"${item.model || ''}"`,
    `"${item.specification || ''}"`,
    `"${item.rack || ''}"`,
    `"${item.bin || ''}"`,
    item.quantity
  ].join(","))
].join("\n");

res.setHeader('Content-Type', 'text/csv');
res.setHeader('Content-Disposition', `attachment; filename="inventory_${new Date().toISOString().split('T')[0]}.csv"`);
res.send(csvContent);
} catch (error) {
console.error('Export inventory error:', error);
res.status(500).json({ message: "Failed to export inventory" });
}
});
}
