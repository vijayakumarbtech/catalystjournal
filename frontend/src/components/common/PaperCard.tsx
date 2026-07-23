import { Link } from 'react-router-dom';
import { Download, FileText, Quote } from 'lucide-react';
import type { Article } from '@/types';

export default function PaperCard({ article }: { article: Article }) {
  return (
    <article className="card-surface group p-6 flex flex-col">
      <p className="eyebrow mb-2">{article.subject}</p>
      <h3 className="font-display text-lg font-bold text-navy-900 leading-snug mb-2 group-hover:text-navy-700">
        <Link to={`/articles/${article.slug}`}>{article.title}</Link>
      </h3>
      <p className="text-sm text-ink-500 mb-3">
        {article.authors.map((a) => a.name).join(', ')}
      </p>
      <p className="text-sm text-ink-700 leading-relaxed line-clamp-3 mb-4 flex-1">
        {article.abstract}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs text-ink-500">
        <span className="font-label">
          Vol. {article.volume}, Issue {article.issue} ({article.year})
        </span>
        <div className="flex items-center gap-3">
          <Link to={`/articles/${article.slug}`} aria-label="Read online" className="hover:text-navy-900">
            <FileText size={16} />
          </Link>
          <a href={article.pdfUrl} aria-label="Download PDF" className="hover:text-navy-900">
            <Download size={16} />
          </a>
          <Link to={`/articles/${article.slug}#citation`} aria-label="Citation" className="hover:text-navy-900">
            <Quote size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
