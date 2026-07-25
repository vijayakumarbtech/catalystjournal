import { Router } from 'express';
import { getPublicSettings } from '../controllers/settingsController.js';
import { getPublicHeroes } from '../controllers/heroController.js';
import { getActiveCfp } from '../controllers/cfpController.js';
import { listIssues, getCurrentIssue, getIssueById } from '../controllers/issueController.js';
import {
  listArticles,
  getFeaturedArticles,
  getArticleBySlug,
  incrementDownloadCount,
} from '../controllers/articleController.js';
import { listEditorialBoard } from '../controllers/editorialBoardController.js';
import { createSubmission } from '../controllers/submissionController.js';
import {
  getPaymentMethods,
  createPaymentOrder,
  verifyPayment,
  submitManualPayment,
} from '../controllers/paymentController.js';
import { getPageBySlug } from '../controllers/pageController.js';
import { listFaqs } from '../controllers/faqController.js';
import { listNews, getNewsBySlug } from '../controllers/newsController.js';
import { submitContactForm } from '../controllers/contactController.js';
import { subscribeNewsletter } from '../controllers/newsletterController.js';
import { getPublicNav } from '../controllers/navController.js';
import { uploadSubmissionFiles, uploadPaymentProof } from '../middleware/upload.js';
import { submissionLimiter, paymentLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.get('/settings', getPublicSettings);
router.get('/heroes', getPublicHeroes);
router.get('/cfps/active', getActiveCfp);
router.get('/nav', getPublicNav);

router.get('/issues', listIssues);
router.get('/issues/current', getCurrentIssue);
router.get('/issues/:id', getIssueById);

router.get('/articles', listArticles);
router.get('/articles/featured', getFeaturedArticles);
router.get('/articles/:slug', getArticleBySlug);
router.post('/articles/:id/download', incrementDownloadCount);

router.get('/editorial-board', listEditorialBoard);

router.post('/submissions', submissionLimiter, uploadSubmissionFiles, createSubmission);

router.get('/payments/methods', getPaymentMethods);
router.post('/payments/create-order', paymentLimiter, createPaymentOrder);
router.post('/payments/verify', paymentLimiter, verifyPayment);
router.post('/payments/manual', paymentLimiter, uploadPaymentProof, submitManualPayment);

router.get('/pages/:slug', getPageBySlug);
router.get('/faqs', listFaqs);
router.get('/news', listNews);
router.get('/news/:slug', getNewsBySlug);

router.post('/contact', submitContactForm);
router.post('/newsletter/subscribe', subscribeNewsletter);

export default router;
