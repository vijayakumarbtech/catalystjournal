import { useEffect } from 'react';
import { CalendarDays, Download, FileCheck } from 'lucide-react';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { Link } from 'react-router-dom';

// Content here is illustrative — an admin CMS section (Call for Papers)
// would drive these fields (deadline, topics, poster, CFP PDF) dynamically.
const importantDates = [
  { label: 'Submission Deadline', value: 'August 31, 2026' },
  { label: 'Notification of Acceptance', value: 'September 20, 2026' },
  { label: 'Camera-Ready Submission', value: 'September 30, 2026' },
  { label: 'Publication Date', value: 'October 15, 2026' },
];

const topics = [
  'Artificial Intelligence & Machine Learning',
  'Renewable Energy Systems',
  'Biomedical Engineering',
  'Sustainable Development',
  'Data Science & Analytics',
  'Social Sciences & Humanities',
  'Business & Management',
  'Environmental Studies',
];

export default function CallForPapers() {
  useEffect(() => {
    document.title = 'Call for Papers — The Catalyst';
  }, []);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Call for Papers' }]} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="eyebrow mb-2">Now Accepting Submissions</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Call for Papers</h1>
        <p className="text-ink-700 leading-relaxed max-w-2xl mb-12">
          The Catalyst invites original, unpublished research articles, review
          papers, and case studies for its upcoming volume. We welcome
          submissions from researchers, academics, and practitioners across
          all disciplines.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-14">
          <div className="lg:col-span-2">
            <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">
              Topics of Interest
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topics.map((t) => (
                <div key={t} className="flex items-start gap-2 text-sm text-ink-700">
                  <FileCheck size={16} className="text-gold-500 mt-0.5 shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-label text-sm uppercase tracking-wide text-ink-500 mb-4">
              Important Dates
            </h2>
            <div className="bg-paper-dim border border-stone-200 rounded-lg p-5 space-y-4">
              {importantDates.map((d) => (
                <div key={d.label} className="flex gap-3">
                  <CalendarDays size={18} className="text-navy-900 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-ink-500">{d.label}</div>
                    <div className="text-sm font-semibold text-navy-900">{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-14">
          <a
            href="/downloads/call-for-papers.pdf"
            className="btn-primary inline-flex items-center gap-2 border border-stone-300 text-ink-700 px-5 py-3 rounded hover:bg-stone-50 text-sm"
          >
            <Download size={16} /> Download CFP PDF
          </a>
          <a
            href="/downloads/cfp-poster.pdf"
            className="btn-primary inline-flex items-center gap-2 border border-stone-300 text-ink-700 px-5 py-3 rounded hover:bg-stone-50 text-sm"
          >
            <Download size={16} /> Download Poster
          </a>
        </div>

        <div className="bg-navy-900 rounded-lg p-8 text-center">
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
      </div>
    </>
  );
}
