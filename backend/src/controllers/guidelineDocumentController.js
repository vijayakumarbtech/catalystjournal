import SubmissionGuidelineDocument from '../models/SubmissionGuidelineDocument.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { deleteByPublicUrl } from '../lib/supabaseStorageEngine.js';
import mammoth from 'mammoth';
import axios from 'axios';

// --- Public ---
export const getActiveGuidelineDocument = asyncHandler(async (req, res) => {
  const document = await SubmissionGuidelineDocument.findOne({ isActive: true });
  res.json({ success: true, data: document });
});

// --- Admin ---
export const adminGetGuidelineDocuments = asyncHandler(async (req, res) => {
  const documents = await SubmissionGuidelineDocument.find().sort({ uploadedAt: -1 });
  res.json({ success: true, data: documents });
});

export const adminUploadGuidelineDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Document file is required.');

  const fileUrl = req.file.publicUrl;
  const originalName = req.file.originalname;
  
  // Determine file type
  let fileType = 'Unknown';
  if (originalName.toLowerCase().endsWith('.pdf')) fileType = 'PDF';
  else if (originalName.toLowerCase().endsWith('.docx')) fileType = 'DOCX';
  else if (originalName.toLowerCase().endsWith('.doc')) fileType = 'DOC';

  let extractedHtml = '';

  // Extract HTML using mammoth for DOCX
  if (fileType === 'DOCX') {
    try {
      // Fetch the file buffer from the URL to parse with mammoth
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      const result = await mammoth.convertToHtml({ buffer });
      extractedHtml = result.value; // The generated HTML
      // result.messages contains warnings/errors if any, ignoring them for now
    } catch (error) {
      console.error('Failed to parse DOCX:', error);
      // Fallback: leave extractedHtml empty so the frontend shows the download button
    }
  }

  // Deactivate all existing documents
  await SubmissionGuidelineDocument.updateMany({}, { $set: { isActive: false } });

  // Create new active document
  const newDocument = await SubmissionGuidelineDocument.create({
    documentName: originalName,
    fileType,
    fileUrl,
    extractedHtml,
    isActive: true,
  });

  res.status(201).json({ success: true, data: newDocument });
});

export const adminDeleteGuidelineDocument = asyncHandler(async (req, res) => {
  const document = await SubmissionGuidelineDocument.findById(req.params.id);
  if (!document) throw new ApiError(404, 'Document not found.');

  await deleteByPublicUrl(document.fileUrl);
  await SubmissionGuidelineDocument.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Document deleted successfully.' });
});

export const adminSetActiveGuidelineDocument = asyncHandler(async (req, res) => {
  const document = await SubmissionGuidelineDocument.findById(req.params.id);
  if (!document) throw new ApiError(404, 'Document not found.');

  await SubmissionGuidelineDocument.updateMany({}, { $set: { isActive: false } });
  
  document.isActive = true;
  await document.save();

  res.json({ success: true, data: document });
});
