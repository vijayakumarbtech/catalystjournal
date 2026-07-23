import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Megaphone } from 'lucide-react';
import { useNews } from '@/lib/queries';
import { getImageUrl } from '@/lib/api';
import SectionHeading from '../common/SectionHeading';
import { CardSkeleton } from '../common/Skeleton';

// Homepage preview of the News & Announcements page — shows the 3 most
// recent posts. Reuses the existing public /news endpoint (no backend or
// routing changes required).
export default function LatestNewsPreview() {
  const { data: news, isLoading } = useNews();
  const latest = news?.slice(0, 3) ?? [];

  if (!isLoading && latest.length === 0) return null;

  return (
    <section className="py-20 bg-paper-dim">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <SectionHeading eyebrow="Stay Informed" title="News & Announcements" />
          <Link
            to="/news"
            className="btn-primary inline-flex items-center gap-2 text-navy-900 font-semibold hover:text-navy-700 shrink-0"
          >
            View all news <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}

          {latest.map((item) => (
            <Link
              key={item._id}
              to={`/news/${item.slug}`}
              className="card-surface group flex flex-col overflow-hidden"
            >
              <div className="aspect-[16/9] bg-stone-100 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-navy-300">
                    <Megaphone size={28} />
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 text-xs text-ink-500 mb-2">
                  <Calendar size={12} />
                  <time dateTime={item.publishedAt}>
                    {new Date(item.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <h3 className="font-display text-base font-bold text-navy-900 leading-snug mb-2 group-hover:text-navy-700 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-ink-700 leading-relaxed line-clamp-2 flex-1">
                  {item.body.replace(/<[^>]+>/g, '')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
