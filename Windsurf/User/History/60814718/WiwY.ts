//@ts-nocheck

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { User, InsertUser } from '@shared/schema';
import bcrypt from 'bcryptjs';

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

export class UserModel {
  private collection: Collection<User>;

  constructor() {
    this.initializeCollection();
  }

  private async initializeCollection() {
    const database = await connectToDatabase();
    this.collection = database.collection<User>('users');
    
    // Create default admin user if it doesn't exist
    await this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    const existingAdmin = await this.collection.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await this.collection.insertOne({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        fullName: 'System Administrator',
        createdAt: new Date(),
      });
    }
  }

  async findById(id: string): Promise<User | null> {
    const database = await connectToDatabase();
    this.collection = database.collection<User>('users');
    
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findByUsername(username: string): Promise<User | null> {
    const database = await connectToDatabase();
    this.collection = database.collection<User>('users');
    
    return await this.collection.findOne({ username });
  }

  async create(userData: InsertUser): Promise<User> {
    const database = await connectToDatabase();
    this.collection = database.collection<User>('users');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user: User = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await this.collection.insertOne(user);
    return { ...user, _id: result.insertedId.toString() };
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const database = await connectToDatabase();
    this.collection = database.collection<User>('users');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { password: hashedPassword } }
    );
  }

  async findAll(): Promise<User[]> {
    const database = await connectToDatabase();
    this.collection = database.collection<User>('users');
    
    return await this.collection.find({}).toArray();
  }

  async delete(id: string): Promise<void> {
    const database = await connectToDatabase();
    this.collection = database.collection<User>('users');
    
    await this.collection.deleteOne({ _id: new ObjectId(id) });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }
}

export const userModel = new UserModel();
