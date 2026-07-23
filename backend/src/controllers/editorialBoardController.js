import EditorialMember from '../models/EditorialMember.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

export const listEditorialBoard = asyncHandler(async (req, res) => {
  const members = await EditorialMember.find().sort({ role: 1, order: 1 });
  res.json({ success: true, data: members });
});

export const createEditorialMember = asyncHandler(async (req, res) => {
  const member = await EditorialMember.create(req.body);
  res.status(201).json({ success: true, data: member });
});

export const updateEditorialMember = asyncHandler(async (req, res) => {
  const member = await EditorialMember.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!member) throw new ApiError(404, 'Editorial board member not found.');
  res.json({ success: true, data: member });
});

export const deleteEditorialMember = asyncHandler(async (req, res) => {
  const member = await EditorialMember.findByIdAndDelete(req.params.id);
  if (!member) throw new ApiError(404, 'Editorial board member not found.');
  res.json({ success: true, data: null });
});
