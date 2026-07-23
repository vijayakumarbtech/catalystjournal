import { useSettings } from '@/lib/queries';

export default function StatsBar() {
  const { data: settings } = useSettings();
  const stats = settings?.stats;

  const items = [
    { label: 'Years of Publication', value: stats?.yearsOfPublication },
    { label: 'Published Articles', value: stats?.totalArticles },
    { label: 'Contributing Authors', value: stats?.totalAuthors },
    { label: 'Countries Reached', value: stats?.countriesReached },
    { label: 'Total Downloads', value: stats?.totalDownloads },
  ];

  return (
    <section className="bg-paper-dim border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold text-navy-900">
                {item.value !== undefined ? item.value.toLocaleString() + '+' : '—'}
              </div>
              <div className="font-label text-xs uppercase tracking-wide text-ink-500 mt-1">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
