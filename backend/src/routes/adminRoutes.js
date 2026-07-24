import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { login, me, updateProfile, updatePassword } from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimiters.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import {
  adminListSubmissions,
  updateSubmissionStatus,
  deleteSubmission,
  exportSubmissions,
} from '../controllers/submissionController.js';
import {
  adminListIssues,
  createIssue,
  updateIssue,
  deleteIssue,
  setCurrentIssue,
} from '../controllers/issueController.js';
import {
  adminListArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from '../controllers/articleController.js';
import {
  listEditorialBoard,
  createEditorialMember,
  updateEditorialMember,
  deleteEditorialMember,
} from '../controllers/editorialBoardController.js';
import { adminGetPageBySlug, upsertPage } from '../controllers/pageController.js';
import { listFaqs, createFaq, updateFaq, deleteFaq } from '../controllers/faqController.js';
import { adminListNews, createNews, updateNews, deleteNews } from '../controllers/newsController.js';
import { adminListContacts, deleteContact } from '../controllers/contactController.js';
import { adminGetSettings, adminUpdateSettings } from '../controllers/settingsController.js';
import {
  adminListPayments,
  adminUpdatePaymentStatus,
} from '../controllers/paymentController.js';
import {
  adminListNav,
  createNavItem,
  updateNavItem,
  deleteNavItem,
  reorderNavItem,
  addNavChild,
  updateNavChild,
  deleteNavChild,
} from '../controllers/navController.js';
import {
  adminListHeroes,
  createHero,
  updateHero,
  deleteHero,
} from '../controllers/heroController.js';
import {
  adminListCfps,
  createCfp,
  updateCfp,
  deleteCfp,
  adminSetActiveCfp,
} from '../controllers/cfpController.js';
import {
  adminGetGuidelineDocuments,
  adminUploadGuidelineDocument,
  adminDeleteGuidelineDocument,
  adminSetActiveGuidelineDocument,
} from '../controllers/guidelineDocumentController.js';
import Issue from '../models/Issue.js';
import Settings from '../models/Settings.js';
import {
  uploadCover,
  uploadLogo,
  uploadHeroImage,
  uploadBackgroundImage,
  uploadPhoto,
  uploadNewsImage,
  uploadCfpPdf,
  uploadCfpPoster,
  uploadCfpBrochure,
  uploadGuidelineDocument,
  handleUploadError,
} from '../middleware/upload.js';

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────────
router.post('/auth/login', loginLimiter, login);
router.get('/auth/me', requireAdmin, me);
router.put('/auth/profile', requireAdmin, updateProfile);
router.put('/auth/password', requireAdmin, updatePassword);

// Everything below requires a valid admin session.
router.use(requireAdmin);

// ── Dashboard ─────────────────────────────────────────────────────────────
router.get('/dashboard/stats', getDashboardStats);

// ── Submissions ───────────────────────────────────────────────────────────
router.get('/submissions', adminListSubmissions);
router.get('/submissions/export', exportSubmissions);
router.patch('/submissions/:id', updateSubmissionStatus);
router.delete('/submissions/:id', deleteSubmission);

// ── Issues ────────────────────────────────────────────────────────────────
router.get('/issues', adminListIssues);
router.post('/issues', createIssue);
router.put('/issues/:id', updateIssue);
router.delete('/issues/:id', deleteIssue);
router.patch('/issues/:id/set-current', setCurrentIssue);

// Cover image upload: uploads file AND updates the Issue document's coverImageUrl.
router.post('/issues/:id/cover',
  (req, res, next) => uploadCover(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file uploaded.' });
      }
      const coverImageUrl = req.file.publicUrl;
      const issue = await Issue.findByIdAndUpdate(
        req.params.id,
        { coverImageUrl },
        { new: true }
      );
      if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });
      res.json({ success: true, data: { url: coverImageUrl, issue } });
    } catch (err) {
      next(err);
    }
  }
);

// ── Articles ──────────────────────────────────────────────────────────────
router.get('/articles', adminListArticles);
router.post('/articles', createArticle);
router.put('/articles/:id', updateArticle);
router.delete('/articles/:id', deleteArticle);

// ── Editorial Board ───────────────────────────────────────────────────────
router.get('/editorial-board', listEditorialBoard);
router.post('/editorial-board', createEditorialMember);
router.put('/editorial-board/:id', updateEditorialMember);
router.delete('/editorial-board/:id', deleteEditorialMember);

// Editorial board member photo upload
router.post('/editorial-board/:id/photo',
  (req, res, next) => uploadPhoto(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded.' });
      const { default: EditorialMember } = await import('../models/EditorialMember.js');
      const photoUrl = req.file.publicUrl;
      const member = await EditorialMember.findByIdAndUpdate(
        req.params.id,
        { photoUrl },
        { new: true }
      );
      if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
      res.json({ success: true, data: { url: photoUrl, member } });
    } catch (err) {
      next(err);
    }
  }
);

// ── Pages (CMS) ───────────────────────────────────────────────────────────
router.get('/pages/:slug', adminGetPageBySlug);
router.put('/pages/:slug', upsertPage);

