//@ts-nocheck

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { InventoryItem, InsertInventoryItem } from '@shared/schema';

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

export class InventoryModel {
  private collection: Collection<InventoryItem>;

  constructor() {
    this.initializeCollection();
  }

  private async initializeCollection() {
    const database = await connectToDatabase();
    this.collection = database.collection<InventoryItem>('inventory');
    
    // Create indexes for better search performance
    await this.collection.createIndex({ name: 'text', make: 'text', model: 'text', specification: 'text' });
    await this.collection.createIndex({ name: 1 }, { unique: true });
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const database = await connectToDatabase();
    this.collection = database.collection<InventoryItem>('inventory');
    
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findByName(name: string): Promise<InventoryItem | null> {
    const database = await connectToDatabase();
    this.collection = database.collection<InventoryItem>('inventory');
    
    return await this.collection.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  }

  async findAll(): Promise<InventoryItem[]> {
    const database = await connectToDatabase();
    this.collection = database.collection<InventoryItem>('inventory');
    
    return await this.collection.find({}).sort({ name: 1 }).toArray();
  }

  async search(searchTerm: string): Promise<InventoryItem[]> {
    const database = await connectToDatabase();
    this.collection = database.collection<InventoryItem>('inventory');
    
    const regex = new RegExp(searchTerm, 'i');
    return await this.collection.find({
      $or: [
        { name: { $regex: regex } },
        { make: { $regex: regex } },
        { model: { $regex: regex } },
        { specification: { $regex: regex } }
      ]
    }).sort({ name: 1 }).toArray();
  }

  async create(itemData: InsertInventoryItem): Promise<InventoryItem> {
    const database = await connectToDatabase();
    this.collection = database.collection<InventoryItem>('inventory');
    
    const item: InventoryItem = {
      ...itemData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(item);
    return { ...item, _id: result.insertedId.toString() };
  }

  async update(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | null> {
    const database = await connectToDatabase();
    this.collection = database.collection<InventoryItem>('inventory');
    
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  async delete(id: string): Promise<void> {
    const database = await connectToDatabase();
    this.collection = database.collection<InventoryItem>('inventory');
    
    await this.collection.deleteOne({ _id: new ObjectId(id) });
  }

  async count(): Promise<number> {
    const database = await connectToDatabase();
    this.collection = database.collection<InventoryItem>('inventory');
    
    return await this.collection.countDocuments();
  }
}

export const inventoryModel = new InventoryModel();
