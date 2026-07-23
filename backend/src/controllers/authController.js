import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

function signToken(admin) {
  return jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin);

  res.json({
    success: true,
    data: {
      token,
      admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
    },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { id: req.admin._id, email: req.admin.email, name: req.admin.name, role: req.admin.role },
  });
});

// ─── Credential Management ─────────────────────────────────────────────────
// All changes require current password verification before they take effect.

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, currentPassword } = req.body;

  if (!currentPassword) {
    throw new ApiError(400, 'Current password is required to update your profile.');
  }

  const admin = await Admin.findById(req.admin._id);
  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Name is required.');
  }
  if (!email || !email.trim()) {
    throw new ApiError(400, 'Email is required.');
  }

  const normalized = email.toLowerCase().trim();

  // Prevent duplicate email from another admin account.
  if (normalized !== admin.email) {
    const existing = await Admin.findOne({ email: normalized, _id: { $ne: admin._id } });
    if (existing) {
      throw new ApiError(409, 'That email address is already in use by another account.');
    }
  }

  admin.name = name.trim();
  admin.email = normalized;
  await admin.save();

  // Re-issue a fresh token so the session stays valid with the updated identity.
  const token = signToken(admin);

  res.json({
    success: true,
    data: {
      token,
      admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
    },
    message: 'Profile updated successfully.',
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword) {
    throw new ApiError(400, 'Current password is required.');
  }
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters.');
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'New password and confirmation do not match.');
  }

  const admin = await Admin.findById(req.admin._id);
  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  admin.passwordHash = await Admin.hashPassword(newPassword);
  await admin.save();

  // Re-issue token to keep session active.
  const token = signToken(admin);

  res.json({
    success: true,
    data: { token },
    message: 'Password changed successfully.',
  });
});
