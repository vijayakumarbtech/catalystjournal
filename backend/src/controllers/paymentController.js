import Submission from '../models/Submission.js';
import Payment from '../models/Payment.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { createOrder, verifySignature } from '../services/paymentService.js';
import { getOrCreateSettings } from './settingsController.js';
import {
  sendPaymentSuccessEmail,
  sendPaymentUnderVerificationEmail,
  sendPaymentVerifiedEmail,
  sendPaymentRejectedEmail,
} from '../services/emailService.js';

// Returns the admin-configured payment method options for the public
// Payment page — never hardcoded, always read from Settings.
export const getPaymentMethods = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ success: true, data: settings.paymentMethods });
});

// --- Razorpay flow (covers Card / Debit Card / Net Banking / Wallet,
// which Razorpay Checkout presents as tabs within one widget) ---

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { submissionId } = req.body;

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found.');
  if (submission.paymentStatus === 'paid') {
    throw new ApiError(400, 'This submission has already been paid for.');
  }

  // Amount comes from the submission record (set server-side at creation
  // time from Settings), never from the request body.
  const order = await createOrder({
    amount: submission.amount,
    currency: submission.currency,
    receipt: submission.trackingId,
  });

  submission.orderId = order.id;
  await submission.save();

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { submissionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found.');

  const isValid = verifySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    submission.paymentStatus = 'failed';
    await submission.save();
    await Payment.create({
      submission: submission._id,
      trackingId: submission.trackingId,
      method: 'razorpay',
      orderId: razorpay_order_id,
      transactionId: razorpay_payment_id,
      amount: submission.amount,
      currency: submission.currency,
      status: 'failed',
    });
    throw new ApiError(400, 'Payment verification failed. Signature mismatch.');
  }

  submission.paymentStatus = 'paid';
  submission.paymentId = razorpay_payment_id;
  submission.paidAt = new Date();
  await submission.save();

  await Payment.create({
    submission: submission._id,
    trackingId: submission.trackingId,
    method: 'razorpay',
    orderId: razorpay_order_id,
    transactionId: razorpay_payment_id,
    amount: submission.amount,
    currency: submission.currency,
    status: 'paid',
    verifiedAt: new Date(),
  });

  sendPaymentSuccessEmail(submission).catch((err) =>
    console.error('[mail] Failed to send payment-success email:', err.message)
  );

  res.json({ success: true, data: { status: 'paid' } });
});

// --- Manual/redirect flow (UPI, Google Pay, PhonePe, Paytm, Stripe link)
//
// These channels don't give us a server-verifiable callback the way
// Razorpay Checkout does, so the author self-reports a transaction
// reference and the payment is marked "under-verification" until an
// admin confirms it in the Payment Management screen. This is the
// standard pattern smaller institutions use for UPI-style payment links. ---

const MANUAL_METHODS = new Set(['upi', 'googlepay', 'phonepe', 'paytm', 'stripe']);

export const submitManualPayment = asyncHandler(async (req, res) => {
  const { submissionId, method, transactionId, authorNote } = req.body;

  if (!MANUAL_METHODS.has(method)) {
    throw new ApiError(400, 'Invalid payment method for manual reporting.');
  }
  if (!transactionId || !transactionId.trim()) {
    throw new ApiError(400, 'Please enter your transaction / reference ID.');
  }

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found.');
  if (submission.paymentStatus === 'paid') {
    throw new ApiError(400, 'This submission has already been paid for.');
  }

  const payment = await Payment.create({
    submission: submission._id,
    trackingId: submission.trackingId,
    method,
    transactionId: transactionId.trim(),
    amount: submission.amount,
    currency: submission.currency,
    status: 'under-verification',
    authorNote,
  });

  submission.paymentStatus = 'under-verification';
  await submission.save();

  sendPaymentUnderVerificationEmail(submission, payment).catch((err) =>
    console.error('[mail] Failed to send under-verification email:', err.message)
  );

  res.status(201).json({ success: true, data: { status: 'under-verification' } });
});

// --- Admin: Payment Management ---

const PAGE_SIZE = 15;

export const adminListPayments = asyncHandler(async (req, res) => {
  const { search, status, page = 1 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * PAGE_SIZE;
  const [items, totalCount] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).populate('submission'),
    Payment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    page: Number(page),
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    totalCount,
  });
});

export const adminUpdatePaymentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'paid', 'failed', 'under-verification'].includes(status)) {
    throw new ApiError(400, 'Invalid payment status.');
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found.');

  payment.status = status;
  if (status === 'paid') {
    payment.verifiedBy = req.admin._id;
    payment.verifiedAt = new Date();
  }
  await payment.save();

  const submission = await Submission.findById(payment.submission);
  if (submission) {
    submission.paymentStatus = status;
    if (status === 'paid') {
      submission.paymentId = payment.transactionId;
      submission.paidAt = new Date();
    }
    await submission.save();

    if (status === 'paid') {
      sendPaymentVerifiedEmail(submission, payment).catch((err) =>
        console.error('[mail] Failed to send payment-verified email:', err.message)
      );
    } else if (status === 'failed') {
      sendPaymentRejectedEmail(submission, payment).catch((err) =>
        console.error('[mail] Failed to send payment-rejected email:', err.message)
      );
    }
  }

  res.json({ success: true, data: payment });
});
