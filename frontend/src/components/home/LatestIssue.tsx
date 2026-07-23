import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCurrentIssue } from '@/lib/queries';
import SectionHeading from '../common/SectionHeading';
import { LineSkeleton } from '../common/Skeleton';
import ImageWithFallback from '../common/ImageWithFallback';

export default function LatestIssue() {
  const { data: issue, isLoading } = useCurrentIssue();

  return (
    <section className="py-20 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-2">
            <SectionHeading eyebrow="Latest Issue" title="Current Volume" />
            {isLoading ? (
              <div className="mt-6 space-y-3">
                <LineSkeleton width="w-1/2" />
                <LineSkeleton width="w-3/4" />
              </div>
            ) : issue ? (
              <>
                <div className="aspect-[3/4] max-w-xs bg-navy-900 rounded-lg shadow-lifted mt-6 overflow-hidden">
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
                <Link
                  to={`/current-issue`}
                  className="btn-primary inline-flex items-center gap-2 mt-6 text-navy-900 font-semibold hover:text-navy-700"
                >
                  View full issue <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <p className="text-ink-500 mt-6">No issue published yet.</p>
            )}
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">
              In This Issue
            </h3>
            <div className="ledger-rule">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-[42px] flex items-center">
                    <LineSkeleton width="w-full" />
                  </div>
                ))}
              {issue?.articles?.slice(0, 8).map((article, i) => (
                <Link
                  key={article._id}
                  to={`/articles/${article.slug}`}
                  className="flex items-baseline gap-4 h-[42px] group"
                >
                  <span className="font-label text-xs text-gold-600 w-6 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-ink-900 group-hover:text-navy-700 truncate flex-1">
                    {article.title}
                  </span>
                  <span className="text-xs text-ink-500 shrink-0 hidden sm:block">
                    {article.pages || ''}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
