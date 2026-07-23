import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  Wallet,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { usePaymentMethods } from '@/lib/queries';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import type { PaymentMethod } from '@/types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Loads the Razorpay checkout script once and reuses it across mounts.
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type PageStatus = 'idle' | 'processing' | 'success' | 'under-verification' | 'error';

export default function Payment() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { trackingId?: string; amount?: number } | undefined;
  const { data: methods } = usePaymentMethods();

  const [status, setStatus] = useState<PageStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedMethod, setExpandedMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [authorNote, setAuthorNote] = useState('');
  const [upiCopied, setUpiCopied] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);

  useEffect(() => {
    document.title = 'Payment — The Catalyst';
  }, []);

  async function handleRazorpayPay() {
    setStatus('processing');
    setErrorMsg('');
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load payment gateway. Check your connection.');
      }

      // Backend creates a Razorpay order server-side (amount is set there,
      // never trusted from the client) and returns the order + key ID.
      const { data } = await api.post(`/payments/create-order`, { submissionId });
      const { orderId, amount, currency, keyId } = data.data;

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'The Catalyst',
        description: 'Publication Fee',
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              submissionId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setStatus('success');
          } catch {
            setStatus('error');
            setErrorMsg('Payment succeeded but verification failed. Contact support with your tracking ID.');
          }
        },
        modal: {
          ondismiss: () => setStatus('idle'),
        },
        theme: { color: '#30454b' },
      });

      razorpay.on('payment.failed', () => {
        setStatus('error');
        setErrorMsg('Payment failed. Please try again.');
      });

      razorpay.open();
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.response?.data?.message || err.message || 'Something went wrong.');
    }
  }

  function openManualLink(method: PaymentMethod, url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
    setExpandedMethod(method);
  }

  async function handleManualSubmit(method: PaymentMethod) {
    if (!transactionId.trim()) {
      setErrorMsg('Please enter your transaction / reference ID.');
      return;
    }
    setSubmittingManual(true);
    setErrorMsg('');
    try {
      await api.post('/payments/manual', {
        submissionId,
        method,
        transactionId: transactionId.trim(),
        authorNote,
      });
      setStatus('under-verification');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmittingManual(false);
    }
  }

  function copyUpi() {
    if (!methods?.upiId) return;
    navigator.clipboard.writeText(methods.upiId);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  }

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <CheckCircle2 className="text-teal-600 mx-auto mb-4" size={56} />
        <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>
        <p className="text-ink-700 mb-6">
          Your submission is complete. A confirmation email with your tracking
          ID {state?.trackingId && <strong>{state.trackingId}</strong>} has been sent.
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary bg-navy-900 text-white px-6 py-3 rounded hover:bg-navy-800 text-sm"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (status === 'under-verification') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <Clock className="text-warn-600 mx-auto mb-4" size={56} />
        <h1 className="text-2xl font-bold mb-2">Payment Under Verification</h1>
        <p className="text-ink-700 mb-6">
          We've recorded your payment reference and our team will verify it
          shortly. You'll receive a confirmation email once it's approved.
          Tracking ID: {state?.trackingId && <strong>{state.trackingId}</strong>}
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary bg-navy-900 text-white px-6 py-3 rounded hover:bg-navy-800 text-sm"
        >
          Return Home
        </button>
      </div>
    );
  }

  const manualMethods: { key: PaymentMethod; label: string; icon: typeof Smartphone; url?: string }[] = (
    [
      { key: 'googlepay', label: 'Google Pay', icon: Smartphone, url: methods?.googlePayLink },
      { key: 'phonepe', label: 'PhonePe', icon: Smartphone, url: methods?.phonePeLink },
      { key: 'paytm', label: 'Paytm', icon: Wallet, url: methods?.paytmLink },
      { key: 'stripe', label: 'Stripe', icon: CreditCard, url: methods?.stripeLink },
    ] as { key: PaymentMethod; label: string; icon: typeof Smartphone; url?: string }[]
  ).filter((m) => m.url);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Submit Paper', to: '/submit-paper' }, { label: 'Payment' }]} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-2 mb-8 text-xs font-label uppercase tracking-wide text-ink-500">
          <CheckCircle2 size={16} className="text-teal-600" /> Details & Upload
          <span className="flex-1 h-px bg-stone-300" />
          <span className="text-navy-900 font-semibold">Payment</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Publication Fee Payment</h1>
        {state?.trackingId && (
          <p className="text-sm text-ink-500 mb-8">Tracking ID: {state.trackingId}</p>
        )}

        <div className="bg-white border border-stone-200 rounded-lg shadow-card p-6 mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-ink-700">Publication Fee</span>
            <span className="font-semibold text-navy-900">
              {state?.amount ? `₹${(state.amount / 100).toLocaleString()}` : 'Calculated at checkout'}
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-3">
            Includes peer review, formatting, DOI assignment, and online hosting.
          </p>
        </div>

        <p className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">
          Choose a Payment Method
        </p>

        <div className="space-y-4">
          {/* Razorpay: card / debit card / net banking / wallet — auto-verified */}
          {methods?.razorpayEnabled !== false && (
            <div className="bg-white border border-stone-200 rounded-lg shadow-card p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-100 text-navy-900 flex items-center justify-center shrink-0">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-navy-900 text-sm">Pay Online</div>
                    <div className="text-xs text-ink-500">Credit Card, Debit Card, Net Banking, or Wallet</div>
                  </div>
                </div>
                <button
                  onClick={handleRazorpayPay}
                  disabled={status === 'processing'}
                  className="btn-primary inline-flex items-center gap-2 bg-gold-500 text-navy-950 px-5 py-2.5 rounded hover:bg-gold-400 disabled:opacity-60 text-sm shrink-0"
                >
                  {status === 'processing' ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Opening…
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* UPI */}
          {methods?.upiId && (
            <div className="bg-white border border-stone-200 rounded-lg shadow-card p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-navy-900 text-sm">UPI</div>
                    <div className="text-xs text-ink-500 font-mono">{methods.upiId}</div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={copyUpi}
                    className="btn-primary inline-flex items-center gap-1.5 border border-stone-300 text-ink-700 px-4 py-2.5 rounded hover:bg-stone-50 text-sm"
                  >
                    {upiCopied ? <Check size={15} /> : <Copy size={15} />}
                    {upiCopied ? 'Copied' : 'Copy ID'}
                  </button>
                  <button
                    onClick={() => setExpandedMethod('upi')}
                    className="btn-primary bg-navy-900 text-white px-4 py-2.5 rounded hover:bg-navy-800 text-sm"
                  >
                    I've Paid
                  </button>
                </div>
              </div>
              {expandedMethod === 'upi' && (
                <ManualPaymentForm
                  transactionId={transactionId}
                  setTransactionId={setTransactionId}
                  authorNote={authorNote}
                  setAuthorNote={setAuthorNote}
                  onSubmit={() => handleManualSubmit('upi')}
                  submitting={submittingManual}
                />
              )}
            </div>
          )}

          {/* Google Pay / PhonePe / Paytm / Stripe redirect links */}
          {manualMethods.map((m) => (
            <div key={m.key} className="bg-white border border-stone-200 rounded-lg shadow-card p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-100 text-gold-600 flex items-center justify-center shrink-0">
                    <m.icon size={18} />
                  </div>
                  <div className="font-semibold text-navy-900 text-sm">{m.label}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openManualLink(m.key, m.url!)}
                    className="btn-primary inline-flex items-center gap-1.5 border border-stone-300 text-ink-700 px-4 py-2.5 rounded hover:bg-stone-50 text-sm"
                  >
                    Pay via {m.label} <ExternalLink size={14} />
                  </button>
                  <button
                    onClick={() => setExpandedMethod(m.key)}
                    className="btn-primary bg-navy-900 text-white px-4 py-2.5 rounded hover:bg-navy-800 text-sm"
                  >
                    I've Paid
                  </button>
                </div>
              </div>
              {expandedMethod === m.key && (
                <ManualPaymentForm
                  transactionId={transactionId}
                  setTransactionId={setTransactionId}
                  authorNote={authorNote}
                  setAuthorNote={setAuthorNote}
                  onSubmit={() => handleManualSubmit(m.key)}
                  submitting={submittingManual}
                />
              )}
            </div>
          ))}
        </div>

        {errorMsg && <p className="text-sm text-crimson-600 mt-4">{errorMsg}</p>}

        <p className="flex items-center gap-1.5 text-xs text-ink-500 mt-6 justify-center">
          <ShieldCheck size={14} /> Card, net banking, and wallet payments are auto-verified by Razorpay.
          Other methods are verified by our team within 1–2 business days.
        </p>
      </div>
    </>
  );
}

interface ManualPaymentFormProps {
  transactionId: string;
  setTransactionId: (v: string) => void;
  authorNote: string;
  setAuthorNote: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

function ManualPaymentForm({
  transactionId,
  setTransactionId,
  authorNote,
  setAuthorNote,
  onSubmit,
  submitting,
}: ManualPaymentFormProps) {
  return (
    <div className="pt-3 border-t border-stone-100 space-y-3">
      <div>
        <label className="block text-xs font-medium text-navy-900 mb-1">Transaction / Reference ID *</label>
        <input
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="e.g. UTR / transaction number"
          className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-navy-900 mb-1">Note (optional)</label>
        <input
          value={authorNote}
          onChange={(e) => setAuthorNote(e.target.value)}
          placeholder="Anything our team should know"
          className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={submitting}
        className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-5 py-2.5 rounded hover:bg-navy-800 disabled:opacity-60 text-sm"
      >
        {submitting ? (
          <>
            <Loader2 className="animate-spin" size={16} /> Submitting…
          </>
        ) : (
          'Submit for Verification'
        )}
      </button>
    </div>
  );
}
