import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { useArticle, useArticles } from '@/lib/queries';
import { api } from '@/lib/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import PaperCard from '@/components/common/PaperCard';

function buildCitation(article: NonNullable<ReturnType<typeof useArticle>['data']>, style: 'apa' | 'mla' | 'chicago') {
  const authors = article.authors.map((a) => a.name).join(', ');
  const year = article.year;
  switch (style) {
    case 'apa':
      return `${authors} (${year}). ${article.title}. The Catalyst, ${article.volume}(${article.issue})${
        article.pages ? `, ${article.pages}` : ''
      }.${article.doi ? ` https://doi.org/${article.doi}` : ''}`;
    case 'mla':
      return `${authors}. "${article.title}." The Catalyst, vol. ${article.volume}, no. ${article.issue}, ${year}${
        article.pages ? `, pp. ${article.pages}` : ''
      }.`;
    case 'chicago':
      return `${authors}. "${article.title}." The Catalyst ${article.volume}, no. ${article.issue} (${year})${
        article.pages ? `: ${article.pages}` : ''
      }.`;
  }
}

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useArticle(slug);
  const { data: relatedData } = useArticles(article ? { subject: article.subject } : undefined);
  const [citationStyle, setCitationStyle] = useState<'apa' | 'mla' | 'chicago'>('apa');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} — The Catalyst`;
    }
  }, [article]);

  function handleDownload() {
    if (!article) return;
    // Fire-and-forget: increments the server-side download counter.
    api.post(`/articles/${article._id}/download`).catch(() => {});
    window.open(article.pdfUrl, '_blank');
  }

  function handleCopyCitation() {
    if (!article) return;
    navigator.clipboard.writeText(buildCitation(article, citationStyle));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const related = relatedData?.data.filter((a) => a._id !== article?._id).slice(0, 3);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Archives', to: '/archives' },
          { label: article?.title || 'Article' },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading && <div className="animate-pulse h-96 bg-stone-100 rounded-lg" />}

        {article && (
          <>
            <p className="eyebrow mb-3">{article.subject}</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{article.title}</h1>
            <p className="text-ink-700 mb-1">
              {article.authors.map((a) => a.name).join(', ')}
            </p>
            <p className="text-sm text-ink-500 mb-6">
              Vol. {article.volume}, Issue {article.issue} ({article.year})
              {article.pages && ` · pp. ${article.pages}`}
              {article.doi && ` · DOI: ${article.doi}`}
              {' · Paper ID: '}{article.paperId}
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <button
                onClick={handleDownload}
                className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-5 py-2.5 rounded hover:bg-navy-800 text-sm"
              >
                <Download size={16} /> Download PDF
              </button>
              <button
                onClick={() => navigator.share?.({ title: article.title, url: window.location.href })}
                className="btn-primary inline-flex items-center gap-2 border border-stone-300 text-ink-700 px-5 py-2.5 rounded hover:bg-stone-50 text-sm"
              >
                <Share2 size={16} /> Share
              </button>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-500 px-2">
                {article.downloadCount.toLocaleString()} downloads · {article.viewCount.toLocaleString()} views
              </span>
            </div>

            <section className="mb-10">
              <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-3">Abstract</h2>
              <p className="text-ink-700 leading-relaxed">{article.abstract}</p>
            </section>

            <section className="mb-10">
              <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-3">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((kw) => (
                  <span key={kw} className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            </section>

            <section id="citation" className="mb-10 bg-paper-dim border border-stone-200 rounded-lg p-6">
              <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">Cite This Article</h2>
              <div className="flex gap-2 mb-4">
                {(['apa', 'mla', 'chicago'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setCitationStyle(style)}
                    className={`text-xs px-3 py-1.5 rounded font-label uppercase tracking-wide ${
                      citationStyle === style
                        ? 'bg-navy-900 text-white'
                        : 'bg-white border border-stone-300 text-ink-700'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              <div className="bg-white border border-stone-200 rounded p-4 text-sm text-ink-900 font-mono leading-relaxed">
                {buildCitation(article, citationStyle)}
              </div>
              <button
                onClick={handleCopyCitation}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-navy-900 font-semibold hover:text-navy-700"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy citation'}
              </button>
            </section>
          </>
        )}

        {related && related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">Related Papers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {related.map((a) => (
                <PaperCard key={a._id} article={a} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
