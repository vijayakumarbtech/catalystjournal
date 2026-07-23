import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Search, Check, X, Clock, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import type { Payment, PaginatedResponse, PaymentStatus, Submission } from '@/types';

const statusColors: Record<PaymentStatus, string> = {
  paid: 'bg-teal-100 text-teal-700',
  pending: 'bg-stone-200 text-ink-500',
  failed: 'bg-crimson-100 text-crimson-600',
  'under-verification': 'bg-warn-100 text-warn-600',
};

const methodLabels: Record<string, string> = {
  razorpay: 'Card / Net Banking / Wallet',
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
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      api.patch(`/admin/payments/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 mb-1">Payments</h1>
        <p className="text-sm text-ink-500">
          Review and verify publication fee payments across all methods.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            placeholder="Search by tracking ID or transaction ID..."
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
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Tracking ID</th>
              <th className="text-left px-4 py-3">Method</th>
              <th className="text-left px-4 py-3">Transaction ID</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && (
              <tr><td colSpan={7} className="text-center py-10 text-ink-500">Loading…</td></tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-ink-500">No payments found.</td></tr>
            )}
            {data?.data.map((p) => (
              <tr key={p._id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3 font-mono text-xs">{p.trackingId}</td>
                <td className="px-4 py-3">{methodLabels[p.method] || p.method}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.transactionId || '—'}</td>
                <td className="px-4 py-3">₹{(p.amount / 100).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-ink-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[p.status]}`}>{p.status}</span>
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
                      onClick={() => updateStatus.mutate({ id: p._id, status: 'failed' })}
                      aria-label="Reject"
                      className="hover:text-crimson-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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

      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">Payment Details</h2>
              <button onClick={() => setViewing(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div><span className="text-ink-500 block text-xs">Tracking ID</span>{viewing.trackingId}</div>
              <div><span className="text-ink-500 block text-xs">Method</span>{methodLabels[viewing.method] || viewing.method}</div>
              <div><span className="text-ink-500 block text-xs">Transaction ID</span>{viewing.transactionId || '—'}</div>
              <div><span className="text-ink-500 block text-xs">Amount</span>₹{(viewing.amount / 100).toLocaleString()} {viewing.currency}</div>
              <div><span className="text-ink-500 block text-xs">Status</span>{viewing.status}</div>
              {viewing.authorNote && (
                <div><span className="text-ink-500 block text-xs">Author Note</span>{viewing.authorNote}</div>
              )}
              {typeof viewing.submission === 'object' && (
                <div className="pt-3 border-t border-stone-100">
                  <span className="text-ink-500 block text-xs mb-1">Submission</span>
                  <div className="font-medium text-navy-900">{(viewing.submission as Submission).paperTitle}</div>
                  <div className="text-xs text-ink-500">{(viewing.submission as Submission).authorName} · {(viewing.submission as Submission).email}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
