import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CheckCircle, XCircle, UploadCloud, Loader2, FileText, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/types';

// We can define this type inline since it's only used here
type GuidelineDocument = {
  _id: string;
  documentName: string;
  fileType: string;
  fileUrl: string;
  extractedHtml: string;
  isActive: boolean;
  uploadedAt: string;
};

export default function AdminSubmissionGuidelines() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['admin', 'guideline-documents'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GuidelineDocument[]>>('/admin/guideline-documents');
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/guideline-documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guideline-documents'] });
      queryClient.invalidateQueries({ queryKey: ['guideline-documents', 'active'] });
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to delete.'),
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/guideline-documents/${id}/set-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guideline-documents'] });
      queryClient.invalidateQueries({ queryKey: ['guideline-documents', 'active'] });
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to set active.'),
  });

  async function handleFileUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('guidelineDocument', file);
    
    try {
      await api.post('/admin/guideline-documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'guideline-documents'] });
      queryClient.invalidateQueries({ queryKey: ['guideline-documents', 'active'] });
      setShowForm(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Submission Guidelines</h1>
          <p className="text-sm text-ink-500">Upload a DOCX or PDF document. It will be converted into a webpage.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded hover:bg-navy-800 text-sm"
        >
          <Plus size={16} /> Upload Document
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Document Name</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Upload Date</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && <tr><td colSpan={5} className="text-center py-10 text-ink-500">Loading…</td></tr>}
            {!isLoading && (!documents || documents.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-ink-500">
                  No documents found.
                </td>
              </tr>
            )}
            {documents?.map((doc) => (
              <tr key={doc._id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3 font-medium text-navy-900">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-stone-400" />
                    {doc.documentName}
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-600">{doc.fileType}</td>
                <td className="px-4 py-3 text-stone-600">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {doc.isActive ? (
                    <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-100 px-2 py-1 rounded-full text-xs">
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveMutation.mutate(doc._id)}
                      className="inline-flex items-center gap-1 text-stone-500 bg-stone-100 px-2 py-1 rounded-full text-xs hover:bg-stone-200 transition-colors"
                    >
                      <XCircle size={14} /> Set Active
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-ink-500">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-navy-900"
                      title="Download"
                    >
                      <UploadCloud size={16} className="rotate-180" />
                    </a>
                    <button
                      onClick={() => confirm('Are you sure you want to delete this document?') && deleteMutation.mutate(doc._id)}
                      aria-label="Delete"
                      className="hover:text-crimson-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">Upload Guidelines Document</h2>
              <button onClick={() => !uploading && setShowForm(false)} aria-label="Close" className="text-stone-400 hover:text-stone-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-ink-600 mb-4">
                Supported formats: DOCX, DOC, PDF.<br/>
                For the best web formatting, upload a <strong>DOCX</strong> file.
              </p>
              
              <label className="flex flex-col items-center gap-3 cursor-pointer border-2 border-dashed border-stone-300 rounded-lg p-10 hover:border-navy-600 hover:bg-stone-50 transition-colors text-center">
                {uploading ? (
                  <>
                    <Loader2 size={32} className="text-navy-600 animate-spin" />
                    <span className="text-sm font-medium text-navy-900">Uploading and processing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={32} className="text-stone-400" />
                    <span className="text-sm font-medium text-navy-900">Click to select a document</span>
                    <span className="text-xs text-stone-500">Max size: 15MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
