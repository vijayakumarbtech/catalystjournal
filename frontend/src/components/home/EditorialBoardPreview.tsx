import { Link } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';
import { useEditorialBoard } from '@/lib/queries';
import SectionHeading from '../common/SectionHeading';
import ImageWithFallback from '../common/ImageWithFallback';

export default function EditorialBoardPreview() {
  const { data: members, isLoading } = useEditorialBoard();
  const preview = members?.slice().sort((a, b) => a.order - b.order);

  return (
    <section className="py-20 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <SectionHeading eyebrow="Meet the Board" title="Editorial Board" />
          <Link
            to="/editorial-board"
            className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 hover:text-navy-700 shrink-0"
          >
            View full board <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center animate-pulse">
                  <div className="w-24 h-24 rounded-full bg-stone-200 mx-auto mb-3" />
                  <div className="h-4 w-3/4 bg-stone-200 rounded mx-auto mb-2" />
                  <div className="h-3 w-1/2 bg-stone-200 rounded mx-auto" />
                </div>
              ))
            : preview?.map((m) => (
                <div key={m._id} className="group text-center">
                  <div className="w-24 h-24 rounded-full bg-navy-100 mx-auto mb-3 overflow-hidden border-2 border-stone-200 transition-colors duration-300 group-hover:border-navy-600">
                    <ImageWithFallback
                      src={m.photoUrl}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      fallback={
                        <div className="w-full h-full flex items-center justify-center bg-navy-900 text-gold-400">
                          <User size={32} />
                        </div>
                      }
                    />
                  </div>
                  <h4 className="font-display font-bold text-sm text-navy-900">{m.name}</h4>
                  <p className="text-xs text-ink-500 mt-1">{m.designation}</p>
                  <p className="text-xs text-ink-500">{m.university}</p>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
