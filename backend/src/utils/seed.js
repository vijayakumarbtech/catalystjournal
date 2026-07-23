// Seeds the database with an initial admin account and a small amount of
// sample content so the site isn't empty on first run.
//
// Usage: npm run seed

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "SERVICE_ROLE:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "Loaded" : "Missing"
);

// IMPORTANT: import AFTER dotenv has loaded
const { connectDB } = await import('../config/supabase.js');
const { default: Admin } = await import('../models/Admin.js');
const { default: Settings } = await import('../models/Settings.js');
const { default: Faq } = await import('../models/Faq.js');
const { default: CmsPage } = await import('../models/CmsPage.js');
const { default: EditorialMember } = await import('../models/EditorialMember.js');
const { default: NavItem } = await import('../models/NavItem.js');

async function seed() {
  await connectDB();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@thecatalyst.example';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await Admin.hashPassword(adminPassword);
    await Admin.create({ name: 'Administrator', email: adminEmail, passwordHash });
    console.log(`[seed] Created admin: ${adminEmail} / ${adminPassword}`);
    console.log('[seed] IMPORTANT: change this password after first login.');
  } else {
    console.log('[seed] Admin already exists, skipping.');
  }

  const settingsCount = await Settings.countDocuments({ singletonKey: 'main' });
  if (settingsCount === 0) {
    await Settings.create({
      singletonKey: 'main',
      journalName: 'The Catalyst',
      tagline: 'International Journal of Multidisciplinary Research and Innovation',
      issn: '2999-0000',
      frequency: 'Quarterly',
      language: 'English',
      email: 'editor@thecatalyst.example',
      phone: '+91 00000 00000',
      whatsappNumber: '+910000000000',
      address: 'Chennai, Tamil Nadu, India',
      stats: {
        yearsOfPublication: 5,
        totalArticles: 320,
        totalAuthors: 540,
        countriesReached: 42,
        totalDownloads: 18500,
      },
      publicationFeeAmount: 250000,
      publicationFeeCurrency: 'INR',
      paymentMethods: {
        upiId: '',
        googlePayLink: '',
        phonePeLink: '',
        paytmLink: '',
        stripeLink: '',
        razorpayEnabled: true,
        bankDetails: { accountName: '', accountNumber: '', ifscCode: '', bankName: '' },
      },
    });
    console.log('[seed] Created default settings.');
  }

  const faqCount = await Faq.countDocuments();
  if (faqCount === 0) {
    await Faq.insertMany([
      {
        question: 'What is the publication fee?',
        answer: 'The current publication fee is displayed at the payment step of submission and covers peer review, DOI assignment, and online hosting.',
        order: 1,
      },
      {
        question: 'How long does the review process take?',
        answer: 'Editorial decisions are typically made within 3–4 weeks of submission.',
        order: 2,
      },
      {
        question: 'Can I submit a co-authored paper?',
        answer: 'Yes — please list all co-authors in the submission form.',
        order: 3,
      },
    ]);
    console.log('[seed] Created sample FAQs.');
  }

  const pageCount = await CmsPage.countDocuments();
  if (pageCount === 0) {
    await CmsPage.insertMany([
      {
        slug: 'submission-guidelines',
        title: 'Submission Guidelines',
        contentHtml: '<p>Before submitting your manuscript to The Catalyst, please review our Open Access Statement &amp; Licensing, Peer Review Policy, and Publication Ethics &amp; Malpractice Statement, linked below.</p>',
      },
      {
        slug: 'open-access-statement',
        title: 'Open Access Statement & Licensing',
        contentHtml: '<p>The Catalyst is a fully open-access journal. All articles are published under a Creative Commons license, freely available to read, download, and share with proper attribution.</p>',
      },
      {
        slug: 'peer-review-policy',
        title: 'Peer Review Policy',
        contentHtml: '<p>All submissions undergo double-blind peer review by at least two independent reviewers with relevant subject-matter expertise.</p>',
      },
      {
        slug: 'publication-ethics',
        title: 'Publication Ethics & Malpractice Statement',
        contentHtml: '<p>The Catalyst follows COPE guidelines on plagiarism, peer review integrity, authorship, and conflicts of interest.</p>',
      },
      {
        slug: 'guidelines',
        title: 'Author Guidelines',
        contentHtml: '<p>Manuscripts should follow the formatting template available from the editorial office.</p>',
      },
    ]);
    console.log('[seed] Created default CMS pages.');
  }

  const boardCount = await EditorialMember.countDocuments();
  if (boardCount === 0) {
    await EditorialMember.create({
      name: 'Dr. Editor-in-Chief',
      qualification: 'Ph.D.',
      university: 'Sample University',
      country: 'India',
      designation: 'Editor-in-Chief',
      role: 'editor-in-chief',
      order: 1,
    });
    console.log('[seed] Created a placeholder editorial board entry.');
  }

  const navCount = await NavItem.countDocuments();
  if (navCount === 0) {
    await NavItem.insertMany([
      { location: 'header', label: 'Home', path: '/', order: 1, enabled: true },
      {
        location: 'header',
        label: 'Submission Guidelines',
        path: '/submission-guidelines',
        order: 2,
        enabled: true,
        children: [
          { label: 'Open Access Statement & Licensing', path: '/open-access-statement', order: 1, enabled: true },
          { label: 'Peer Review Policy', path: '/peer-review-policy', order: 2, enabled: true },
          { label: 'Publication Ethics & Malpractice Statement', path: '/publication-ethics', order: 3, enabled: true },
        ],
      },
      { location: 'header', label: 'Editorial Board', path: '/editorial-board', order: 3, enabled: true },
      { location: 'header', label: 'Current Issue', path: '/current-issue', order: 4, enabled: true },
      { location: 'header', label: 'Archives', path: '/archives', order: 5, enabled: true },
      { location: 'header', label: 'FAQ', path: '/faq', order: 6, enabled: true },
      { location: 'header', label: 'Contact', path: '/contact', order: 7, enabled: true },

      { location: 'footer-quick', label: 'Current Issue', path: '/current-issue', order: 1, enabled: true },
      { location: 'footer-quick', label: 'Archives', path: '/archives', order: 2, enabled: true },
      { location: 'footer-quick', label: 'Call for Papers', path: '/call-for-papers', order: 3, enabled: true },
      { location: 'footer-quick', label: 'News', path: '/news', order: 4, enabled: true },
      { location: 'footer-quick', label: 'Submit Paper', path: '/submit-paper', order: 5, enabled: true },

      { location: 'footer-policies', label: 'Submission Guidelines', path: '/submission-guidelines', order: 1, enabled: true },
      { location: 'footer-policies', label: 'Publication Ethics', path: '/publication-ethics', order: 2, enabled: true },
      { location: 'footer-policies', label: 'FAQ', path: '/faq', order: 3, enabled: true },
    ]);
    console.log('[seed] Created default navigation.');
  }

  console.log('[seed] Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
