import { authenticateToken } from '../../server/middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  try {
    await authenticateToken(req, res, () => {
      res.json({ user: req.user });
    });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
} 