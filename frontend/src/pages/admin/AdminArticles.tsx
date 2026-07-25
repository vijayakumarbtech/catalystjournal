import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Plus, Pencil, Trash2, X, Loader2, UploadCloud, FileText,
  Check, ExternalLink, Eye, EyeOff
} from 'lucide-react';
import { api, apiUpload } from '@/lib/api';
import type { Article, Issue, PaginatedResponse, ApiResponse } from '@/types';

type AuthorFormEntry = {
  name: string;
  affiliation?: string;
  email?: string;
  orcid?: string;
  isCorresponding?: boolean;
};

type FormValues = {
  title: string;
  subtitle?: string;
  abstract: string;
  keywords: string;
  subject: string;
  doi?: string;
  issueId: string;
  pages?: string;
  publicationDate?: string;
  status: 'draft' | 'published';
  isFeatured?: boolean;
};

const SUBJECTS = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biomedical Sciences',
  'Management & Commerce',
  'Social Sciences & Humanities',
  'Environmental Sciences',
  'Interdisciplinary',
  'Other',
];

export default function AdminArticles() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [authors, setAuthors] = useState<AuthorFormEntry[]>([{ name: '' }]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string>('');
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'articles'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Article>>('/admin/articles');
      return data;
    },
  });

  const { data: issuesData } = useQuery({
    queryKey: ['admin', 'issues'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Issue[]>>('/admin/issues');
      return data.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { status: 'draft' }
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const formData = new FormData();

      // Append basic fields
      Object.entries(values).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          formData.append(key, String(val));
        }
      });

      // Append authors as JSON string
      formData.append('authors', JSON.stringify(authors.filter(a => a.name.trim())));

      // Append files
      if (pdfFile) formData.append('pdf', pdfFile);
      if (thumbFile) formData.append('thumbnail', thumbFile);

      if (editing) {
        return apiUpload.put(`/admin/articles/${editing._id}`, formData);
      } else {
        return apiUpload.post('/admin/articles', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Error saving article.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'draft' | 'published' }) =>
      api.put(`/admin/articles/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  });

  function openNew() {
    setEditing(null);
    reset({ status: 'draft' });
    setAuthors([{ name: '' }]);
    setPdfFile(null);
    setThumbFile(null);
    setPdfPreviewUrl('');
    setThumbPreviewUrl('');
    setShowForm(true);
  }

  function openEdit(article: Article) {
    setEditing(article);
    reset({
      title: article.title,
      subtitle: article.subtitle || '',
      abstract: article.abstract,
      keywords: article.keywords.join(', '),
      subject: article.subject,
      doi: article.doi || '',
      pages: article.pages || '',
      publicationDate: article.publicationDate || '',
      status: article.status,
      isFeatured: article.isFeatured || false,
      issueId: '',
    });
    setAuthors(
      article.authors.length > 0
        ? article.authors.map(a => ({
            name: a.name,
            affiliation: a.affiliation || a.institution || '',
            email: a.email || '',
            orcid: a.orcid || '',
            isCorresponding: a.isCorresponding || false,
          }))
        : [{ name: '' }]
    );
    setPdfFile(null);
    setThumbFile(null);
    setPdfPreviewUrl(article.pdfUrl || '');
    setThumbPreviewUrl(article.thumbnail || '');
    setShowForm(true);
  }

  function closeModal() {
    setShowForm(false);
    setEditing(null);
  }

  function addAuthor() {
    setAuthors(prev => [...prev, { name: '' }]);
  }

  function removeAuthor(idx: number) {
    setAuthors(prev => prev.filter((_, i) => i !== idx));
  }

  function updateAuthor(idx: number, field: keyof AuthorFormEntry, value: string | boolean) {
    setAuthors(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  }

  function handlePdfChange(file: File | null) {
    setPdfFile(file);
    if (file) setPdfPreviewUrl(file.name);
  }

  function handleThumbChange(file: File | null) {
    setThumbFile(file);
    if (file) setThumbPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Articles</h1>
          <p className="text-sm text-ink-500">Upload and manage published research articles.</p>
        </div>
        <button
          onClick={openNew}
          className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded hover:bg-navy-800 text-sm"
        >
          <Plus size={16} /> New Article
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Authors</th>
              <th className="text-left px-4 py-3">Vol/Issue</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Downloads</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-ink-500">
                  <Loader2 className="animate-spin inline-block" size={18} />
                </td>
              </tr>
            )}
            {data?.data.map((a) => (
              <tr key={a._id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3 font-medium text-navy-900 max-w-xs">
                  <div className="truncate">{a.title}</div>
                  {a.subtitle && <div className="text-xs text-ink-500 truncate">{a.subtitle}</div>}
                </td>
                <td className="px-4 py-3 text-ink-600 max-w-[150px] truncate">
                  {a.authors.map(au => au.name).join(', ')}
                </td>
                <td className="px-4 py-3">Vol. {a.volume}, No. {a.issue}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'published' ? 'bg-teal-100 text-teal-700' : 'bg-stone-200 text-ink-500'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">{a.downloadCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 text-ink-500">
                    <button
                      onClick={() => toggleStatus.mutate({ id: a._id, status: a.status === 'published' ? 'draft' : 'published' })}
                      title={a.status === 'published' ? 'Unpublish' : 'Publish'}
                      className="hover:text-navy-900 p-1 rounded hover:bg-stone-100"
                    >
                      {a.status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    {a.pdfUrl && (
                      <a href={a.pdfUrl} target="_blank" rel="noopener noreferrer" title="View PDF" className="hover:text-navy-900 p-1 rounded hover:bg-stone-100">
                        <FileText size={15} />
                      </a>
                    )}
                    <a href={`/articles/${a.slug}`} target="_blank" rel="noopener noreferrer" title="View on site" className="hover:text-navy-900 p-1 rounded hover:bg-stone-100">
                      <ExternalLink size={15} />
                    </a>
                    <button onClick={() => openEdit(a)} title="Edit" className="hover:text-navy-900 p-1 rounded hover:bg-stone-100">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => confirm('Delete this article? This cannot be undone.') && deleteMutation.mutate(a._id)}
                      title="Delete"
                      className="hover:text-crimson-600 p-1 rounded hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.data.length && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-ink-500">No articles yet. Click "New Article" to add one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 sticky top-0 bg-white rounded-t-lg z-10">
              <h2 className="font-semibold text-navy-900 text-lg">{editing ? 'Edit Article' : 'New Article'}</h2>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-600">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit((v) => saveMutation.mutate(v))}
              className="p-6 space-y-6"
            >
              {/* Issue Selector */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-navy-900 mb-2">
                  Link to Issue *
                </label>
                <select
                  {...register('issueId', { required: !editing })}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm bg-white focus:border-navy-500"
                >
                  <option value="">{editing ? '— Keep current issue —' : 'Select an issue'}</option>
                  {issuesData?.map(issue => (
                    <option key={issue._id} value={issue._id}>
                      Vol. {issue.volume}, No. {issue.issue} ({issue.year}){issue.isCurrent ? ' — Current Issue' : ''}
                    </option>
                  ))}
                </select>
                {errors.issueId && <p className="text-xs text-crimson-600 mt-1">Please select an issue.</p>}
                <p className="text-xs text-ink-500 mt-1.5">The article will automatically appear in the selected issue's Table of Contents.</p>
              </div>

              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wide border-b pb-2">Article Details</h3>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Title *</label>
                  <input {...register('title', { required: 'Title is required' })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-navy-500" />
                  {errors.title && <p className="text-xs text-crimson-600 mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Subtitle (Optional)</label>
                  <input {...register('subtitle')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-navy-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Abstract *</label>
                  <textarea rows={5} {...register('abstract', { required: 'Abstract is required' })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-none focus:border-navy-500" />
                  {errors.abstract && <p className="text-xs text-crimson-600 mt-1">{errors.abstract.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Keywords * (comma-separated)</label>
                    <input {...register('keywords', { required: 'Keywords are required' })} placeholder="e.g. machine learning, neural networks" className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-navy-500" />
                    {errors.keywords && <p className="text-xs text-crimson-600 mt-1">{errors.keywords.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Subject Area *</label>
                    <select {...register('subject', { required: 'Subject is required' })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm bg-white focus:border-navy-500">
                      <option value="">Select subject</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.subject && <p className="text-xs text-crimson-600 mt-1">{errors.subject.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">DOI</label>
                    <input {...register('doi')} placeholder="10.xxxxx/xxxxx" className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono focus:border-navy-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Page Range</label>
                    <input {...register('pages')} placeholder="e.g. 112-128" className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-navy-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Publication Date</label>
                    <input type="date" {...register('publicationDate')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-navy-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Status</label>
                    <select {...register('status')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm bg-white focus:border-navy-500">
                      <option value="draft">Draft (not visible publicly)</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 mt-6">
                    <input type="checkbox" id="isFeatured" {...register('isFeatured')} className="w-4 h-4 text-navy-600 rounded border-stone-300" />
                    <label htmlFor="isFeatured" className="text-sm font-medium text-navy-900 cursor-pointer">Mark as Featured</label>
                  </div>
                </div>
              </div>

              {/* Authors */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wide">Authors</h3>
                  <button type="button" onClick={addAuthor} className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded flex items-center gap-1">
                    <Plus size={12} /> Add Author
                  </button>
                </div>

                <div className="space-y-4">
                  {authors.map((author, idx) => (
                    <div key={idx} className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-ink-500 uppercase">Author {idx + 1}</span>
                        {authors.length > 1 && (
                          <button type="button" onClick={() => removeAuthor(idx)} className="text-crimson-500 hover:text-crimson-700">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-navy-900 mb-1">Full Name *</label>
                          <input
                            value={author.name}
                            onChange={e => updateAuthor(idx, 'name', e.target.value)}
                            className="w-full border border-stone-300 rounded px-2.5 py-1.5 text-sm focus:border-navy-500"
                            placeholder="Dr. Jane Smith"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-navy-900 mb-1">Affiliation</label>
                          <input
                            value={author.affiliation || ''}
                            onChange={e => updateAuthor(idx, 'affiliation', e.target.value)}
                            className="w-full border border-stone-300 rounded px-2.5 py-1.5 text-sm focus:border-navy-500"
                            placeholder="University / Institution"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-navy-900 mb-1">Email</label>
                          <input
                            type="email"
                            value={author.email || ''}
                            onChange={e => updateAuthor(idx, 'email', e.target.value)}
                            className="w-full border border-stone-300 rounded px-2.5 py-1.5 text-sm focus:border-navy-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-navy-900 mb-1">ORCID</label>
                          <input
                            value={author.orcid || ''}
                            onChange={e => updateAuthor(idx, 'orcid', e.target.value)}
                            className="w-full border border-stone-300 rounded px-2.5 py-1.5 text-sm font-mono focus:border-navy-500"
                            placeholder="0000-0002-1825-0097"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`corresponding-${idx}`}
                            checked={author.isCorresponding || false}
                            onChange={e => updateAuthor(idx, 'isCorresponding', e.target.checked)}
                            className="w-4 h-4 text-navy-600 rounded border-stone-300"
                          />
                          <label htmlFor={`corresponding-${idx}`} className="text-xs text-ink-700 cursor-pointer">
                            Corresponding Author
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wide border-b pb-2">Files</h3>

                {/* PDF Upload */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    Article PDF {!editing && '*'}
                  </label>
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-6 cursor-pointer transition-colors ${
                      pdfFile ? 'border-teal-400 bg-teal-50' : 'border-stone-300 hover:border-navy-400 bg-stone-50'
                    }`}
                  >
                    {pdfFile ? (
                      <>
                        <Check className="text-teal-600" size={24} />
                        <span className="text-sm font-medium text-teal-700">{pdfFile.name}</span>
                        <span className="text-xs text-teal-600">({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </>
                    ) : pdfPreviewUrl ? (
                      <>
                        <FileText className="text-navy-500" size={24} />
                        <span className="text-sm text-navy-700 truncate max-w-xs">{pdfPreviewUrl.split('/').pop()}</span>
                        <span className="text-xs text-ink-500">Click to replace PDF</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="text-ink-400" size={24} />
                        <span className="text-sm text-ink-500">Click to upload PDF (max 30 MB)</span>
                      </>
                    )}
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={e => handlePdfChange(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">Featured Image / Thumbnail (Optional)</label>
                  <div
                    onClick={() => thumbInputRef.current?.click()}
                    className="flex items-center gap-4 border-2 border-dashed border-stone-300 rounded-lg py-4 px-6 cursor-pointer hover:border-navy-400 bg-stone-50 transition-colors"
                  >
                    {thumbPreviewUrl ? (
                      <>
                        <img src={thumbPreviewUrl} alt="Thumbnail preview" className="w-16 h-16 object-cover rounded border border-stone-200" />
                        <div>
                          <p className="text-sm font-medium text-navy-900">{thumbFile ? thumbFile.name : 'Existing thumbnail'}</p>
                          <p className="text-xs text-ink-500">Click to replace</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="text-ink-400" size={22} />
                        <span className="text-sm text-ink-500">Click to upload image (PNG, JPG, WEBP)</span>
                      </>
                    )}
                    <input
                      ref={thumbInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={e => handleThumbChange(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-ink-600 hover:bg-stone-50 rounded">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary flex items-center gap-2 bg-navy-900 text-white px-6 py-2 rounded hover:bg-navy-800 disabled:opacity-60 text-sm"
                >
                  {saveMutation.isPending ? (
                    <><Loader2 size={15} className="animate-spin" /> Saving…</>
                  ) : (
                    <><Check size={15} /> {editing ? 'Save Changes' : 'Publish Article'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
