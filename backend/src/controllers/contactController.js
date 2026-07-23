import ContactMessage from '../models/ContactMessage.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { sendContactFormEmail } from '../services/emailService.js';

export const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    throw new ApiError(400, 'All fields are required.');
  }

  const contactMessage = await ContactMessage.create({ name, email, subject, message });

  sendContactFormEmail(contactMessage).catch((err) =>
    console.error('[mail] Failed to send contact notification:', err.message)
  );

  res.status(201).json({ success: true, data: null });
});

// --- Admin ---

export const adminListContacts = asyncHandler(async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.json({ success: true, data: messages });
});

export const deleteContact = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found.');
  res.json({ success: true, data: null });
});
