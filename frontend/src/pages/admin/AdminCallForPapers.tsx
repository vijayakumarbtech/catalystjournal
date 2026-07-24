import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, CheckCircle, XCircle, UploadCloud, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { CallForPaper, ApiResponse } from '@/types';

type FormValues = Omit<CallForPaper, '_id' | 'createdAt' | 'topics'> & {
  topics: { value: string }[];
};

export default function AdminCallForPapers() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CallForPaper | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingField, setUploadingField] = useState<'pdfUrl' | 'posterUrl' | 'brochureUrl' | null>(null);

  const { data: cfps, isLoading } = useQuery({
    queryKey: ['admin', 'cfps'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CallForPaper[]>>('/admin/cfps');
      return data.data;
    },
  });

  const { register, control, handleSubmit, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      topics: [{ value: '' }],
      isActive: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'topics',
  });


  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        ...data,
        topics: data.topics.map(t => t.value).filter(Boolean),
      };
      if (editing) {
        return api.put(`/admin/cfps/${editing._id}`, payload);
      }
      return api.post('/admin/cfps', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cfps'] });
      queryClient.invalidateQueries({ queryKey: ['cfps', 'active'] });
      setShowForm(false);
      setEditing(null);
      reset();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to save Call for Papers.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/cfps/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cfps'] });
      queryClient.invalidateQueries({ queryKey: ['cfps', 'active'] });
    },
    onError: (err: any) => alert(err?.response?.data?.message || 'Failed to delete.'),
  });

  function openNew() {
    setEditing(null);
    reset({
      title: '',
      subtitle: '',
      description: '',
      scope: '',
      topics: [{ value: '' }],
      submissionDeadline: '',
      acceptanceDate: '',
      publicationDate: '',
      instructions: '',
      posterUrl: '',
      pdfUrl: '',
      brochureUrl: '',
      isActive: false,
    });
    setShowForm(true);
  }

  function openEdit(cfp: CallForPaper) {
    setEditing(cfp);
    reset({
      ...cfp,
      topics: cfp.topics && cfp.topics.length > 0 ? cfp.topics.map(t => ({ value: t })) : [{ value: '' }],
    });
    setShowForm(true);
  }

  async function handleFileUpload(file: File | null, endpoint: string, fieldName: 'pdfUrl' | 'posterUrl' | 'brochureUrl') {
    if (!file) return;
    setUploadingField(fieldName);
    const formData = new FormData();
    const fileKey = endpoint === 'upload-poster' ? 'poster' : endpoint === 'upload-pdf' ? 'cfpPdf' : 'brochure';
    formData.append(fileKey, file);
    try {
      const { data } = await api.post<ApiResponse<{ url: string }>>(`/admin/cfps/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValue(fieldName, data.data.url, { shouldDirty: true });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingField(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Call for Papers</h1>
          <p className="text-sm text-ink-500">Manage the active Call for Papers for the public website.</p>
        </div>
        <button
          onClick={openNew}
          className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded hover:bg-navy-800 text-sm"
        >
          <Plus size={16} /> New Call for Papers
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Deadline</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && <tr><td colSpan={4} className="text-center py-10 text-ink-500">Loading…</td></tr>}
            {!isLoading && (!cfps || cfps.length === 0) && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-ink-500">
                  No Call for Papers found.
                </td>
              </tr>
            )}
            {cfps?.map((cfp) => (
              <tr key={cfp._id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3 font-medium text-navy-900">{cfp.title}</td>
                <td className="px-4 py-3 text-stone-600">{cfp.submissionDeadline || '-'}</td>
                <td className="px-4 py-3">
                  {cfp.isActive ? (
                    <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-100 px-2 py-1 rounded-full text-xs">
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-stone-500 bg-stone-100 px-2 py-1 rounded-full text-xs">
                      <XCircle size={14} /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-ink-500">
                    <button onClick={() => openEdit(cfp)} aria-label="Edit" className="hover:text-navy-900">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => confirm('Are you sure you want to delete this Call for Papers?') && deleteMutation.mutate(cfp._id)}
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
          <div className="bg-white rounded-lg w-full max-w-[800px] flex flex-col max-h-[90vh] shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 shrink-0">
              <h2 className="font-semibold text-navy-900">{editing ? 'Edit Call for Papers' : 'New Call for Papers'}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close" className="text-stone-400 hover:text-stone-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form id="cfp-form" onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-5">
                
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Title</label>
                    <input {...register('title', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Subtitle (optional)</label>
                    <input {...register('subtitle')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Submission Deadline</label>
                    <input {...register('submissionDeadline')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" placeholder="e.g. August 31, 2026" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Acceptance Date</label>
                    <input {...register('acceptanceDate')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Publication Date</label>
                    <input {...register('publicationDate')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                  </div>
                  <div className="pb-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-navy-900">
                      <input type="checkbox" {...register('isActive')} className="w-4 h-4 rounded text-navy-900 focus:ring-navy-900" />
                      Set as Active (will deactivate others)
                    </label>
                  </div>
                </div>

                {/* Row 4 */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Description</label>
                  <textarea rows={3} {...register('description')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-y" />
                </div>

                {/* Row 5 */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Scope</label>
                  <textarea rows={3} {...register('scope')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-y" />
                </div>

                {/* Row 6 */}
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-navy-900">Topics of Interest</label>
                    <button type="button" onClick={() => append({ value: '' })} className="text-xs font-medium text-navy-600 hover:text-navy-800">
                      + Add Topic
                    </button>
                  </div>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <input {...register(`topics.${index}.value`)} className="flex-1 border border-stone-300 rounded px-3 py-1.5 text-sm" placeholder="Enter topic..." />
                        <button type="button" onClick={() => remove(index)} className="text-stone-400 hover:text-crimson-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {fields.length === 0 && <p className="text-xs text-stone-500 italic">No topics added.</p>}
                  </div>
                </div>

                {/* Row 7: Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* PDF Upload */}
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">CFP PDF</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer border border-dashed border-stone-300 rounded-lg px-3 py-2.5 hover:border-navy-600 transition-colors justify-center bg-stone-50">
                        {uploadingField === 'pdfUrl'
                          ? <Loader2 size={16} className="text-ink-500 animate-spin" />
                          : <UploadCloud size={16} className="text-ink-500" />}
                        <span className="text-xs text-ink-700">
                          {uploadingField === 'pdfUrl' ? 'Uploading…' : 'Upload PDF'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'upload-pdf', 'pdfUrl')}
                          disabled={uploadingField !== null}
                        />
                      </label>
                      <input {...register('pdfUrl')} readOnly placeholder="No file uploaded" className="w-full border border-stone-200 rounded px-3 py-2 text-xs bg-stone-50 text-stone-500" />
                    </div>
                  </div>

                  {/* Poster Upload */}
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">Poster (PDF/Image)</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer border border-dashed border-stone-300 rounded-lg px-3 py-2.5 hover:border-navy-600 transition-colors justify-center bg-stone-50">
                        {uploadingField === 'posterUrl'
                          ? <Loader2 size={16} className="text-ink-500 animate-spin" />
                          : <UploadCloud size={16} className="text-ink-500" />}
                        <span className="text-xs text-ink-700">
                          {uploadingField === 'posterUrl' ? 'Uploading…' : 'Upload Poster'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'upload-poster', 'posterUrl')}
                          disabled={uploadingField !== null}
                        />
                      </label>
                      <input {...register('posterUrl')} readOnly placeholder="No file uploaded" className="w-full border border-stone-200 rounded px-3 py-2 text-xs bg-stone-50 text-stone-500" />
                    </div>
                  </div>

                  {/* Brochure Upload */}
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">Brochure (PDF)</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer border border-dashed border-stone-300 rounded-lg px-3 py-2.5 hover:border-navy-600 transition-colors justify-center bg-stone-50">
                        {uploadingField === 'brochureUrl'
                          ? <Loader2 size={16} className="text-ink-500 animate-spin" />
                          : <UploadCloud size={16} className="text-ink-500" />}
                        <span className="text-xs text-ink-700">
                          {uploadingField === 'brochureUrl' ? 'Uploading…' : 'Upload Brochure'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files?.[0] || null, 'upload-brochure', 'brochureUrl')}
                          disabled={uploadingField !== null}
                        />
                      </label>
                      <input {...register('brochureUrl')} readOnly placeholder="No file uploaded" className="w-full border border-stone-200 rounded px-3 py-2 text-xs bg-stone-50 text-stone-500" />
                    </div>
                  </div>
                </div>

                {/* Row 8 */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Instructions / Notes</label>
                  <textarea rows={2} {...register('instructions')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-y" />
                </div>
              </form>
            </div>

            {/* Bottom Footer */}
            <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 shrink-0 flex justify-end gap-3 rounded-b-lg">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-stone-300 text-ink-700 rounded hover:bg-stone-100 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="cfp-form"
                disabled={saveMutation.isPending || uploadingField !== null}
                className="btn-primary bg-navy-900 text-white px-5 py-2 rounded hover:bg-navy-800 disabled:opacity-60 text-sm font-medium shadow-sm transition-colors"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Call for Papers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
