import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { useFaqs } from '@/lib/queries';
import SectionHeading from '../common/SectionHeading';

export default function FaqPreview() {
  const { data: faqs, isLoading } = useFaqs();
  const [openId, setOpenId] = useState<string | null>(null);
  const preview = faqs?.slice(0, 5);

  return (
    <section className="py-20 bg-paper-dim">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Have Questions?" title="Frequently Asked Questions" align="center" />
        <div className="mt-10 divide-y divide-stone-200 border-y border-stone-200">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="py-4 h-6 bg-stone-100 animate-pulse rounded my-2" />
            ))}
          {preview?.map((faq) => {
            const isOpen = openId === faq._id;
            return (
              <div key={faq._id}>
                <button
                  onClick={() => setOpenId(isOpen ? null : faq._id)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-navy-900">{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-ink-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <p className="text-sm text-ink-700 leading-relaxed pb-5 pr-8">{faq.answer}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link to="/faq" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 hover:text-navy-700">
            View all FAQs <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
