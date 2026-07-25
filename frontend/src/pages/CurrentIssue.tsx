import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Quote, Share2, BookOpen } from 'lucide-react';
import { useCurrentIssue } from '@/lib/queries';
import { api } from '@/lib/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ImageWithFallback from '@/components/common/ImageWithFallback';

function handleDownload(article: any) {
  api.post(`/articles/${article._id}/download`).catch(() => {});
  window.open(article.pdfUrl, '_blank');
}

export default function CurrentIssue() {
  const { data: issue, isLoading } = useCurrentIssue();

  useEffect(() => {
    document.title = 'Current Issue — The Catalyst';
  }, []);

  // Group articles by subject for categorized TOC
  const groupedArticles = issue?.articles?.reduce<Record<string, typeof issue.articles>>((groups, article) => {
    const key = article.subject || 'General';
    if (!groups[key]) groups[key] = [];
    groups[key].push(article);
    return groups;
  }, {}) || {};

  const hasGroups = Object.keys(groupedArticles).length > 1;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Current Issue' }]} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading && <div className="animate-pulse h-64 bg-stone-100 rounded-lg" />}

        {!isLoading && !issue && (
          <div className="text-center py-20">
            <BookOpen size={40} className="text-stone-300 mx-auto mb-4" />
            <p className="text-ink-500 text-lg">No issue is currently published.</p>
            <p className="text-sm text-ink-400 mt-2">Check back soon or visit the <Link to="/archives" className="text-navy-600 hover:underline">Archives</Link>.</p>
          </div>
        )}

        {issue && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar: Cover + Issue Info */}
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
              <div className="mt-4 space-y-1 text-sm text-ink-600">
                <p><span className="font-medium text-navy-900">Volume:</span> {issue.volume}</p>
                <p><span className="font-medium text-navy-900">Issue:</span> {issue.issue}</p>
                <p><span className="font-medium text-navy-900">Year:</span> {issue.year}</p>
                {issue.publishedAt && (
                  <p>
                    <span className="font-medium text-navy-900">Published:</span>{' '}
                    {new Date(issue.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                <p><span className="font-medium text-navy-900">Articles:</span> {issue.articles?.length || 0}</p>
              </div>
            </div>

            {/* Main Content: TOC */}
            <div className="lg:col-span-3">
              <p className="eyebrow mb-2">
                Volume {issue.volume} · Issue {issue.issue} · {issue.year}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                {issue.title || 'Current Issue'}
              </h1>
              {issue.description && (
                <p className="text-ink-700 leading-relaxed mb-8 max-w-2xl">{issue.description}</p>
              )}

              {/* Table of Contents */}
              {(!issue.articles || issue.articles.length === 0) ? (
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-8 text-center">
                  <p className="text-ink-500">No articles published in this issue yet.</p>
                </div>
              ) : (
                <>
                  <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-6">
                    Table of Contents ({issue.articles?.length || 0} papers)
                  </h2>

                  {hasGroups ? (
                    // Categorized TOC
                    Object.entries(groupedArticles).map(([subject, articles]) => (
                      <div key={subject} className="mb-10">
                        <h3 className="text-base font-semibold text-navy-900 border-b border-stone-200 pb-2 mb-4">
                          {subject}
                        </h3>
                        <div className="space-y-0 divide-y divide-stone-200 border-y border-stone-200">
                          {articles.map((article, i) => (
                            <ArticleCard key={article._id} article={article} index={i} />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    // Simple TOC
                    <div className="divide-y divide-stone-200 border-y border-stone-200">
                      {issue.articles?.map((article, i) => (
                        <ArticleCard key={article._id} article={article} index={i} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ArticleCard({ article, index }: { article: any; index: number }) {
  const authorNames = article.authors?.map((a: any) => a.name).join(', ');
  const abstractPreview = article.abstract
    ? article.abstract.length > 200
      ? article.abstract.slice(0, 200) + '…'
      : article.abstract
    : null;

  return (
    <div className="py-6 flex flex-col gap-3">
      <div className="flex gap-4">
        <span className="font-label text-xs text-gold-600 w-8 shrink-0 pt-1 font-semibold">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <Link
            to={`/articles/${article.slug}`}
            className="font-display font-bold text-navy-900 hover:text-navy-600 transition-colors text-lg leading-snug block mb-1"
          >
            {article.title}
          </Link>
          {article.subtitle && (
            <p className="text-sm text-ink-600 mb-1">{article.subtitle}</p>
          )}
          <p className="text-sm text-ink-500 mb-2">
            <span className="font-medium text-ink-700">{authorNames}</span>
            {article.pages && ` · pp. ${article.pages}`}
            {article.doi && (
              <a
                href={`https://doi.org/${article.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-500 hover:underline ml-1"
              >
                · DOI: {article.doi}
              </a>
            )}
          </p>

          {abstractPreview && (
            <p className="text-sm text-ink-600 leading-relaxed mb-3">{abstractPreview}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-ink-500">
            <Link
              to={`/articles/${article.slug}`}
              className="flex items-center gap-1.5 text-xs font-medium text-navy-700 hover:text-navy-900 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-full transition-colors"
            >
              <FileText size={13} /> Read Article
            </Link>
            {article.pdfUrl && (
              <button
                onClick={() => handleDownload(article)}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-600 hover:text-navy-900 hover:bg-stone-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <Download size={13} /> Download PDF
              </button>
            )}
            <Link
              to={`/articles/${article.slug}#citation`}
              className="flex items-center gap-1.5 text-xs hover:text-navy-900 transition-colors"
            >
              <Quote size={13} /> Cite
            </Link>
            <button
              className="flex items-center gap-1.5 text-xs hover:text-navy-900 transition-colors"
              onClick={() =>
                navigator.share?.({
                  title: article.title,
                  url: window.location.origin + `/articles/${article.slug}`,
                })
              }
            >
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
