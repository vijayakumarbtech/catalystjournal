import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Search, Download, Eye, Check, X, Trash2, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import type { Submission, PaginatedResponse, SubmissionStatus } from '@/types';

const statusColors: Record<SubmissionStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  'under-review': 'bg-navy-100 text-navy-900',
  accepted: 'bg-teal-100 text-teal-700',
  rejected: 'bg-crimson-100 text-crimson-600',
  'revision-requested': 'bg-warn-100 text-warn-600',
};

const paymentStatusColors: Record<string, string> = {
  paid: 'bg-teal-100 text-teal-700',
  pending: 'bg-stone-200 text-ink-500',
  failed: 'bg-crimson-100 text-crimson-600',
  'under-verification': 'bg-warn-100 text-warn-600',
};

export default function AdminSubmissions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Submission | null>(null);
  const [revisionTarget, setRevisionTarget] = useState<Submission | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'submissions', { search, statusFilter, page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Submission>>('/admin/submissions', {
        params: { search, status: statusFilter, page },
      });
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: SubmissionStatus; note?: string }) =>
      api.patch(`/admin/submissions/${id}`, { status, revisionNote: note }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] }),
  });

  const deleteSubmission = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/submissions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] }),
  });

  function handleDelete(id: string) {
    if (confirm('Delete this submission permanently? This cannot be undone.')) {
      deleteSubmission.mutate(id);
    }
  }

  function submitRevision() {
    if (!revisionTarget) return;
    updateStatus.mutate({ id: revisionTarget._id, status: 'revision-requested', note: revisionNote });
    setRevisionTarget(null);
    setRevisionNote('');
  }

  async function handleExport() {
    const res = await api.get('/admin/submissions/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'submissions.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Submissions</h1>
          <p className="text-sm text-ink-500">Manage incoming paper submissions.</p>
        </div>
        <button
          onClick={handleExport}
          className="btn-primary inline-flex items-center gap-2 border border-stone-300 text-ink-700 px-4 py-2 rounded hover:bg-stone-50 text-sm"
        >
          <FileSpreadsheet size={16} /> Export Excel
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            placeholder="Search by author, title, or tracking ID..."
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
          <option value="under-review">Under Review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="revision-requested">Revision Requested</option>
        </select>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Tracking ID</th>
              <th className="text-left px-4 py-3">Author</th>
              <th className="text-left px-4 py-3">Paper Title</th>
              <th className="text-left px-4 py-3">Payment</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && (
              <tr><td colSpan={7} className="text-center py-10 text-ink-500">Loading…</td></tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-ink-500">No submissions found.</td></tr>
            )}
            {data?.data.map((s) => (
              <tr key={s._id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3 font-mono text-xs">{s.trackingId}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-navy-900">{s.authorName}</div>
                  <div className="text-xs text-ink-500">{s.email}</div>
                </td>
                <td className="px-4 py-3 max-w-xs truncate">{s.paperTitle}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${paymentStatusColors[s.paymentStatus] || 'bg-stone-200 text-ink-500'}`}>
                    {s.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={s.status}
                    onChange={(e) => {
                      const next = e.target.value as SubmissionStatus;
                      if (next === 'revision-requested') {
                        setRevisionTarget(s);
                      } else {
                        updateStatus.mutate({ id: s._id, status: next });
                      }
                    }}
                    className={`text-xs px-2 py-1 rounded-full border-0 ${statusColors[s.status]}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="under-review">Under Review</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="revision-requested">Revision Requested</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-ink-500">
                  {new Date(s.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-ink-500">
                    <button onClick={() => setViewing(s)} aria-label="View details" className="hover:text-navy-900">
                      <Eye size={16} />
                    </button>
                    <a href={s.manuscriptUrl} download aria-label="Download manuscript" className="hover:text-navy-900">
                      <Download size={16} />
                    </a>
                    <button
                      onClick={() => updateStatus.mutate({ id: s._id, status: 'accepted' })}
                      aria-label="Accept"
                      className="hover:text-teal-700"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setRevisionTarget(s)}
                      aria-label="Send back for revision"
                      className="hover:text-warn-600"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: s._id, status: 'rejected' })}
                      aria-label="Reject"
                      className="hover:text-crimson-600"
                    >
                      <X size={16} />
                    </button>
                    <button onClick={() => handleDelete(s._id)} aria-label="Delete" className="hover:text-crimson-600">
                      <Trash2 size={16} />
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

      {/* View details modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">Submission Details</h2>
              <button onClick={() => setViewing(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-ink-500 block text-xs">Tracking ID</span>{viewing.trackingId}</div>
                <div><span className="text-ink-500 block text-xs">Subject Area</span>{viewing.subject}</div>
                <div><span className="text-ink-500 block text-xs">Author</span>{viewing.authorName}</div>
                <div><span className="text-ink-500 block text-xs">Co-Author(s)</span>{viewing.coAuthors || '—'}</div>
                <div><span className="text-ink-500 block text-xs">Email</span>{viewing.email}</div>
                <div><span className="text-ink-500 block text-xs">Mobile</span>{viewing.phone}</div>
                <div><span className="text-ink-500 block text-xs">Institution</span>{viewing.institution}</div>
                <div><span className="text-ink-500 block text-xs">Country</span>{viewing.country}</div>
                <div><span className="text-ink-500 block text-xs">ORCID iD</span>{viewing.orcid || '—'}</div>
                <div><span className="text-ink-500 block text-xs">Department</span>{viewing.department || '—'}</div>
              </div>
              <div><span className="text-ink-500 block text-xs">Paper Title</span>{viewing.paperTitle}</div>
              <div><span className="text-ink-500 block text-xs">Abstract</span>{viewing.abstract}</div>
              <div><span className="text-ink-500 block text-xs">Keywords</span>{viewing.keywords}</div>
              {viewing.message && (
                <div><span className="text-ink-500 block text-xs">Additional Comments</span>{viewing.message}</div>
              )}
              {viewing.revisionNote && (
                <div><span className="text-ink-500 block text-xs">Revision Note</span>{viewing.revisionNote}</div>
              )}
              <div className="flex gap-3 pt-2">
                <a
                  href={viewing.manuscriptUrl}
                  download
                  className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded hover:bg-navy-800 text-sm"
                >
                  <Download size={15} /> Download Manuscript
                </a>
                {viewing.copyrightFormUrl && (
                  <a
                    href={viewing.copyrightFormUrl}
                    download
                    className="btn-primary inline-flex items-center gap-2 border border-stone-300 text-ink-700 px-4 py-2 rounded hover:bg-stone-50 text-sm"
                  >
                    <Download size={15} /> Copyright Form
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send back for revision modal */}
      {revisionTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">Send Back for Revision</h2>
              <button onClick={() => setRevisionTarget(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-ink-700">
                Requesting revisions for <strong>{revisionTarget.paperTitle}</strong>. This note will be emailed to the author.
              </p>
              <textarea
                rows={4}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="What needs to change?"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-none"
              />
              <button
                onClick={submitRevision}
                className="btn-primary w-full bg-navy-900 text-white px-4 py-2.5 rounded hover:bg-navy-800 text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