// ── FAQs ──────────────────────────────────────────────────────────────────
router.get('/faqs', listFaqs);
router.post('/faqs', createFaq);
router.put('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);

// ── News ──────────────────────────────────────────────────────────────────
router.get('/news', adminListNews);
router.post('/news', createNews);
router.put('/news/:id', updateNews);
router.delete('/news/:id', deleteNews);

// News image upload
router.post('/news/:id/image',
  (req, res, next) => uploadNewsImage(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No image file uploaded.' });
      const { default: News } = await import('../models/News.js');
      const imageUrl = req.file.publicUrl;
      const news = await News.findByIdAndUpdate(req.params.id, { imageUrl }, { new: true });
      if (!news) return res.status(404).json({ success: false, message: 'News post not found.' });
      res.json({ success: true, data: { url: imageUrl, news } });
    } catch (err) {
      next(err);
    }
  }
);

// ── Contacts ──────────────────────────────────────────────────────────────
router.get('/contacts', adminListContacts);
router.delete('/contacts/:id', deleteContact);

// ── Settings ──────────────────────────────────────────────────────────────
router.get('/settings', adminGetSettings);
router.put('/settings', adminUpdateSettings);

// Logo upload: upload file AND immediately persist the logoUrl in Settings DB.
router.post('/settings/logo',
  (req, res, next) => uploadLogo(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file uploaded.' });
      }
      const logoUrl = req.file.publicUrl;
      // Auto-persist to Settings so it survives without the admin clicking Save separately.
      await Settings.findOneAndUpdate(
        { singletonKey: 'main' },
        { logoUrl },
        { upsert: true }
      );
      res.json({ success: true, data: { url: logoUrl } });
    } catch (err) {
      next(err);
    }
  }
);

// Hero image upload: upload file AND append to Settings.heroImages array.
router.post('/settings/hero-image',
  (req, res, next) => uploadHeroImage(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file uploaded.' });
      }
      const heroImageUrl = req.file.publicUrl;
      const settings = await Settings.findOneAndUpdate(
        { singletonKey: 'main' },
        { $push: { heroImages: { url: heroImageUrl, alt: req.body.alt || '', createdAt: new Date() } } },
        { upsert: true, new: true }
      );
      res.json({ success: true, data: { url: heroImageUrl, settings } });
    } catch (err) {
      next(err);
    }
  }
);

// Delete a hero image by URL
router.delete('/settings/hero-image', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'Image URL is required.' });
    await Settings.findOneAndUpdate(
      { singletonKey: 'main' },
      { $pull: { heroImages: { url } } }
    );
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// ── Payments ──────────────────────────────────────────────────────────────
router.get('/payments', adminListPayments);
router.patch('/payments/:id', adminUpdatePaymentStatus);

// ── Navigation ────────────────────────────────────────────────────────────
router.get('/nav', adminListNav);
router.post('/nav', createNavItem);
router.put('/nav/:id', updateNavItem);
router.delete('/nav/:id', deleteNavItem);
router.patch('/nav/:id/reorder', reorderNavItem);
router.post('/nav/:id/children', addNavChild);
router.put('/nav/:id/children/:childId', updateNavChild);
router.delete('/nav/:id/children/:childId', deleteNavChild);

// ── Heroes (CMS) ──────────────────────────────────────────────────────────
router.get('/heroes', adminListHeroes);
router.post('/heroes', createHero);
router.put('/heroes/:id', updateHero);
router.delete('/heroes/:id', deleteHero);

router.post('/heroes/upload-image',
  (req, res, next) => uploadHeroImage(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    res.json({ success: true, data: { url: req.file.publicUrl } });
  }
);

router.post('/heroes/upload-bg',
  (req, res, next) => uploadBackgroundImage(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No background image file uploaded.' });
    res.json({ success: true, data: { url: req.file.publicUrl } });
  }
);

// ── Call for Papers (CMS) ──────────────────────────────────────────────────
router.get('/cfps', adminListCfps);
router.post('/cfps', createCfp);
router.put('/cfps/:id', updateCfp);
router.delete('/cfps/:id', deleteCfp);
router.patch('/cfps/:id/set-active', adminSetActiveCfp);

router.post('/cfps/upload-pdf',
  (req, res, next) => uploadCfpPdf(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
    res.json({ success: true, data: { url: req.file.publicUrl } });
  }
);

router.post('/cfps/upload-poster',
  (req, res, next) => uploadCfpPoster(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No poster file uploaded.' });
    res.json({ success: true, data: { url: req.file.publicUrl } });
  }
);

router.post('/cfps/upload-brochure',
  (req, res, next) => uploadCfpBrochure(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No brochure file uploaded.' });
    res.json({ success: true, data: { url: req.file.publicUrl } });
  }
);

// --- Submission Guidelines DMS ---
router.get('/guideline-documents', adminGetGuidelineDocuments);
router.post('/guideline-documents/upload', 
  (req, res, next) => uploadGuidelineDocument(req, res, (err) => err ? handleUploadError(err, req, res, next) : next()),
  adminUploadGuidelineDocument
);
router.patch('/guideline-documents/:id/set-active', adminSetActiveGuidelineDocument);
router.delete('/guideline-documents/:id', adminDeleteGuidelineDocument);

export default router;
