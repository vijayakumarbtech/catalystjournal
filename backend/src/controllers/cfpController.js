import CallForPaper from '../models/CallForPaper.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

export const getActiveCfp = asyncHandler(async (req, res) => {
  const cfp = await CallForPaper.findOne({ isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, data: cfp });
});

export const adminListCfps = asyncHandler(async (req, res) => {
  const cfps = await CallForPaper.find().sort({ createdAt: -1 });
  res.json({ success: true, data: cfps });
});

export const createCfp = asyncHandler(async (req, res) => {
  if (req.body.isActive) {
    await CallForPaper.updateMany({ isActive: true }, { $set: { isActive: false } });
  }
  const cfp = await CallForPaper.create(req.body);
  res.status(201).json({ success: true, data: cfp });
});

export const updateCfp = asyncHandler(async (req, res) => {
  if (req.body.isActive) {
    await CallForPaper.updateMany({ _id: { $ne: req.params.id }, isActive: true }, { $set: { isActive: false } });
  }
  const cfp = await CallForPaper.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cfp) throw new ApiError(404, 'Call for Papers not found.');
  res.json({ success: true, data: cfp });
});

export const deleteCfp = asyncHandler(async (req, res) => {
  const cfp = await CallForPaper.findByIdAndDelete(req.params.id);
  if (!cfp) throw new ApiError(404, 'Call for Papers not found.');
  res.json({ success: true, data: null });
});

export const uploadCfpFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded.');
  
  // Return the public URL for the file
  const path = `/${req.file.bucket}/${req.file.key}`;
  res.json({
    success: true,
    data: { url: path },
  });
});
