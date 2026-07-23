import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Quote, Share2 } from 'lucide-react';
import { useCurrentIssue } from '@/lib/queries';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ImageWithFallback from '@/components/common/ImageWithFallback';

export default function CurrentIssue() {
  const { data: issue, isLoading } = useCurrentIssue();

  useEffect(() => {
    document.title = 'Current Issue — The Catalyst';
  }, []);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Current Issue' }]} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading && <div className="animate-pulse h-64 bg-stone-100 rounded-lg" />}

        {!isLoading && !issue && (
          <p className="text-ink-500">No issue is currently published.</p>
        )}

        {issue && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <div className="aspect-[3/4] bg-navy-900 rounded-lg shadow-lifted overflow-hidden sticky top-28">
                <ImageWithFallback
                  src={issue.coverImageUrl}
                  alt={`Cover of Volume ${issue.volume}, Issue ${issue.issue}`}
                  className="w-full h-full object-cover"
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                      <span className="eyebrow text-gold-400">Volume {issue.volume}</span>
                      <span className="font-display text-2xl text-white font-bold mt-2">
                        Issue {issue.issue}
                      </span>
                      <span className="text-stone-400 mt-1">{issue.year}</span>
                    </div>
                  }
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <p className="eyebrow mb-2">
                Volume {issue.volume} · Issue {issue.issue} · {issue.year}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                {issue.title || `Current Issue`}
              </h1>
              {issue.description && (
                <p className="text-ink-700 leading-relaxed mb-8 max-w-2xl">{issue.description}</p>
              )}

              <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">
                Table of Contents ({issue.articles?.length || 0} papers)
              </h2>
              <div className="divide-y divide-stone-200 border-y border-stone-200">
                {issue.articles?.map((article, i) => (
                  <div key={article._id} className="py-5 flex flex-col sm:flex-row sm:items-start gap-3">
                    <span className="font-label text-xs text-gold-600 w-8 shrink-0 pt-1">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <Link
                        to={`/articles/${article.slug}`}
                        className="font-display font-bold text-navy-900 hover:text-navy-700"
                      >
                        {article.title}
                      </Link>
                      <p className="text-sm text-ink-500 mt-1">
                        {article.authors.map((a) => a.name).join(', ')}
                        {article.pages && ` · pp. ${article.pages}`}
                        {article.doi && ` · DOI: ${article.doi}`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-ink-500">
                        <Link to={`/articles/${article.slug}`} className="flex items-center gap-1 text-xs hover:text-navy-900">
                          <FileText size={14} /> Read Online
                        </Link>
                        <a href={article.pdfUrl} className="flex items-center gap-1 text-xs hover:text-navy-900">
                          <Download size={14} /> PDF
                        </a>
                        <Link to={`/articles/${article.slug}#citation`} className="flex items-center gap-1 text-xs hover:text-navy-900">
                          <Quote size={14} /> Cite
                        </Link>
                        <button
                          className="flex items-center gap-1 text-xs hover:text-navy-900"
                          onClick={() => navigator.share?.({ title: article.title, url: window.location.origin + `/articles/${article.slug}` })}
                        >
                          <Share2 size={14} /> Share
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
