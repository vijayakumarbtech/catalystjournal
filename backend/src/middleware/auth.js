import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(payload.id);

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin account no longer exists.' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
}
