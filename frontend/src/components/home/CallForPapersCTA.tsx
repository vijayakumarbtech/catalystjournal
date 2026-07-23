import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';

export default function CallForPapersCTA() {
  return (
    <section className="py-16 bg-gold-100 border-y border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-navy-900 text-gold-400 flex items-center justify-center shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <p className="eyebrow mb-1">Now Accepting Submissions</p>
              <h3 className="font-display text-xl font-bold text-navy-900">
                Call for Papers — Upcoming Volume
              </h3>
            </div>
          </div>
          <Link
            to="/call-for-papers"
            className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-6 py-3 rounded hover:bg-navy-800 transition-colors shrink-0"
          >
            View Details <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
