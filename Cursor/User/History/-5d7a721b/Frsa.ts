import { loginSchema } from '../../shared/schema';
import { storage } from '../../server/storage';
import { generateToken } from '../../server/middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  try {
    const { username, password } = loginSchema.parse(req.body);
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isValidPassword = await storage.validateUserPassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
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
    res.status(400).json({ message: 'Invalid request data' });
  }
} 