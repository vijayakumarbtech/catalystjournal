import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Star, UploadCloud, Loader2 } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import type { Issue, PaginatedResponse } from '@/types';

type FormValues = {
  volume: number;
  issue: number;
  year: number;
  title?: string;
  description?: string;
  coverImageUrl?: string;
  isCurrent?: boolean;
};

const IMG_HINT = 'Supported formats: PNG, JPG, JPEG, WEBP. Maximum size: 5 MB.';

export default function AdminIssues() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Issue | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverMsg, setCoverMsg] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'issues'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Issue>>('/admin/issues');
      return data;
    },
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>();
  const watchedCoverUrl = watch('coverImageUrl');

  // Uploads a cover file to an issue that already has an ID.
  async function uploadCoverToIssue(issueId: string, file: File) {
    const formData = new FormData();
    formData.append('cover', file);
    const { data } = await api.post(`/admin/issues/${issueId}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.url as string;
  }

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editing) {
        return api.put(`/admin/issues/${editing._id}`, values);
      }
      // Create the issue first, then upload the pending cover file (if any)
      // to the newly-created issue's ID, since the upload endpoint needs an ID.
      const res = await api.post('/admin/issues', values);
      const newIssue = res.data.data;
      if (pendingCoverFile) {
        try {
          await uploadCoverToIssue(newIssue._id, pendingCoverFile);
        } catch {
          // Issue was created successfully even if the cover upload fails;
          // the admin can retry the cover upload via Edit.
        }
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setShowForm(false);
      setEditing(null);
      setCoverPreview('');
      setCoverMsg('');
      setPendingCoverFile(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/issues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'current'] });
    },
  });

  const setCurrentMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/issues/${id}/set-current`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'current'] });
    },
  });

  function openNew() {
    setEditing(null);
    setCoverPreview('');
    setCoverMsg('');
    setPendingCoverFile(null);
    reset({});
    setShowForm(true);
  }

  function openEdit(issue: Issue) {
    setEditing(issue);
    setCoverPreview(issue.coverImageUrl || '');
    setCoverMsg('');
    setPendingCoverFile(null);
    reset({
      volume: issue.volume,
      issue: issue.issue,
      year: issue.year,
      title: issue.title,
      description: issue.description,
      coverImageUrl: issue.coverImageUrl,
      isCurrent: issue.isCurrent,
    });
    setShowForm(true);
  }

  // Upload cover image immediately when an issue exists; for new issues,
  // the cover URL is set in the form and saved with the issue on submit.
  async function handleCoverUpload(file: File | null) {
    if (!file) return;
    const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!ALLOWED.has(file.type)) {
      setCoverMsg(`Error: ${IMG_HINT}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverMsg('Error: File must be under 5 MB.');
      return;
    }

    // Show local preview immediately for UX
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);
    setCoverMsg('');

    if (editing) {
      // If editing an existing issue, upload and persist right away.
      setCoverUploading(true);
      try {
        const url = await uploadCoverToIssue(editing._id, file);
        setValue('coverImageUrl', url);
        setCoverPreview(url);
        queryClient.invalidateQueries({ queryKey: ['admin', 'issues'] });
        setCoverMsg('✓ Cover image uploaded and saved.');
      } catch (err: any) {
        setCoverMsg(`Error: ${err?.response?.data?.message || 'Upload failed.'}`);
        setCoverPreview(editing.coverImageUrl || '');
      } finally {
        setCoverUploading(false);
      }
    } else {
      // New issue doesn't have an ID yet — hold the file and upload it
      // right after the issue is created (see saveMutation above).
      setPendingCoverFile(file);
      setCoverMsg('✓ Image selected. It will be uploaded when you save the issue.');
    }
  }

  const displayCover = coverPreview || watchedCoverUrl || '';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Issues & Volumes</h1>
          <p className="text-sm text-ink-500">
            Create issues and volumes. Setting an issue as Current automatically moves the previous one to Archives.
          </p>
        </div>
        <button
          onClick={openNew}
          className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-lg hover:bg-navy-800 text-sm shadow-sm"
        >
          <Plus size={16} /> New Issue
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Cover</th>
              <th className="text-left px-4 py-3">Volume / Issue</th>
              <th className="text-left px-4 py-3">Year</th>
              <th className="text-left px-4 py-3">Articles</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-10 text-ink-500">Loading…</td></tr>
            )}
            {data?.data.map((issue) => (
              <tr key={issue._id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3">
                  {issue.coverImageUrl ? (
                    <img
                      src={getImageUrl(issue.coverImageUrl)}
                      alt={`Cover Vol. ${issue.volume}`}
                      className="w-10 h-14 object-cover rounded border border-stone-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-14 rounded border border-stone-200 bg-stone-100 flex items-center justify-center">
                      <span className="text-[9px] text-ink-500 text-center">No cover</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-navy-900">
                  Vol. {issue.volume}, Issue {issue.issue}
                </td>
                <td className="px-4 py-3">{issue.year}</td>
                <td className="px-4 py-3">{issue.articles?.length || 0}</td>
                <td className="px-4 py-3">
                  {issue.isCurrent ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-award-100 text-award-600 px-2 py-0.5 rounded-full">
                      <Star size={11} fill="currentColor" /> Current
                    </span>
                  ) : (
                    <button
                      onClick={() => setCurrentMutation.mutate(issue._id)}
                      className="text-xs text-ink-500 hover:text-navy-900 border border-stone-200 px-2 py-0.5 rounded-full hover:border-navy-900 transition-colors"
                    >
                      Set as current
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-ink-500">
                    <button onClick={() => openEdit(issue)} aria-label="Edit" className="hover:text-navy-900">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => confirm('Delete this issue? This cannot be undone.') && deleteMutation.mutate(issue._id)}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-lg my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">{editing ? 'Edit Issue' : 'New Issue'}</h2>
              <button onClick={() => { setShowForm(false); setCoverPreview(''); setCoverMsg(''); }} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Volume</label>
                  <input
                    type="number"
                    {...register('volume', { required: true, valueAsNumber: true })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Issue #</label>
                  <input
                    type="number"
                    {...register('issue', { required: true, valueAsNumber: true })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Year</label>
                  <input
                    type="number"
                    {...register('year', { required: true, valueAsNumber: true })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Title (optional)</label>
                <input {...register('title')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Description</label>
                <textarea
                  rows={2}
                  {...register('description')}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-none"
                />
              </div>

              {/* Cover image — upload or URL */}
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">Cover Image</label>
                <div className="flex items-start gap-3">
                  {displayCover && (
                    <img
                      src={displayCover}
                      alt="Cover preview"
                      className="w-16 h-22 object-cover rounded border border-stone-200 shrink-0"
                      style={{ height: '5.5rem' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer border border-dashed border-stone-300 rounded-lg px-3 py-2.5 hover:border-navy-600 transition-colors">
                      {coverUploading
                        ? <Loader2 size={16} className="text-ink-500 animate-spin" />
                        : <UploadCloud size={16} className="text-ink-500" />}
                      <span className="text-xs text-ink-700">
                        {coverUploading ? 'Uploading…' : 'Upload cover image'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleCoverUpload(e.target.files?.[0] || null)}
                        disabled={coverUploading}
                      />
                    </label>
                    {coverMsg && (
                      <p className={`text-xs ${coverMsg.startsWith('Error') ? 'text-crimson-600' : 'text-teal-700'}`}>
                        {coverMsg}
                      </p>
                    )}
                    <p className="text-xs text-ink-500">{IMG_HINT}</p>
                    <input
                      {...register('coverImageUrl')}
                      placeholder="Or paste image URL here"
                      className="w-full border border-stone-300 rounded px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-navy-900 pt-1 cursor-pointer">
                <input type="checkbox" {...register('isCurrent')} className="mt-0.5" />
                <span>
                  <strong>Publish as Current Issue</strong>
                  <span className="text-ink-500 font-normal ml-1">
                    — the previous current issue will automatically move to Archives.
                  </span>
                </span>
              </label>

              <button
                type="submit"
                disabled={saveMutation.isPending || coverUploading}
                className="btn-primary w-full bg-navy-900 text-white px-4 py-2.5 rounded-lg hover:bg-navy-800 disabled:opacity-60 text-sm shadow-sm"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Issue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
