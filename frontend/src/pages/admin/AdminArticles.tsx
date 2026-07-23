import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { Article, PaginatedResponse } from '@/types';

type FormValues = {
  title: string;
  authors: string; // comma-separated names, parsed server-side into Author[]
  abstract: string;
  keywords: string;
  subject: string;
  doi?: string;
  volume: number;
  issue: number;
  year: number;
  pages?: string;
  pdfUrl: string;
  status: 'draft' | 'published';
};

export default function AdminArticles() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'articles'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Article>>('/admin/articles');
      return data;
    },
  });

  const { register, handleSubmit, reset } = useForm<FormValues>();

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing ? api.put(`/admin/articles/${editing._id}`, values) : api.post('/admin/articles', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] });
      setShowForm(false);
      setEditing(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/articles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  });

  function openNew() {
    setEditing(null);
    reset({ status: 'draft' } as FormValues);
    setShowForm(true);
  }

  function openEdit(article: Article) {
    setEditing(article);
    reset({
      ...article,
      authors: article.authors.map((a) => a.name).join(', '),
      keywords: article.keywords.join(', '),
    } as unknown as FormValues);
    setShowForm(true);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Articles</h1>
          <p className="text-sm text-ink-500">Publish and manage individual research articles.</p>
        </div>
        <button onClick={openNew} className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded hover:bg-navy-800 text-sm">
          <Plus size={16} /> New Article
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Vol/Issue</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Downloads</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && <tr><td colSpan={5} className="text-center py-10 text-ink-500">Loading…</td></tr>}
            {data?.data.map((a) => (
              <tr key={a._id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3 font-medium text-navy-900 max-w-xs truncate">{a.title}</td>
                <td className="px-4 py-3">Vol. {a.volume}, {a.issue}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'published' ? 'bg-teal-100 text-teal-700' : 'bg-stone-200 text-ink-500'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">{a.downloadCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-ink-500">
                    <button onClick={() => openEdit(a)} aria-label="Edit" className="hover:text-navy-900"><Pencil size={16} /></button>
                    <button onClick={() => confirm('Delete this article?') && deleteMutation.mutate(a._id)} aria-label="Delete" className="hover:text-crimson-600">
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
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">{editing ? 'Edit Article' : 'New Article'}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Title</label>
                <input {...register('title', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Authors (comma separated)</label>
                <input {...register('authors', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Abstract</label>
                <textarea rows={4} {...register('abstract', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Keywords (comma separated)</label>
                  <input {...register('keywords', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Subject</label>
                  <input {...register('subject', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Volume</label>
                  <input type="number" {...register('volume', { required: true, valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Issue</label>
                  <input type="number" {...register('issue', { required: true, valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Year</label>
                  <input type="number" {...register('year', { required: true, valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Pages</label>
                  <input placeholder="112-128" {...register('pages')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">DOI</label>
                  <input {...register('doi')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Status</label>
                  <select {...register('status')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm bg-white">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">PDF URL</label>
                <input {...register('pdfUrl', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="btn-primary w-full bg-navy-900 text-white px-4 py-2.5 rounded hover:bg-navy-800 disabled:opacity-60 text-sm"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Article'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
