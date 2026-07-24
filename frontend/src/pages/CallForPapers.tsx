import { useEffect } from 'react';
import { CalendarDays, Download, FileCheck, Info } from 'lucide-react';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { Link } from 'react-router-dom';
import { useActiveCfp } from '@/lib/queries';

export default function CallForPapers() {
  const { data: cfp, isLoading } = useActiveCfp();

  useEffect(() => {
    document.title = 'Call for Papers — The Catalyst';
  }, []);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Call for Papers' }]} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="animate-pulse space-y-8">
            <div className="h-4 bg-stone-200 w-32 rounded"></div>
            <div className="h-10 bg-stone-200 w-64 rounded"></div>
            <div className="h-20 bg-stone-200 rounded"></div>
          </div>
        ) : !cfp ? (
          <div className="text-center py-20">
            <Info className="mx-auto text-ink-300 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-navy-900 mb-2">No Active Call for Papers</h2>
            <p className="text-ink-600">There are currently no active call for papers available. Please check back later.</p>
          </div>
        ) : (
          <>
            {cfp.subtitle && <p className="eyebrow mb-2">{cfp.subtitle}</p>}
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{cfp.title}</h1>
            
            {(cfp.description || cfp.scope) && (
              <div className="text-ink-700 leading-relaxed max-w-3xl mb-12 space-y-4">
                {cfp.description && <p>{cfp.description}</p>}
                {cfp.scope && <p>{cfp.scope}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-14">
              <div className="lg:col-span-2">
                {cfp.topics && cfp.topics.length > 0 && (
                  <>
                    <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">
                      Topics of Interest
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cfp.topics.map((t) => (
                        <div key={t} className="flex items-start gap-2 text-sm text-ink-700">
                          <FileCheck size={16} className="text-gold-500 mt-0.5 shrink-0" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {cfp.instructions && (
                  <div className="mt-10">
                    <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">
                      Instructions
                    </h2>
                    <p className="text-sm text-ink-700 whitespace-pre-line bg-stone-50 p-4 rounded-lg border border-stone-200">
                      {cfp.instructions}
                    </p>
                  </div>
                )}
              </div>

              <div>
                {(cfp.submissionDeadline || cfp.acceptanceDate || cfp.publicationDate) && (
                  <>
                    <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">
                      Important Dates
                    </h2>
                    <div className="bg-paper-dim border border-stone-200 rounded-lg p-5 space-y-4">
                      {cfp.submissionDeadline && (
                        <div className="flex gap-3">
                          <CalendarDays size={18} className="text-navy-900 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs text-ink-500">Submission Deadline</div>
                            <div className="text-sm font-semibold text-navy-900">{cfp.submissionDeadline}</div>
                          </div>
                        </div>
                      )}
                      {cfp.acceptanceDate && (
                        <div className="flex gap-3">
                          <CalendarDays size={18} className="text-navy-900 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs text-ink-500">Acceptance Notification Date</div>
                            <div className="text-sm font-semibold text-navy-900">{cfp.acceptanceDate}</div>
                          </div>
                        </div>
                      )}
                      {cfp.publicationDate && (
                        <div className="flex gap-3">
                          <CalendarDays size={18} className="text-navy-900 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs text-ink-500">Publication Date</div>
                            <div className="text-sm font-semibold text-navy-900">{cfp.publicationDate}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {(cfp.pdfUrl || cfp.posterUrl || cfp.brochureUrl) && (
              <div className="flex flex-wrap gap-4 mb-14">
                {cfp.pdfUrl && (
                  <a
                    href={cfp.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2 border border-stone-300 text-ink-700 px-5 py-3 rounded hover:bg-stone-50 text-sm"
                  >
                    <Download size={16} /> Download CFP PDF
                  </a>
                )}
                {cfp.posterUrl && (
                  <a
                    href={cfp.posterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2 border border-stone-300 text-ink-700 px-5 py-3 rounded hover:bg-stone-50 text-sm"
                  >
                    <Download size={16} /> Download Poster
                  </a>
                )}
                {cfp.brochureUrl && (
                  <a
                    href={cfp.brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2 border border-stone-300 text-ink-700 px-5 py-3 rounded hover:bg-stone-50 text-sm"
                  >
                    <Download size={16} /> Download Brochure
                  </a>
                )}
              </div>
            )}

            <div className="bg-navy-900 rounded-lg p-8 text-center mt-12">
              <h3 className="font-display text-xl font-bold text-white mb-2">
                Ready to submit your research?
              </h3>
              <p className="text-stone-300 text-sm mb-6 max-w-md mx-auto">
                Prepare your manuscript per our author guidelines, then submit online.
              </p>
              <Link
                to="/submit-paper"
                className="btn-primary inline-flex items-center gap-2 bg-gold-500 text-navy-950 px-6 py-3 rounded hover:bg-gold-400 text-sm"
              >
                Submit Paper
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
