import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance;

function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }

  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  return razorpayInstance;
}

// Amount and currency are always determined server-side (from Settings),
// never trusted from the client, to prevent tampering with the fee.
export async function createOrder({ amount, currency, receipt }) {
  const instance = getRazorpay();
  return instance.orders.create({
    amount,
    currency,
    receipt,
    payment_capture: 1,
  });
}

export function verifySignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expected === signature;
}
