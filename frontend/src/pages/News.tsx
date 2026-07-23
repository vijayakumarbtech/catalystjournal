import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Calendar, ArrowLeft, ArrowRight, ArrowUpDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, getImageUrl } from '@/lib/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { LineSkeleton } from '@/components/common/Skeleton';
import type { NewsItem, ApiResponse } from '@/types';

// ── News List ─────────────────────────────────────────────────────────────

export function NewsList() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);

  // Debounce search input to avoid refetching on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when search or sort changes.
  useEffect(() => { setPage(1); }, [debouncedSearch, sort]);

  const { data, isLoading } = useQuery({
    queryKey: ['public-news', debouncedSearch, sort, page],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: NewsItem[];
        page: number;
        totalPages: number;
        totalCount: number;
      }>('/news', { params: { search: debouncedSearch || undefined, sort, page } });
      return data;
    },
  });

  useEffect(() => {
    document.title = 'News & Announcements — The Catalyst';
  }, []);

  // Client-side search filter (backend search may or may not be implemented;
  // this is a safe fallback that always works regardless of backend version).
  const filtered = search
    ? data?.data.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.body.toLowerCase().includes(search.toLowerCase())
      )
    : data?.data;

  return (
    <>
      <Breadcrumbs items={[{ label: 'News & Announcements' }]} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">News &amp; Announcements</h1>
        <p className="text-ink-700 mb-10">
          Latest updates, announcements, and journal news from The Catalyst.
        </p>

        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              placeholder="Search news and announcements…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-stone-300 rounded-lg pl-10 pr-4 py-3 text-sm bg-white shadow-card focus:outline-none focus:border-navy-700 transition-colors"
            />
          </div>
          <div className="relative sm:w-48">
            <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
              aria-label="Sort news by date"
              className="w-full appearance-none border border-stone-300 rounded-lg pl-10 pr-8 py-3 text-sm bg-white shadow-card focus:outline-none focus:border-navy-700 transition-colors cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <LineSkeleton width="w-1/3" />
                <LineSkeleton />
                <LineSkeleton width="w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!filtered || filtered.length === 0) && (
          <div className="text-center py-16 text-ink-500">
            {search ? `No results for "${search}".` : 'No news published yet.'}
          </div>
        )}

        {/* News list */}
        <div className="divide-y divide-stone-200">
          {filtered?.map((item) => (
            <article key={item._id} className="py-8 group">
              {item.imageUrl && (
                <Link to={`/news/${item.slug}`} className="block mb-4 rounded-lg overflow-hidden aspect-[21/9] bg-stone-100">
                  <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </Link>
              )}
              <div className="flex items-center gap-2 text-xs text-ink-500 mb-3">
                <Calendar size={13} />
                <time dateTime={item.publishedAt}>
                  {new Date(item.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              <h2 className="text-xl font-bold text-navy-900 mb-3 group-hover:text-navy-700">
                <Link to={`/news/${item.slug}`}>{item.title}</Link>
              </h2>
              <p className="text-sm text-ink-700 leading-relaxed line-clamp-3 mb-4">
                {item.body.replace(/<[^>]+>/g, '')}
              </p>
              <Link
                to={`/news/${item.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 hover:text-navy-700"
              >
                Read more <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && !search && (
          <div className="flex justify-center gap-2 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded border border-stone-300 flex items-center justify-center text-ink-700 hover:bg-stone-50 disabled:opacity-40"
            >
              <ArrowLeft size={16} />
            </button>
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded text-sm font-medium ${
                  p === page
                    ? 'bg-navy-900 text-white'
                    : 'border border-stone-300 text-ink-700 hover:bg-stone-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="w-9 h-9 rounded border border-stone-300 flex items-center justify-center text-ink-700 hover:bg-stone-50 disabled:opacity-40"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── News Detail ───────────────────────────────────────────────────────────

export function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: news, isLoading, isError } = useQuery({
    queryKey: ['news', slug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<NewsItem>>(`/news/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (news) document.title = `${news.title} — The Catalyst`;
  }, [news]);

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-3">Article Not Found</h1>
        <Link to="/news" className="text-navy-700 hover:underline">← Back to News</Link>
      </div>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'News', to: '/news' }, { label: news?.title || 'Article' }]} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="space-y-4">
            <LineSkeleton width="w-1/3" />
            <LineSkeleton />
            <LineSkeleton />
            <LineSkeleton width="w-2/3" />
          </div>
        ) : news ? (
          <>
            <Link
              to="/news"
              className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-navy-900 mb-8"
            >
              <ArrowLeft size={15} /> Back to News
            </Link>
            <div className="flex items-center gap-2 text-xs text-ink-500 mb-4">
              <Calendar size={13} />
              <time dateTime={news.publishedAt}>
                {new Date(news.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-8">{news.title}</h1>
            {news.imageUrl && (
              <div className="mb-8 rounded-lg overflow-hidden aspect-[16/9] bg-stone-100">
                <img
                  src={getImageUrl(news.imageUrl)}
                  alt={news.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            {/* Body: rendered as HTML if it contains tags, or as plain text */}
            {news.body.includes('<') ? (
              <div
                className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-navy-900 prose-a:text-navy-700"
                dangerouslySetInnerHTML={{ __html: news.body }}
              />
            ) : (
              <p className="text-ink-700 leading-relaxed whitespace-pre-wrap">{news.body}</p>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}
