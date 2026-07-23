import Newsletter from '../models/Newsletter.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required.');

  await Newsletter.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { email: email.toLowerCase().trim() },
    { upsert: true }
  );

  res.status(201).json({ success: true, data: null });
});

// --- Admin ---

export const adminListSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Newsletter.find().sort({ createdAt: -1 });
  res.json({ success: true, data: subscribers });
});
