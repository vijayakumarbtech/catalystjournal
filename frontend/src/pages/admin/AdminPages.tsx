import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import QuillEditor from '@/components/common/QuillEditor';
import type { CmsPage, ApiResponse } from '@/types';

// These map 1:1 to the site's Submission Guidelines pages plus the legacy
// Author Guidelines page (kept, though no longer in the primary nav).
const managedSlugs = [
  { slug: 'submission-guidelines', label: 'Submission Guidelines' },
  { slug: 'open-access-statement', label: 'Open Access Statement & Licensing' },
  { slug: 'peer-review-policy', label: 'Peer Review Policy' },
  { slug: 'publication-ethics', label: 'Publication Ethics & Malpractice Statement' },
  { slug: 'guidelines', label: 'Author Guidelines' },
];

export default function AdminPages() {
  const queryClient = useQueryClient();
  const [activeSlug, setActiveSlug] = useState(managedSlugs[0].slug);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  useQuery({
    queryKey: ['admin', 'pages', activeSlug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CmsPage>>(`/admin/pages/${activeSlug}`);
      setTitle(data.data?.title || '');
      setContent(data.data?.contentHtml || '');
      setMetaDescription(data.data?.metaDescription || '');
      return data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/admin/pages/${activeSlug}`, { title, contentHtml: content, metaDescription }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] }),
  });

  function handleTabChange(slug: string) {
    setActiveSlug(slug);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">Pages (CMS)</h1>
      <p className="text-sm text-ink-500 mb-6">Edit the content of Submission Guidelines pages.</p>

      <div className="flex gap-2 mb-6 border-b border-stone-200 flex-wrap">
        {managedSlugs.map((s) => (
          <button
            key={s.slug}
            onClick={() => handleTabChange(s.slug)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              activeSlug === s.slug ? 'border-navy-900 text-navy-900' : 'border-transparent text-ink-500'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-stone-200 rounded-lg p-6 max-w-3xl">
        <div className="mb-4">
          <label className="block text-sm font-medium text-navy-900 mb-1">Page Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-navy-900 mb-1">
            Meta Description (SEO)
          </label>
          <textarea
            rows={2}
            maxLength={300}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="A concise 1-2 sentence summary shown in search results."
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-none"
          />
          <p className="text-xs text-ink-500 mt-1">{metaDescription.length}/300</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-navy-900 mb-1">Content</label>
          <QuillEditor
            key={activeSlug}
            value={content}
            onChange={setContent}
            placeholder="Write the page content here…"
          />
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="btn-primary bg-navy-900 text-white px-5 py-2.5 rounded hover:bg-navy-800 disabled:opacity-60 text-sm"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save Page'}
        </button>
        {saveMutation.isSuccess && (
          <span className="ml-3 text-sm text-teal-700">Saved — changes are live immediately.</span>
        )}
      </div>
    </div>
  );
}
