import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Share2, Copy, Check, ExternalLink, Maximize2 } from 'lucide-react';
import { useArticle, useArticles } from '@/lib/queries';
import { api } from '@/lib/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import PaperCard from '@/components/common/PaperCard';
import type { Article } from '@/types';

function buildCitation(article: Article, style: 'apa' | 'mla' | 'chicago') {
  const authorNames = article.authors.map((a) => a.name).join(', ');
  const year = article.year;
  switch (style) {
    case 'apa':
      return `${authorNames} (${year}). ${article.title}. The Catalyst, ${article.volume}(${article.issue})${
        article.pages ? `, ${article.pages}` : ''
      }.${article.doi ? ` https://doi.org/${article.doi}` : ''}`;
    case 'mla':
      return `${authorNames}. "${article.title}." The Catalyst, vol. ${article.volume}, no. ${article.issue}, ${year}${
        article.pages ? `, pp. ${article.pages}` : ''
      }.`;
    case 'chicago':
      return `${authorNames}. "${article.title}." The Catalyst ${article.volume}, no. ${article.issue} (${year})${
        article.pages ? `: ${article.pages}` : ''
      }.`;
  }
}

function PdfViewer({ url, title }: { url: string; title: string }) {
  const [viewerError, setViewerError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  if (viewerError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 bg-stone-50 rounded-xl border border-stone-200">
        <p className="text-ink-500 text-sm">
          Your browser does not support embedded PDF viewing.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-navy-900 text-white px-5 py-2.5 rounded hover:bg-navy-800 text-sm"
        >
          <ExternalLink size={16} /> Open PDF in New Tab
        </a>
      </div>
    );
  }

  return (
    <div className={`relative ${fullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="absolute top-3 right-3 z-10 bg-black/70 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5 hover:bg-black"
        >
          <Maximize2 size={14} /> Exit Fullscreen
        </button>
      )}
      <div className={`relative bg-stone-100 rounded-xl overflow-hidden border border-stone-200 ${fullscreen ? 'h-full' : 'h-[680px]'}`}>
        {!fullscreen && (
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={() => setFullscreen(true)}
              className="bg-white/90 backdrop-blur text-ink-700 px-2.5 py-1.5 rounded text-xs flex items-center gap-1 border border-stone-200 hover:bg-white shadow-sm"
            >
              <Maximize2 size={12} /> Expand
            </button>
          </div>
        )}
        <iframe
          src={`${url}#toolbar=1&navpanes=1&view=FitH`}
          title={title}
          className="w-full h-full"
          onError={() => setViewerError(true)}
        />
      </div>
    </div>
  );
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
      window.scrollTo(0, 0);
    }
  }, [article]);

  function handleDownload() {
    if (!article) return;
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
  const correspondingAuthor = article?.authors.find(a => a.isCorresponding);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Current Issue', to: '/current-issue' },
          { label: article?.title || 'Article' },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading && (
          <div className="space-y-4">
            <div className="animate-pulse h-8 bg-stone-100 rounded-lg w-2/3" />
            <div className="animate-pulse h-4 bg-stone-100 rounded w-1/2" />
            <div className="animate-pulse h-64 bg-stone-100 rounded-lg mt-8" />
          </div>
        )}

        {!isLoading && !article && (
          <div className="text-center py-20">
            <p className="text-ink-500 text-lg mb-4">Article not found.</p>
            <Link to="/current-issue" className="text-navy-600 hover:underline">← Back to Current Issue</Link>
          </div>
        )}

        {article && (
          <>
            {/* Header */}
            <div className="mb-8">
              <p className="eyebrow mb-3 text-gold-600">{article.subject}</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 leading-tight mb-2">
                {article.title}
              </h1>
              {article.subtitle && (
                <p className="text-xl text-ink-600 mb-4">{article.subtitle}</p>
              )}

              {/* Authors */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 mb-6">
                {article.authors.map((author, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="font-medium text-navy-900">{author.name}</span>
                    {author.isCorresponding && (
                      <span title="Corresponding Author" className="text-gold-500 text-xs">✉</span>
                    )}
                    {idx < article.authors.length - 1 && <span className="text-ink-300">,</span>}
                  </div>
                ))}
              </div>

              {/* Affiliations */}
              {article.authors.some(a => a.affiliation || a.institution) && (
                <div className="mb-4 text-sm text-ink-500 space-y-0.5">
                  {article.authors
                    .filter(a => a.affiliation || a.institution)
                    .filter((a, i, arr) => arr.findIndex(b => (b.affiliation || b.institution) === (a.affiliation || a.institution)) === i)
                    .map((author, idx) => (
                      <p key={idx}>{author.affiliation || author.institution}</p>
                    ))}
                </div>
              )}

              {/* Publication Info */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500 bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 mb-6">
                <span>Vol. {article.volume}, No. {article.issue} ({article.year})</span>
                {article.pages && <span>· pp. {article.pages}</span>}
                {article.doi && (
                  <a
                    href={`https://doi.org/${article.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy-600 hover:underline flex items-center gap-1"
                  >
                    · DOI: {article.doi} <ExternalLink size={11} />
                  </a>
                )}
                <span>· Paper ID: {article.paperId}</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownload}
                  className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-5 py-2.5 rounded hover:bg-navy-800 text-sm font-medium"
                >
                  <Download size={16} /> Download PDF
                </button>
                <button
                  onClick={() => navigator.share?.({ title: article.title, url: window.location.href })}
                  className="inline-flex items-center gap-2 border border-stone-300 text-ink-700 px-5 py-2.5 rounded hover:bg-stone-50 text-sm"
                >
                  <Share2 size={16} /> Share
                </button>
                <span className="inline-flex items-center text-xs text-ink-400 px-2">
                  {article.downloadCount.toLocaleString()} downloads ·{' '}
                  {article.viewCount.toLocaleString()} views
                </span>
              </div>
            </div>

            {/* Abstract */}
            <section className="mb-8 bg-white border border-stone-200 rounded-xl p-6">
              <h2 className="font-label text-xs uppercase tracking-widest text-ink-400 mb-3">Abstract</h2>
              <p className="text-ink-700 leading-relaxed">{article.abstract}</p>
            </section>

            {/* Keywords */}
            {article.keywords.length > 0 && (
              <section className="mb-8">
                <h2 className="font-label text-xs uppercase tracking-widest text-ink-400 mb-3">Keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map((kw) => (
                    <span key={kw} className="text-xs bg-navy-50 text-navy-700 border border-navy-100 px-3 py-1 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* PDF Viewer */}
            {article.pdfUrl && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-label text-xs uppercase tracking-widest text-ink-400">Full Article</h2>
                  <button onClick={handleDownload} className="text-xs text-navy-600 hover:underline flex items-center gap-1">
                    <Download size={12} /> Download PDF
                  </button>
                </div>
                <PdfViewer url={article.pdfUrl} title={article.title} />
              </section>
            )}

            {/* Corresponding Author */}
            {correspondingAuthor && (
              <section className="mb-8 bg-stone-50 border border-stone-200 rounded-xl p-5">
                <h2 className="font-label text-xs uppercase tracking-widest text-ink-400 mb-3">Corresponding Author</h2>
                <p className="font-medium text-navy-900">{correspondingAuthor.name}</p>
                {correspondingAuthor.affiliation && <p className="text-sm text-ink-600">{correspondingAuthor.affiliation}</p>}
                {correspondingAuthor.email && (
                  <a href={`mailto:${correspondingAuthor.email}`} className="text-sm text-navy-600 hover:underline mt-0.5 inline-block">
                    {correspondingAuthor.email}
                  </a>
                )}
                {correspondingAuthor.orcid && (
                  <a
                    href={`https://orcid.org/${correspondingAuthor.orcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline mt-0.5 flex items-center gap-1"
                  >
                    ORCID: {correspondingAuthor.orcid} <ExternalLink size={11} />
                  </a>
                )}
              </section>
            )}

            {/* Citation */}
            <section id="citation" className="mb-10 bg-paper-dim border border-stone-200 rounded-xl p-6">
              <h2 className="font-label text-xs uppercase tracking-widest text-ink-400 mb-4">Cite This Article</h2>
              <div className="flex gap-2 mb-4">
                {(['apa', 'mla', 'chicago'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setCitationStyle(style)}
                    className={`text-xs px-3 py-1.5 rounded font-label uppercase tracking-wide transition-colors ${
                      citationStyle === style
                        ? 'bg-navy-900 text-white'
                        : 'bg-white border border-stone-300 text-ink-700 hover:bg-stone-50'
                    }`}
                  >
                    {style.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="bg-white border border-stone-200 rounded-lg p-4 text-sm text-ink-900 font-mono leading-relaxed">
                {buildCitation(article, citationStyle)}
              </div>
              <button
                onClick={handleCopyCitation}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-navy-900 font-semibold hover:text-navy-700"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy citation'}
              </button>
            </section>

            {/* Related Articles */}
            {related && related.length > 0 && (
              <section className="mt-12 pt-10 border-t border-stone-200">
                <h2 className="font-label text-xs uppercase tracking-widest text-ink-400 mb-6">Related Articles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {related.map((a) => (
                    <PaperCard key={a._id} article={a} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
