//@ts-nocheck
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { Transaction, InsertTransaction } from '@shared/schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://praveen10:praveen10@cluster0.yk0vavq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'inventory_management';

let client: MongoClient;
let db: Db;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
  }
  return db;
}

export class TransactionModel {
  private collection: Collection<Transaction>;

  constructor() {
    this.initializeCollection();
  }

  private async initializeCollection() {
    const database = await connectToDatabase();
    this.collection = database.collection<Transaction>('transactions');
    
    // Create indexes for better query performance
    await this.collection.createIndex({ createdAt: -1 });
    await this.collection.createIndex({ itemId: 1 });
    await this.collection.createIndex({ userId: 1 });
    await this.collection.createIndex({ type: 1 });
  }

  async create(transactionData: InsertTransaction): Promise<Transaction> {
    const database = await connectToDatabase();
    this.collection = database.collection<Transaction>('transactions');
    
    const transaction: Transaction = {
      ...transactionData,
      createdAt: new Date(),
    };

    const result = await this.collection.insertOne(transaction);
    return { ...transaction, _id: result.insertedId.toString() };
  }

  async findWithFilters(filters: {
    itemId?: number;
    userId?: number;
    type?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<Transaction[]> {
    const database = await connectToDatabase();
    this.collection = database.collection<Transaction>('transactions');
    
    const query: any = {};
    
    if (filters.itemId) query.itemId = filters.itemId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.type) query.type = filters.type;

    let cursor = this.collection.find(query).sort({ createdAt: -1 });
    
    if (filters.skip) cursor = cursor.skip(filters.skip);
    if (filters.limit) cursor = cursor.limit(filters.limit);

    return await cursor.toArray();
  }

  async getStats(): Promise<{ 
    totalTransactions: number; 
    totalItems: number; 
    activeUsers: number;
    monthlyStats: any[];
  }> {
    const database = await connectToDatabase();
    this.collection = database.collection<Transaction>('transactions');
    
    const totalTransactions = await this.collection.countDocuments();
    
    // Get unique users count
    const activeUsersResult = await this.collection.aggregate([
      { $group: { _id: "$userId" } },
      { $count: "activeUsers" }
    ]).toArray();
    
    const activeUsers = activeUsersResult[0]?.activeUsers || 0;
    
    // Get monthly transaction stats
    const monthlyStats = await this.collection.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]).toArray();

    // Get total items count from inventory collection
    const inventoryCollection = database.collection('inventory');
    const totalItems = await inventoryCollection.countDocuments();

    return {
      totalTransactions,
      totalItems,
      activeUsers,
      monthlyStats
    };
  }

  async getMostUsedItems(limit: number = 10): Promise<any[]> {
    const database = await connectToDatabase();
    this.collection = database.collection<Transaction>('transactions');
    
    return await this.collection.aggregate([
      { $match: { type: "take" } },
      {
        $group: {
          _id: "$itemName",
          totalUsed: { $sum: "$quantity" },
          usageCount: { $sum: 1 }
        }
      },
      { $sort: { totalUsed: -1 } },
      { $limit: limit }
    ]).toArray();
  }

  async getUserActivity(limit: number = 10): Promise<any[]> {
    const database = await connectToDatabase();
    this.collection = database.collection<Transaction>('transactions');
    
    return await this.collection.aggregate([
      {
        $group: {
          _id: "$username",
          transactionCount: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" }
        }
      },
      { $sort: { transactionCount: -1 } },
      { $limit: limit }
    ]).toArray();
  }

  async clearAll(): Promise<void> {
    const database = await connectToDatabase();
    this.collection = database.collection<Transaction>('transactions');
    
    await this.collection.deleteMany({});
  }

  async getTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
    const database = await connectToDatabase();
    this.collection = database.collection<Transaction>('transactions');
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return await this.collection.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: -1 }).toArray();
  }
}

export const transactionModel = new TransactionModel();
