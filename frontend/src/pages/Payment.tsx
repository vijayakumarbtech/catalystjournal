import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import { usePaymentMethods } from '@/lib/queries';
import Breadcrumbs from '@/components/common/Breadcrumbs';

// ─── Types ────────────────────────────────────────────────────────────────────
declare global {
  interface Window { Razorpay: any; }
}

type PageStatus = 'idle' | 'processing' | 'success' | 'under-verification' | 'error';

interface ProofForm {
  payerName: string;
  payerEmail: string;
  transactionId: string;
  paymentDate: string;
  authorNote: string;
}

// ─── Razorpay loader ──────────────────────────────────────────────────────────
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ─── UPI Intent URL builder ───────────────────────────────────────────────────
function buildUpiIntent(upiId: string, payeeName: string, amountRs: string, note: string) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName || 'The Catalyst',
    cu: 'INR',
  });
  if (amountRs) params.set('am', amountRs);
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
}

// ─── App-specific deep-link builders ─────────────────────────────────────────
function gpayIntent(base: string) {
  return `intent:${base}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
}
function phonepeIntent(base: string) {
  return `intent:${base}#Intent;scheme=upi;package=com.phonepe.app;end`;
}
function paytmIntent(base: string) {
  return `intent:${base}#Intent;scheme=upi;package=net.one97.paytm;end`;
}

