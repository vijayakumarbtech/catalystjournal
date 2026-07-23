import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIssues } from '@/lib/queries';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ImageWithFallback from '@/components/common/ImageWithFallback';

export default function Archives() {
  const [year, setYear] = useState<string>('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useIssues({
    year: year ? Number(year) : undefined,
    page,
  });

  useEffect(() => {
    document.title = 'Archives — The Catalyst';
  }, []);

  useEffect(() => {
    setPage(1);
  }, [year]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Archives' }]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Archives</h1>
            <p className="text-ink-700">
              Browse previously published volumes and issues, sorted from newest to oldest.
              The current issue is not shown here — visit{' '}
              <Link to="/current-issue" className="text-navy-700 hover:underline">Current Issue</Link>.
            </p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-stone-300 rounded-lg px-4 py-2.5 text-sm bg-white"
            aria-label="Filter by year"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && data?.data.length === 0 && (
          <p className="text-ink-500">No archived issues found for this filter.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {data?.data.map((issue) => (
            <Link
              key={issue._id}
              to={`/archives/${issue._id}`}
              className="group block transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[3/4] bg-navy-900 rounded-lg shadow-card group-hover:shadow-lifted transition-shadow overflow-hidden">
                <ImageWithFallback
                  src={issue.coverImageUrl}
                  alt={`Cover of Volume ${issue.volume}, Issue ${issue.issue}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                      <span className="eyebrow text-gold-400">Vol. {issue.volume}</span>
                      <span className="font-display text-lg text-white font-bold mt-1">
                        Issue {issue.issue}
                      </span>
                      <span className="text-stone-400 text-sm mt-1">{issue.year}</span>
                    </div>
                  }
                />
              </div>
              <p className="text-sm text-ink-700 mt-2 group-hover:text-navy-900">
                Vol. {issue.volume}, Issue {issue.issue} ({issue.year})
              </p>
            </Link>
          ))}
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium ${
                  p === page ? 'bg-navy-900 text-white' : 'bg-white border border-stone-300 text-ink-700 hover:bg-stone-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
