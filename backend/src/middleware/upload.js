import multer from 'multer';
import { supabaseStorage } from '../lib/supabaseStorageEngine.js';

// Files now upload directly to Supabase Storage buckets instead of local
// disk (see sql/002_storage.sql for bucket creation). Field → bucket
// mapping mirrors the original local folder-per-field-type layout:
//   manuscript/copyrightForm -> documents   (was papers/ + copyright-forms/)
//   cover                    -> covers
//   logo/favicon             -> logos       (was branding/)
//   hero/heroImage           -> hero
//   photo                    -> avatars     (was editorial/)
//   newsImage                -> news        (was news/)
function bucketFor(fieldname) {
  if (fieldname === 'manuscript' || fieldname === 'copyrightForm' || fieldname === 'cfpPdf' || fieldname === 'pdf') return 'documents';
  if (fieldname === 'cover') return 'covers';
  if (fieldname === 'logo' || fieldname === 'favicon') return 'logos';
  if (fieldname === 'hero' || fieldname === 'heroImage' || fieldname === 'backgroundImage') return 'hero';
  if (fieldname === 'photo') return 'avatars';
  if (fieldname === 'newsImage' || fieldname === 'poster' || fieldname === 'brochure') return 'news'; // We use 'news' bucket for posters/brochures to avoid creating new buckets, or 'gallery'.
  if (fieldname === 'upload' || fieldname === 'qrCode') return 'gallery'; // CKEditor 5 default field name
  if (fieldname === 'paymentProof') return 'documents';
  
  // If it's a dynamic submission upload, put it in documents.
  // We can't know all dynamic names here, so if it's not a known field, we'll default to documents 
  // since the only dynamic file uploads in the public API are for submissions.
  if (fieldname.startsWith('custom_') || !['cover', 'logo', 'favicon', 'hero', 'heroImage', 'backgroundImage', 'photo', 'newsImage', 'poster', 'brochure'].includes(fieldname)) {
    return 'documents';
  }
  
  return 'gallery';
}

const storage = supabaseStorage(bucketFor);

// ── Document filter (PDF / DOC / DOCX) ───────────────────────────────────
const ALLOWED_DOC_MIMETYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
function documentFileFilter(req, file, cb) {
  if (ALLOWED_DOC_MIMETYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, or DOCX files are allowed.'));
  }
}

const ALLOWED_PDF_IMAGE_MIMETYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp'
]);
function pdfOrImageFileFilter(req, file, cb) {
  if (ALLOWED_PDF_IMAGE_MIMETYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF or Image (PNG/JPG/WEBP) files are allowed.'));
  }
}

// ── Image filter (PNG / JPG / JPEG / WEBP + SVG for logo) ────────────────
// Supported: PNG, JPG, JPEG, WEBP. SVG allowed for logo/branding only.
const IMAGE_MIMETYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const SVG_MIMETYPE = 'image/svg+xml';

function imageFileFilter(req, file, cb) {
  if (IMAGE_MIMETYPES.has(file.mimetype)) return cb(null, true);
  cb(new Error('Unsupported format. Supported: PNG, JPG, JPEG, WEBP. Max size: 5 MB.'));
}

function logoFileFilter(req, file, cb) {
  if (IMAGE_MIMETYPES.has(file.mimetype) || file.mimetype === SVG_MIMETYPE) return cb(null, true);
  cb(new Error('Unsupported format. Supported: PNG, JPG, JPEG, WEBP, SVG (logo only). Max size: 5 MB.'));
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// ── Exports ───────────────────────────────────────────────────────────────

export const uploadSubmissionFiles = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Dynamic form fields can be documents or images.
    const allowedMimeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/webp'
    ]);
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed.`));
    }
  }
}).any();

export const uploadCover = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('cover');

export const uploadLogo = multer({
  storage,
  fileFilter: logoFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('logo');

export const uploadHeroImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('heroImage');

export const uploadBackgroundImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('backgroundImage');

export const uploadPhoto = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('photo');

export const uploadNewsImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('newsImage');

export const uploadCfpPdf = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).single('cfpPdf');

export const uploadCfpPoster = multer({
  storage,
  fileFilter: pdfOrImageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single('poster');

export const uploadCfpBrochure = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).single('brochure');

export const uploadPageImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('upload');

export const uploadPaymentProof = multer({
  storage,
  fileFilter: pdfOrImageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single('paymentProof');

export const uploadQrCode = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('qrCode');

// Article PDF + thumbnail – accepts up to one pdf and one thumbnail image.
export const uploadArticleFiles = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
  fileFilter: (req, file, cb) => {
    const ALLOWED = new Set([
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
    ]);
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
}).fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// Multer error → user-friendly message
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size: 5 MB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err && err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
}
