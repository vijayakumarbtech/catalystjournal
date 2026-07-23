import Settings from '../models/Settings.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Settings is a singleton document. This helper fetches it, creating a
// sensible default document on first run if none exists yet.
export async function getOrCreateSettings() {
  let settings = await Settings.findOne({ singletonKey: 'main' });
  if (!settings) {
    settings = await Settings.create({ singletonKey: 'main' });
  }
  return settings;
}

export const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ success: true, data: settings });
});

// --- Admin ---

export const adminGetSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ success: true, data: settings });
});

export const adminUpdateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOneAndUpdate(
    { singletonKey: 'main' },
    { ...req.body, singletonKey: 'main' },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: settings });
});