// ─── UPI App Button ───────────────────────────────────────────────────────────
// On mobile: attempts to open the app via intent/deep-link.
// On desktop: immediately shows a friendly fallback message.
function UpiAppButton({
  deepLink, upiBase, logoSrc, label, onDesktopFallback,
}: {
  deepLink: string;
  upiBase: string;
  logoSrc: string;
  label: string;
  onDesktopFallback: () => void;
}) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();

    // Detect likely desktop: no touch support → show fallback immediately.
    const isDesktop = !('ontouchstart' in window) && !navigator.maxTouchPoints;
    if (isDesktop) {
      onDesktopFallback();
      return;
    }

    // Mobile: try deep link, fall back to generic UPI URI after 1.5 s.
    const t = Date.now();
    window.location.href = deepLink;
    setTimeout(() => {
      if (Date.now() - t < 2200) {
        window.location.href = upiBase;
      }
    }, 1500);
  }

  return (
    <a
      href={deepLink}
      onClick={handleClick}
      className="flex flex-col items-center justify-center gap-1.5 bg-white border border-stone-200 rounded-xl px-3 py-2.5 min-w-[72px] shadow-sm hover:border-navy-300 hover:shadow-md transition-all active:scale-95 cursor-pointer select-none"
    >
      <img src={logoSrc} alt={label} className="h-6 w-auto object-contain" />
      <span className="text-[10px] text-ink-500 font-medium">{label}</span>
    </a>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Payment() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { trackingId?: string; amount?: number } | undefined;
  const { data: methods, isLoading: methodsLoading } = usePaymentMethods();

  const [pageStatus, setPageStatus] = useState<PageStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [upiCopied, setUpiCopied] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotError, setScreenshotError] = useState('');
  const [upiAppFallback, setUpiAppFallback] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProofForm>({
    defaultValues: { paymentDate: new Date().toISOString().split('T')[0] },
  });

  useEffect(() => { document.title = 'Payment — The Catalyst'; }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const amountRs = state?.amount ? (state.amount / 100).toString() : '';
  const displayAmount = amountRs ? `₹${Number(amountRs).toLocaleString('en-IN')}` : '—';
  const noteText = state?.trackingId ? `Payment for ${state.trackingId}` : 'Publication Fee';

  const upiId = methods?.upiId || '';
  const payeeName = methods?.payeeName || 'The Catalyst';
  const upiBase = upiId ? buildUpiIntent(upiId, payeeName, amountRs, noteText) : '#';

  // A payment section is shown if either Razorpay OR UPI is configured
  const showRazorpay = !!methods?.razorpayEnabled;
  // Show manual UPI if explicitly enabled OR if a upiId is set (backwards-compat)
  const showManual = !!(methods?.manualPaymentEnabled || (upiId && upiId.trim() !== ''));

  // ── Razorpay handler ────────────────────────────────────────────────────────
  async function handleRazorpayPay() {
    setPageStatus('processing');
    setErrorMsg('');
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Failed to load payment gateway. Check your connection.');
      const { data } = await api.post('/payments/create-order', { submissionId });
      const { orderId, amount, currency, keyId } = data.data;
      const rzp = new window.Razorpay({
        key: keyId, amount, currency,
        name: 'The Catalyst', description: 'Publication Fee', order_id: orderId,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              submissionId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPageStatus('success');
          } catch {
            setPageStatus('error');
            setErrorMsg('Payment succeeded but verification failed. Contact support with your tracking ID.');
          }
        },
        modal: { ondismiss: () => setPageStatus('idle') },
        theme: { color: '#1a2e3a' },
      });
      rzp.on('payment.failed', () => {
        setPageStatus('error');
        setErrorMsg('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err: any) {
      setPageStatus('error');
      setErrorMsg(err?.response?.data?.message || err.message || 'Something went wrong.');
    }
  }

  // ── Screenshot handler ──────────────────────────────────────────────────────
  function handleScreenshot(file: File | null) {
    if (!file) { setScreenshotFile(null); return; }
    const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
    if (!ALLOWED.has(file.type)) { setScreenshotError('Only JPG, PNG, WEBP or PDF allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setScreenshotError('File must be under 5 MB.'); return; }
    setScreenshotError('');
    setScreenshotFile(file);
  }

  // ── Manual payment submit ───────────────────────────────────────────────────
  async function onProofSubmit(values: ProofForm) {
    setErrorMsg('');
    if (!screenshotFile) {
      setScreenshotError('Please upload a screenshot of your payment.');
      return;
    }
    setPageStatus('processing');
    try {
      const fd = new FormData();
      fd.append('submissionId', submissionId!);
      fd.append('method', 'upi');
      fd.append('payerName', values.payerName);
      fd.append('payerEmail', values.payerEmail);
      fd.append('transactionId', values.transactionId);
      fd.append('paymentDate', values.paymentDate);
      if (values.authorNote) fd.append('authorNote', values.authorNote);
      fd.append('paymentProof', screenshotFile);
      await api.post('/payments/manual', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPageStatus('under-verification');
    } catch (err: any) {
      setPageStatus('idle');
      setErrorMsg(err?.response?.data?.message || 'Something went wrong. Please try again.');
    }
  }

  function copyUpi() {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  }

  // ── Status screens ──────────────────────────────────────────────────────────
  if (pageStatus === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <CheckCircle2 className="text-teal-600 mx-auto mb-4" size={56} />
        <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>
        <p className="text-ink-700 mb-6">
          Your submission is complete. Tracking ID:{' '}
          {state?.trackingId && <strong>{state.trackingId}</strong>}
        </p>
        <button onClick={() => navigate('/')} className="bg-navy-900 text-white px-6 py-3 rounded-lg hover:bg-navy-800 text-sm font-medium">Return Home</button>
      </div>
    );
  }

  if (pageStatus === 'under-verification') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center mx-auto mb-5">
          <Clock className="text-amber-500" size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-3">Payment Submitted Successfully</h1>
        <p className="text-ink-700 mb-2">
          Your payment proof has been saved. Our team will verify it within 1–2 business days.
        </p>
        <p className="text-sm text-ink-500 mb-8">
          Tracking ID: {state?.trackingId && <strong>{state.trackingId}</strong>}
        </p>
        <button onClick={() => navigate('/')} className="bg-navy-900 text-white px-6 py-3 rounded-lg hover:bg-navy-800 text-sm font-medium">Return Home</button>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (methodsLoading) {
    return (
      <div className="py-32 text-center text-ink-500">
        <Loader2 className="animate-spin mx-auto mb-3" size={32} />
        <p className="text-sm">Loading payment options…</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Submit Paper', to: '/submit-paper' }, { label: 'Payment' }]} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 text-xs font-medium uppercase tracking-wide text-ink-400">
          <CheckCircle2 size={14} className="text-teal-500" />
          <span>Details & Upload</span>
          <span className="flex-1 h-px bg-stone-300" />
          <span className="text-navy-900 font-bold">Payment</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-1">Publication Fee Payment</h1>
        {state?.trackingId && (
          <p className="text-sm text-ink-400 mb-8">Tracking ID: <span className="font-mono">{state.trackingId}</span></p>
        )}

        {/* ── Amount Card ── */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-xl p-5 mb-6 flex justify-between items-center shadow-lg">
          <div>
            <p className="text-xs text-navy-300 uppercase tracking-widest mb-1">APC Amount to Pay</p>
            <p className="text-3xl font-bold">{displayAmount}</p>
            <p className="text-xs text-navy-400 mt-1">Includes peer review, formatting, DOI & hosting</p>
          </div>
          <CreditCard size={36} className="text-navy-400 shrink-0" />
        </div>

        {/* ── Razorpay ── */}
        {showRazorpay && (
          <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-navy-900">Pay Online — Instant Verification</p>
                <p className="text-xs text-ink-500 mt-0.5">Card, Net Banking, Wallet via Razorpay</p>
              </div>
              <button
                onClick={handleRazorpayPay}
                disabled={pageStatus === 'processing'}
                className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-lg hover:bg-amber-600 disabled:opacity-60 text-sm font-semibold shadow"
              >
                {pageStatus === 'processing'
                  ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                  : 'Pay via Razorpay'}
              </button>
            </div>
          </div>
        )}

        {/* ── UPI Section ── */}
        {showManual && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-stone-50 border-b border-stone-200 px-5 py-3 flex items-center gap-2">
              <Smartphone size={16} className="text-navy-600" />
              <span className="font-semibold text-navy-900 text-sm">Pay via UPI</span>
            </div>

            <div className="p-5">
              {methods?.paymentInstructions && (
                <p className="text-sm text-ink-700 mb-5 leading-relaxed whitespace-pre-wrap">
                  {methods.paymentInstructions}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-5">
                {/* Left: UPI details */}
                <div className="flex-1 space-y-4">
                  {/* Payee + UPI ID */}
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3">
                    {payeeName && (
                      <div>
                        <p className="text-[11px] text-ink-400 uppercase tracking-wide">Payee Name</p>
                        <p className="font-semibold text-navy-900">{payeeName}</p>
                      </div>
                    )}
                    {upiId && (
                      <div>
                        <p className="text-[11px] text-ink-400 uppercase tracking-wide">UPI ID</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-navy-900 font-semibold text-sm">{upiId}</span>
                          <button
                            type="button"
                            onClick={copyUpi}
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded px-2 py-0.5 hover:bg-teal-50 transition-colors"
                          >
                            {upiCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                      {upiId && (
                        <div>
                          <p className="text-[11px] text-ink-400 uppercase tracking-wide mb-2">Open UPI App</p>
                          {upiAppFallback && (
                            <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-xs">
                              <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                              <span>No UPI application detected on this device. Please scan the QR code or copy the UPI ID to pay manually.</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <UpiAppButton
                              deepLink={gpayIntent(upiBase)}
                              upiBase={upiBase}
                              logoSrc="/logos/gpay.svg"
                              label="GPay"
                              onDesktopFallback={() => setUpiAppFallback(true)}
                            />
                            <UpiAppButton
                              deepLink={phonepeIntent(upiBase)}
                              upiBase={upiBase}
                              logoSrc="/logos/phonepe.svg"
                              label="PhonePe"
                              onDesktopFallback={() => setUpiAppFallback(true)}
                            />
                            <UpiAppButton
                              deepLink={paytmIntent(upiBase)}
                              upiBase={upiBase}
                              logoSrc="/logos/paytm.svg"
                              label="Paytm"
                              onDesktopFallback={() => setUpiAppFallback(true)}
                            />
                            <UpiAppButton
                              deepLink={upiBase}
                              upiBase={upiBase}
                              logoSrc="/logos/bhim.svg"
                              label="BHIM"
                              onDesktopFallback={() => setUpiAppFallback(true)}
                            />
                            <UpiAppButton
                              deepLink={upiBase}
                              upiBase={upiBase}
                              logoSrc="/logos/upi.svg"
                              label="Any UPI"
                              onDesktopFallback={() => setUpiAppFallback(true)}
                            />
                          </div>
                        </div>
                      )}
                </div>

                {/* Right: QR Code */}
                {methods?.qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="bg-white border-2 border-stone-200 rounded-xl p-2 shadow">
                      <img
                        src={getImageUrl(methods.qrCodeUrl)}
                        alt="UPI QR Code"
                        className="w-36 h-36 object-contain"
                        onError={(e) => { (e.target as HTMLElement).closest('div')!.style.display = 'none'; }}
                      />
                    </div>
                    <p className="text-xs text-ink-400 mt-2 flex items-center gap-1">
                      <QrCode size={12} /> Scan to Pay
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No payment configured */}
        {!showRazorpay && !showManual && !methodsLoading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mb-6">
            <AlertCircle className="text-amber-500 mx-auto mb-2" size={28} />
            <p className="font-semibold text-amber-800">Payment configuration not set up.</p>
            <p className="text-sm text-amber-700 mt-1">Please ask the administrator to configure payment settings in the Admin Panel.</p>
          </div>
        )}

        {/* ── Payment Proof Form ── */}
        {showManual && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm">
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="font-bold text-navy-900">Submit Payment Proof</h2>
              <p className="text-sm text-ink-500 mt-0.5">Complete this form after making the UPI payment.</p>
            </div>

            <form onSubmit={handleSubmit(onProofSubmit)} className="p-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Payer Name *</label>
                  <input
                    {...register('payerName', { required: 'Required' })}
                    placeholder="Name as per bank account"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                  />
                  {errors.payerName && <p className="text-xs text-red-500 mt-1">{errors.payerName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Email *</label>
                  <input
                    type="email"
                    {...register('payerEmail', { required: 'Required' })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                  />
                  {errors.payerEmail && <p className="text-xs text-red-500 mt-1">{errors.payerEmail.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Submission ID</label>
                  <input
                    value={state?.trackingId || '—'}
                    disabled
                    className="w-full border border-stone-200 bg-stone-50 text-stone-500 rounded-lg px-3 py-2.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Transaction / UTR ID *</label>
                  <input
                    {...register('transactionId', { required: 'Required' })}
                    placeholder="12-digit UTR or transaction number"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                  />
                  {errors.transactionId && <p className="text-xs text-red-500 mt-1">{errors.transactionId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Amount Paid (₹)</label>
                  <input
                    value={amountRs || '—'}
                    disabled
                    className="w-full border border-stone-200 bg-stone-50 text-stone-500 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    {...register('paymentDate', { required: 'Required' })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                  />
                  {errors.paymentDate && <p className="text-xs text-red-500 mt-1">{errors.paymentDate.message}</p>}
                </div>
              </div>

              {/* Screenshot upload */}
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Payment Screenshot *</label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-xl py-7 cursor-pointer hover:border-navy-400 bg-stone-50 transition-colors">
                  {screenshotFile ? (
                    <>
                      <FileCheck2 className="text-teal-600" size={28} />
                      <span className="text-sm text-navy-900 font-medium">{screenshotFile.name}</span>
                      <span className="text-xs text-ink-400">Click to change</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="text-ink-400" size={28} />
                      <span className="text-sm text-ink-500">Click to upload screenshot or receipt</span>
                      <span className="text-xs text-ink-400">JPG, PNG, WEBP or PDF — max 5 MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => handleScreenshot(e.target.files?.[0] || null)}
                  />
                </label>
                {screenshotError && <p className="text-xs text-red-500 mt-1">{screenshotError}</p>}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Remarks (optional)</label>
                <textarea
                  {...register('authorNote')}
                  rows={2}
                  placeholder="Any additional information for our team…"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy-300"
                />
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 rounded-lg p-3 text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={pageStatus === 'processing'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-navy-900 text-white px-8 py-3 rounded-lg hover:bg-navy-800 disabled:opacity-60 font-semibold text-sm shadow"
              >
                {pageStatus === 'processing'
                  ? <><Loader2 className="animate-spin" size={18} /> Submitting…</>
                  : 'Submit Payment Proof'}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
