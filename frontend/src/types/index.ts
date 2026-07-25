// Core domain types shared across The Catalyst frontend.
// These mirror the Mongoose schemas on the backend (see backend/src/models).

export interface Author {
  name: string;
  email?: string;
  institution?: string;
  affiliation?: string;
  country?: string;
  orcid?: string;
  isCorresponding?: boolean;
}

export interface Article {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  authors: Author[];
  abstract: string;
  keywords: string[];
  subject: string;
  doi?: string;
  paperId: string;
  volume: number;
  issue: number;
  year: number;
  pdfUrl: string;
  thumbnail?: string;
  pages?: string;
  downloadCount: number;
  viewCount: number;
  publishedAt: string;
  publicationDate?: string;
  isFeatured?: boolean;
  status: 'draft' | 'published';
}

export interface Issue {
  _id: string;
  volume: number;
  issue: number;
  year: number;
  title?: string;
  coverImageUrl?: string;
  description?: string;
  articles: Article[];
  isCurrent: boolean;
  publishedAt: string;
}

export interface CallForPaper {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  scope?: string;
  topics: string[];
  submissionDeadline?: string;
  acceptanceDate?: string;
  publicationDate?: string;
  instructions?: string;
  posterUrl?: string;
  pdfUrl?: string;
  brochureUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface EditorialMember {
  _id: string;
  name?: string;
  photoUrl?: string;
  qualification?: string;
  /** Replaces the old `university` field. */
  affiliation?: string;
  /** Legacy alias — the DB column is still named `university`. Both may be
   *  present; prefer `affiliation` when reading. */
  university?: string;
  country?: string;
  designation?: string;
  role?: 'editor-in-chief' | 'associate-editor' | 'editorial-board' | 'reviewer' | 'managing-director';
  /** Official Profile URL (replaces the old LinkedIn-only `linkedin` field). */
  profileUrl?: string;
  /** Legacy alias — the DB column is `linkedin`. Both may be present. */
  linkedin?: string;
  email?: string;
  order: number;
}

export interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
}

export interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  body: string;
  imageUrl?: string;
  publishedAt: string;
}

export interface CmsPage {
  _id: string;
  slug: string; // e.g. "submission-guidelines", "open-access-statement", "peer-review-policy", "publication-ethics"
  title: string;
  contentHtml: string;
  metaDescription?: string;
  updatedAt: string;
}

export interface SiteSettings {
  journalName: string;
  subtitle?: string;
  logoText?: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  issn?: string;
  frequency?: string;
  language?: string;
  footerCopyrightText?: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  socials: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  announcementBar?: {
    enabled: boolean;
    text: string;
    linkUrl?: string;
  };
  stats: {
    statsEnabled?: boolean;
    yearsOfPublication: number;
    totalArticles: number;
    totalAuthors: number;
    countriesReached: number;
    totalDownloads: number;
  };
  hero?: {
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    primaryButtonText?: string;
    primaryButtonUrl?: string;
    secondaryButtonText?: string;
    secondaryButtonUrl?: string;
  };
  heroImages?: { url: string; alt: string; _id?: string }[];
  paymentMethods?: PaymentMethodsConfig;
  publicationFeeAmount?: number;
  publicationFeeCurrency?: string;
}

export interface PaymentMethodsConfig {
  manualPaymentEnabled: boolean;
  payeeName?: string;
  qrCodeUrl?: string;
  paymentInstructions?: string;
  upiId: string;
  googlePayLink: string;
  phonePeLink: string;
  paytmLink: string;
  stripeLink: string;
  razorpayEnabled: boolean;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

export interface SubmissionFormValues {
  authorName: string;
  coAuthors?: string;
  email: string;
  phone: string;
  institution: string;
  department?: string;
  country: string;
  orcid?: string;
  paperTitle: string;
  abstract: string;
  keywords: string;
  subject: string;
  message?: string;
}

export type SubmissionStatus = 'pending' | 'under-review' | 'accepted' | 'rejected' | 'revision-requested';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'under-verification';

export interface Submission extends SubmissionFormValues {
  _id: string;
  trackingId: string; // e.g. TC-SUB-2026-000123
  manuscriptUrl: string;
  manuscriptFileName?: string;
  copyrightFormUrl?: string;
  copyrightFormFileName?: string;
  status: SubmissionStatus;
  revisionNote?: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  submittedAt: string;
}

export type PaymentMethod =
  | 'razorpay'
  | 'upi'
  | 'googlepay'
  | 'phonepe'
  | 'paytm'
  | 'stripe'
  | 'bank-transfer';

export interface Payment {
  _id: string;
  submission: Submission | string;
  trackingId: string;
  method: PaymentMethod;
  transactionId?: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  authorNote?: string;
  payerName?: string;
  payerEmail?: string;
  paymentDate?: string;
  screenshotUrl?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface NavChild {
  _id: string;
  label: string;
  path: string;
  order: number;
  enabled: boolean;
}

export interface NavItemType {
  _id: string;
  location: 'header' | 'footer-quick' | 'footer-policies';
  label: string;
  path?: string;
  order: number;
  enabled: boolean;
  children: NavChild[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  page: number;
  totalPages: number;
  totalCount: number;
}

export interface Hero {
  _id: string;
  heading: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  heroImageUrl?: string;
  backgroundImageUrl?: string;
  isEnabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'email' 
  | 'phone' 
  | 'url' 
  | 'date' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'multi-select' 
  | 'file_upload';

export interface FormField {
  _id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isSystem: boolean;
  isEnabled: boolean;
  options: string[];
  validation: {
    minLength?: number;
    maxLength?: number;
    allowedTypes?: string[];
    maxSize?: number; // in MB
  };
  conditionalLogic?: {
    dependsOn: string;
    value: string;
  };
  width: 'half' | 'full';
  order: number;
}
