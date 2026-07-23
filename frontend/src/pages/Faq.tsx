import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { useFaqs } from '@/lib/queries';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export default function Faq() {
  const { data: faqs, isLoading } = useFaqs();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FAQ — The Catalyst';
  }, []);

  const filtered = faqs?.filter(
    (f) =>
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.answer.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <Breadcrumbs items={[{ label: 'FAQ' }]} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Frequently Asked Questions</h1>
        <p className="text-ink-700 mb-8">
          Answers to common questions about submission, review, and publication.
        </p>

        <div className="relative mb-8">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            placeholder="Search questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-stone-300 rounded-lg pl-10 pr-4 py-3 text-sm bg-white shadow-card focus:border-navy-700 outline-none transition-colors"
          />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        <div className="card-surface divide-y divide-stone-200 overflow-hidden">
          {filtered?.map((faq) => {
            const isOpen = openId === faq._id;
            return (
              <div key={faq._id}>
                <button
                  onClick={() => setOpenId(isOpen ? null : faq._id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-5 text-left hover:bg-stone-50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-navy-900">{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-navy-700 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-ink-700 leading-relaxed px-5 pb-5 pr-10">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {filtered?.length === 0 && (
            <p className="py-8 text-center text-ink-500 text-sm">No matching questions found.</p>
          )}
        </div>
      </div>
    </>
  );
}
