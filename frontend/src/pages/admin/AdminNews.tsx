import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import type { NewsItem, ApiResponse } from '@/types';

type FormValues = { title: string; body: string };

const IMG_HINT = 'Supported formats: PNG, JPG, JPEG, WEBP. Maximum size: 5 MB.';

export default function AdminNews() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageMsg, setImageMsg] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const { data: news, isLoading } = useQuery({
    queryKey: ['admin', 'news'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<NewsItem[]>>('/admin/news');
      return data.data;
    },
  });

  const { register, handleSubmit, reset } = useForm<FormValues>();

  async function uploadImageToNews(newsId: string, file: File) {
    const formData = new FormData();
    formData.append('newsImage', file);
    const { data } = await api.post(`/admin/news/${newsId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.url as string;
  }

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editing) {
        return api.put(`/admin/news/${editing._id}`, values);
      }
      const res = await api.post('/admin/news', values);
      const newPost = res.data.data;
      if (pendingImageFile) {
        try {
          await uploadImageToNews(newPost._id, pendingImageFile);
        } catch {
          // Post created; image can be added later via Edit.
        }
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      queryClient.invalidateQueries({ queryKey: ['public-news'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setShowForm(false);
      setEditing(null);
      setImagePreview('');
      setImageMsg('');
      setPendingImageFile(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/news/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      queryClient.invalidateQueries({ queryKey: ['public-news'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });

  function openNew() {
    setEditing(null);
    setImagePreview('');
    setImageMsg('');
    setPendingImageFile(null);
    reset({ title: '', body: '' });
    setShowForm(true);
  }

  function openEdit(item: NewsItem) {
    setEditing(item);
    setImagePreview(item.imageUrl || '');
    setImageMsg('');
    setPendingImageFile(null);
    reset({ title: item.title, body: item.body });
    setShowForm(true);
  }

  async function handleImageUpload(file: File | null) {
    if (!file) return;
    const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!ALLOWED.has(file.type)) {
      setImageMsg(`Error: ${IMG_HINT}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageMsg('Error: File must be under 5 MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setImageMsg('');

    if (editing) {
      setImageUploading(true);
      try {
        const url = await uploadImageToNews(editing._id, file);
        setImagePreview(url);
        queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
        queryClient.invalidateQueries({ queryKey: ['public-news'] });
        queryClient.invalidateQueries({ queryKey: ['news'] });
        setImageMsg('✓ Image uploaded and saved.');
      } catch (err: any) {
        setImageMsg(`Error: ${err?.response?.data?.message || 'Upload failed.'}`);
        setImagePreview(editing.imageUrl || '');
      } finally {
        setImageUploading(false);
      }
    } else {
      setPendingImageFile(file);
      setImageMsg('✓ Image selected. It will be uploaded when you save.');
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">News</h1>
          <p className="text-sm text-ink-500">Post journal announcements and news updates.</p>
        </div>
        <button
          onClick={openNew}
          className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-lg hover:bg-navy-800 text-sm shadow-sm"
        >
          <Plus size={16} /> New Post
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Image</th>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Published</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && <tr><td colSpan={4} className="text-center py-10 text-ink-500">Loading…</td></tr>}
            {news?.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10 text-ink-500">No news posts yet.</td></tr>
            )}
            {news?.map((n) => (
              <tr key={n._id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3">
                  {n.imageUrl ? (
                    <img
                      src={getImageUrl(n.imageUrl)}
                      alt={n.title}
                      className="w-12 h-9 object-cover rounded border border-stone-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-12 h-9 rounded border border-stone-200 bg-stone-100 flex items-center justify-center">
                      <ImageIcon size={14} className="text-ink-500" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-navy-900 max-w-md truncate">{n.title}</td>
                <td className="px-4 py-3 text-xs text-ink-500">{new Date(n.publishedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-ink-500">
                    <button onClick={() => openEdit(n)} aria-label="Edit" className="hover:text-navy-900"><Pencil size={16} /></button>
                    <button onClick={() => confirm('Delete this post?') && deleteMutation.mutate(n._id)} aria-label="Delete" className="hover:text-crimson-600">
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
              <h2 className="font-semibold text-navy-900">{editing ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="p-6 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">Image</label>
                <div className="flex items-start gap-3">
                  <div className="w-20 h-14 rounded-lg border border-stone-200 bg-paper-dim flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <ImageIcon size={18} className="text-ink-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer border border-dashed border-stone-300 rounded-lg px-3 py-2.5 hover:border-navy-600 transition-colors">
                      {imageUploading
                        ? <Loader2 size={16} className="text-ink-500 animate-spin" />
                        : <UploadCloud size={16} className="text-ink-500" />}
                      <span className="text-xs text-ink-700">
                        {imageUploading ? 'Uploading…' : 'Upload image (optional)'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                        disabled={imageUploading}
                      />
                    </label>
                    {imageMsg && (
                      <p className={`text-xs ${imageMsg.startsWith('Error') ? 'text-crimson-600' : 'text-teal-700'}`}>
                        {imageMsg}
                      </p>
                    )}
                    <p className="text-xs text-ink-500">{IMG_HINT}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Title</label>
                <input {...register('title', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Body</label>
                <textarea rows={6} {...register('body', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-none" />
              </div>
              <button
                type="submit"
                disabled={saveMutation.isPending || imageUploading}
                className="btn-primary w-full bg-navy-900 text-white px-4 py-2.5 rounded-lg hover:bg-navy-800 disabled:opacity-60 text-sm shadow-sm"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Post'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
