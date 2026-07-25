import ExcelJS from 'exceljs';
import Submission from '../models/Submission.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { generateTrackingId } from '../utils/idGenerators.js';
import { getOrCreateSettings } from './settingsController.js';
import {
  sendSubmissionReceivedEmail,
  sendAdminNewSubmissionNotice,
  sendSubmissionStatusEmail,
} from '../services/emailService.js';

const PAGE_SIZE = 15;

// Files now upload directly to Supabase Storage (see middleware/upload.js),
// which already gives back a full public URL on `file.path` /
// `file.publicUrl`. This replaces the old disk-based
// `${host}/uploads/${folder}/${filename}` URL construction — the only
// change required by the storage migration itself.
function fileUrl(req, file) {
  if (!file) return undefined;
  return file.publicUrl || file.path;
}

const REQUIRED_FIELDS = [
  ['authorName', 'Author name'],
  ['email', 'Email address'],
  ['phone', 'Mobile number'],
  ['institution', 'Institution / organization'],
  ['country', 'Country'],
  ['paperTitle', 'Paper title'],
  ['abstract', 'Abstract'],
  ['keywords', 'Keywords'],
  ['subject', 'Subject area'],
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose ORCID format check: 0000-0000-0000-000X
const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

function validateSubmissionBody(body) {
  const errors = {};

  for (const [field, label] of REQUIRED_FIELDS) {
    if (!body[field] || !String(body[field]).trim()) {
      errors[field] = `${label} is required.`;
    }
  }

  if (body.email && !EMAIL_REGEX.test(body.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (body.orcid && body.orcid.trim() && !ORCID_REGEX.test(body.orcid.trim())) {
    errors.orcid = 'ORCID iD should look like 0000-0002-1825-0097.';
  }

  return errors;
}

export const createSubmission = asyncHandler(async (req, res) => {
  const filesArray = Array.isArray(req.files) ? req.files : [];
  const manuscriptFile = filesArray.find(f => f.fieldname === 'manuscript');
  const copyrightFile = filesArray.find(f => f.fieldname === 'copyrightForm');

  const errors = validateSubmissionBody(req.body);
  if (!manuscriptFile) {
    errors.manuscript = 'A manuscript file (PDF, DOC, or DOCX) is required.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Please correct the highlighted fields and try again.',
      errors,
    });
  }

  const trackingId = await generateTrackingId();
  const settings = await getOrCreateSettings();
  
  const standardFields = new Set([
    'authorName', 'coAuthors', 'email', 'phone', 'institution', 'department',
    'country', 'orcid', 'paperTitle', 'abstract', 'keywords', 'subject', 'message'
  ]);
  
  const customFields = {};
  
  // Extract custom text fields
  for (const [key, value] of Object.entries(req.body)) {
    if (!standardFields.has(key)) {
      customFields[key] = value;
    }
  }
  
  // Extract custom file uploads
  for (const file of filesArray) {
    if (file.fieldname !== 'manuscript' && file.fieldname !== 'copyrightForm') {
      customFields[file.fieldname] = fileUrl(req, file);
      customFields[`${file.fieldname}_name`] = file.originalname;
    }
  }

  const submission = await Submission.create({
    trackingId,
    authorName: req.body.authorName,
    coAuthors: req.body.coAuthors,
    email: req.body.email,
    phone: req.body.phone,
    institution: req.body.institution,
    department: req.body.department,
    country: req.body.country,
    orcid: req.body.orcid,
    paperTitle: req.body.paperTitle,
    abstract: req.body.abstract,
    keywords: req.body.keywords,
    subject: req.body.subject,
    message: req.body.message,
    manuscriptUrl: fileUrl(req, manuscriptFile),
    manuscriptFileName: manuscriptFile?.originalname,
    copyrightFormUrl: fileUrl(req, copyrightFile),
    copyrightFormFileName: copyrightFile?.originalname,
    amount: settings.publicationFeeAmount,
    currency: settings.publicationFeeCurrency,
    customFields,
  });

  // Fire-and-forget notification emails — submission succeeds even if
  // SMTP is slow or briefly unavailable.
  sendSubmissionReceivedEmail(submission).catch((err) =>
    console.error('[mail] Failed to send submission-received email:', err.message)
  );
  sendAdminNewSubmissionNotice(submission).catch((err) =>
    console.error('[mail] Failed to send admin notice:', err.message)
  );

  res.status(201).json({
    success: true,
    data: {
      _id: submission._id,
      trackingId: submission.trackingId,
      amount: submission.amount,
    },
  });
});

// --- Admin ---

export const adminListSubmissions = asyncHandler(async (req, res) => {
  const { search, status, page = 1 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * PAGE_SIZE;
  const [items, totalCount] = await Promise.all([
    Submission.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(PAGE_SIZE),
    Submission.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    page: Number(page),
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    totalCount,
  });
});

export const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { status, revisionNote } = req.body;
  const updates = { status };
  if (status === 'revision-requested') {
    updates.revisionNote = revisionNote || '';
  }

  const submission = await Submission.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!submission) throw new ApiError(404, 'Submission not found.');

  if (['accepted', 'rejected', 'revision-requested'].includes(status)) {
    sendSubmissionStatusEmail(submission).catch((err) =>
      console.error('[mail] Failed to send status-update email:', err.message)
    );
  }

  res.json({ success: true, data: submission });
});

export const deleteSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findByIdAndDelete(req.params.id);
  if (!submission) throw new ApiError(404, 'Submission not found.');
  res.json({ success: true, data: null });
});

export const exportSubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find().sort({ submittedAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Submissions');

  sheet.columns = [
    { header: 'Tracking ID', key: 'trackingId', width: 22 },
    { header: 'Author', key: 'authorName', width: 24 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Mobile', key: 'phone', width: 16 },
    { header: 'ORCID', key: 'orcid', width: 22 },
    { header: 'Institution', key: 'institution', width: 28 },
    { header: 'Country', key: 'country', width: 16 },
    { header: 'Paper Title', key: 'paperTitle', width: 40 },
    { header: 'Subject', key: 'subject', width: 20 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Payment Status', key: 'paymentStatus', width: 18 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Submitted At', key: 'submittedAt', width: 20 },
  ];

  submissions.forEach((s) => sheet.addRow(s.toObject()));
  sheet.getRow(1).font = { bold: true };

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename=submissions.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});
