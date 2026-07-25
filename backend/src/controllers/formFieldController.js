import FormField from '../models/FormField.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

export const listFormFields = asyncHandler(async (req, res) => {
  const fields = await FormField.find().sort({ order: 1 });
  res.json({ success: true, data: fields });
});

export const createFormField = asyncHandler(async (req, res) => {
  const payload = req.body;
  // Ensure name is unique and well-formatted
  if (!payload.name) {
    throw new ApiError(400, 'Field name is required.');
  }
  // No system flags allowed in create
  payload.isSystem = false;

  const field = await FormField.create(payload);
  res.status(201).json({ success: true, data: field });
});

export const updateFormField = asyncHandler(async (req, res) => {
  const field = await FormField.findById(req.params.id);
  if (!field) throw new ApiError(404, 'Field not found.');

  const payload = req.body;

  // Protect system fields from certain modifications
  if (field.isSystem) {
    delete payload.name;
    delete payload.type;
    delete payload.isSystem; // Can never be toggled off
  }

  const updated = await FormField.findByIdAndUpdate(req.params.id, payload, { new: true });
  res.json({ success: true, data: updated });
});

export const deleteFormField = asyncHandler(async (req, res) => {
  const field = await FormField.findById(req.params.id);
  if (!field) throw new ApiError(404, 'Field not found.');

  if (field.isSystem) {
    throw new ApiError(403, 'System fields cannot be deleted.');
  }

  await FormField.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: null });
});

export const reorderFormFields = asyncHandler(async (req, res) => {
  const { ids } = req.body; // Array of IDs in the new order
  if (!Array.isArray(ids)) throw new ApiError(400, 'Invalid payload: ids array is required.');

  // Update order one by one (could be optimized with a transaction/rpc, but fine for admin usage)
  for (let i = 0; i < ids.length; i++) {
    await FormField.findByIdAndUpdate(ids[i], { order: i * 10 });
  }

  res.json({ success: true, message: 'Reordered successfully' });
});
