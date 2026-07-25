import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Search, Check, X, Clock, Eye, AlertCircle, FileImage, DownloadCloud, RefreshCw } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import type { Payment, PaginatedResponse, PaymentStatus, Submission } from '@/types';

const statusColors: Record<PaymentStatus, string> = {
  paid: 'bg-teal-100 text-teal-700',
  pending: 'bg-stone-200 text-ink-500',
  failed: 'bg-crimson-100 text-crimson-600',
  'under-verification': 'bg-warn-100 text-warn-600',
};

const methodLabels: Record<string, string> = {
  razorpay: 'Razorpay',
  upi: 'UPI',
  googlepay: 'Google Pay',
  phonepe: 'PhonePe',
  paytm: 'Paytm',
  stripe: 'Stripe',
  'bank-transfer': 'Bank Transfer',
};

export default function AdminPayments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Payment | null>(null);
  const [rejecting, setRejecting] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments', { search, statusFilter, page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Payment>>('/admin/payments', {
        params: { search, status: statusFilter, page },
      });
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: PaymentStatus, rejectionReason?: string }) =>
      api.patch(`/admin/payments/${id}`, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
      setRejecting(null);
      setRejectionReason('');
    },
  });

  function handleRejectSubmit() {
    if (!rejecting || !rejectionReason.trim()) return;
    updateStatus.mutate({ id: rejecting._id, status: 'failed', rejectionReason });
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 mb-1">Payments & Verifications</h1>
        <p className="text-sm text-ink-500">
          Review and verify manual UPI payments and online transactions.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            placeholder="Search by tracking ID, email, or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-stone-300 rounded pl-9 pr-4 py-2.5 text-sm bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-stone-300 rounded px-4 py-2.5 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under-verification">Under Verification</option>
          <option value="paid">Paid (Verified)</option>
          <option value="failed">Failed / Rejected</option>
        </select>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Tracking ID</th>
              <th className="text-left px-4 py-3">Author / Email</th>
              <th className="text-left px-4 py-3">Method</th>
              <th className="text-left px-4 py-3">Transaction / UTR</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Date Submitted</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && (
              <tr><td colSpan={8} className="text-center py-10 text-ink-500">Loading…</td></tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-ink-500">No payments found.</td></tr>
            )}
            {data?.data.map((p) => {
              const sub = typeof p.submission === 'object' ? (p.submission as Submission) : null;
              const authorName = p.payerName || sub?.authorName || '—';
              const authorEmail = p.payerEmail || sub?.email || '—';
              
              return (
                <tr key={p._id} className="hover:bg-paper-dim/50">
                  <td className="px-4 py-3 font-mono text-xs">{p.trackingId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy-900">{authorName}</div>
                    <div className="text-xs text-ink-500">{authorEmail}</div>
                  </td>
                  <td className="px-4 py-3">{methodLabels[p.method] || p.method}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.transactionId || '—'}</td>
                  <td className="px-4 py-3 font-medium">₹{(p.amount / 100).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] uppercase tracking-wide font-semibold px-2 py-1 rounded-full ${statusColors[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-ink-500">
                      <button onClick={() => setViewing(p)} aria-label="View details" className="hover:text-navy-900">
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: p._id, status: 'paid' })}
                        aria-label="Approve"
                        className="hover:text-teal-700"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: p._id, status: 'pending' })}
                        aria-label="Mark pending"
                        className="hover:text-warn-600"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        onClick={() => setRejecting(p)}
                        aria-label="Reject"
                        className="hover:text-crimson-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-navy-900 text-white' : 'bg-white border border-stone-300'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Viewing Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">Payment Verification Details</h2>
              <button onClick={() => setViewing(null)} aria-label="Close" className="text-ink-500 hover:text-navy-900">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 grid md:grid-cols-2 gap-8">
              <div className="space-y-4 text-sm">
                <div><span className="text-ink-500 block text-xs">Tracking ID</span><span className="font-mono">{viewing.trackingId}</span></div>
                <div><span className="text-ink-500 block text-xs">Method</span>{methodLabels[viewing.method] || viewing.method}</div>
                <div><span className="text-ink-500 block text-xs">Transaction / UTR ID</span><span className="font-mono">{viewing.transactionId || '—'}</span></div>
                <div><span className="text-ink-500 block text-xs">Amount</span>₹{(viewing.amount / 100).toLocaleString()} {viewing.currency}</div>
                <div><span className="text-ink-500 block text-xs">Date</span>{new Date(viewing.paymentDate || viewing.createdAt).toLocaleString()}</div>
                <div>
                  <span className="text-ink-500 block text-xs">Status</span>
                  <span className={`inline-block mt-1 text-[11px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${statusColors[viewing.status]}`}>
                    {viewing.status}
                  </span>
                </div>
                
                {viewing.payerName && <div><span className="text-ink-500 block text-xs">Payer Name</span>{viewing.payerName}</div>}
                {viewing.payerEmail && <div><span className="text-ink-500 block text-xs">Payer Email</span>{viewing.payerEmail}</div>}
                {viewing.authorNote && (
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <span className="text-ink-500 block text-xs mb-1">Author Note</span>
                    {viewing.authorNote}
                  </div>
                )}
                {viewing.rejectionReason && (
                  <div className="bg-crimson-50 p-3 rounded-lg border border-crimson-100 text-crimson-700">
                    <span className="block text-xs font-semibold mb-1 uppercase tracking-wide text-crimson-600">Rejection Reason</span>
                    {viewing.rejectionReason}
                  </div>
                )}
                
                {typeof viewing.submission === 'object' && (
                  <div className="pt-4 border-t border-stone-100">
                    <span className="text-ink-500 block text-xs mb-1">Submission Details</span>
                    <div className="font-medium text-navy-900">{(viewing.submission as Submission).paperTitle}</div>
                    <div className="text-xs text-ink-500 mt-1">Author: {(viewing.submission as Submission).authorName} · {(viewing.submission as Submission).email}</div>
                  </div>
                )}
              </div>
              
              <div className="border-l border-stone-100 pl-8 flex flex-col">
                <span className="text-ink-500 block text-xs mb-2 font-medium">Payment Screenshot</span>
                {viewing.screenshotUrl ? (
                  <div className="relative group flex-1 bg-stone-100 rounded-lg border border-stone-200 overflow-hidden min-h-[300px]">
                    {viewing.screenshotUrl.endsWith('.pdf') ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-500">
                        <FileImage size={48} className="mb-3 opacity-50" />
                        <span className="text-sm font-medium">PDF Document</span>
                        <a href={getImageUrl(viewing.screenshotUrl)} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline">
                          <DownloadCloud size={16} /> View PDF
                        </a>
                      </div>
                    ) : (
                      <a href={getImageUrl(viewing.screenshotUrl)} target="_blank" rel="noreferrer" className="block w-full h-full">
                        <img 
                          src={getImageUrl(viewing.screenshotUrl)} 
                          alt="Payment Screenshot" 
                          className="w-full h-full object-contain"
                        />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-center text-ink-400 text-sm italic min-h-[200px]">
                    No screenshot uploaded
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-stone-200 flex justify-end gap-3 bg-stone-50 rounded-b-lg">
               <button onClick={() => setViewing(null)} className="btn-primary border border-stone-300 bg-white text-ink-700 px-4 py-2 rounded hover:bg-stone-50 text-sm">
                 Close
               </button>
               {viewing.status === 'under-verification' && (
                 <>
                   <button
                     onClick={() => { updateStatus.mutate({ id: viewing._id, status: 'pending' }); setViewing(null); }}
                     className="btn-primary inline-flex items-center gap-1.5 border border-stone-400 text-ink-700 px-4 py-2 rounded hover:bg-stone-100 text-sm"
                   >
                     <RefreshCw size={14} /> Request Re-upload
                   </button>
                   <button 
                     onClick={() => { setRejecting(viewing); setViewing(null); }}
                     className="btn-primary border border-crimson-600 text-crimson-600 px-4 py-2 rounded hover:bg-crimson-50 text-sm"
                   >
                     Reject
                   </button>
                   <button 
                     onClick={() => { updateStatus.mutate({ id: viewing._id, status: 'paid' }); setViewing(null); }}
                     className="btn-primary bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 text-sm"
                   >
                     Approve Payment
                   </button>
                 </>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Rejecting Modal */}
      {rejecting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="p-5 border-b border-stone-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-crimson-100 text-crimson-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-navy-900">Reject Payment</h3>
                <p className="text-xs text-ink-500">{rejecting.trackingId}</p>
              </div>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-navy-900 mb-2">Rejection Reason</label>
              <textarea 
                rows={3} 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Invalid UTR, insufficient amount, screenshot unclear..."
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-none"
                autoFocus
              />
              <p className="text-xs text-ink-500 mt-2">This reason will be visible to the author.</p>
            </div>
            <div className="p-5 pt-0 flex justify-end gap-3">
              <button onClick={() => setRejecting(null)} className="px-4 py-2 text-sm text-ink-600 hover:bg-stone-50 rounded">
                Cancel
              </button>
              <button 
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || updateStatus.isPending}
                className="btn-primary bg-crimson-600 text-white px-4 py-2 rounded hover:bg-crimson-700 disabled:opacity-60 text-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
