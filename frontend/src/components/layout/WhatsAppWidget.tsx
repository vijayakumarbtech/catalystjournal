import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '@/lib/queries';

const quickMessages = [
  { label: 'Paper Submission', text: 'Hello, I would like to ask about submitting a paper to The Catalyst.' },
  { label: 'General Enquiry', text: 'Hello, I have a question about The Catalyst journal.' },
  { label: 'Publication Status', text: 'Hello, I would like an update on the status of my publication.' },
  { label: 'Support', text: 'Hello, I need support regarding my submission.' },
];

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const { data: settings } = useSettings();
  const number = settings?.whatsappNumber?.replace(/\D/g, '') || '';

  if (!number) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="w-72 bg-white rounded-xl shadow-lifted border border-stone-200 overflow-hidden"
          >
            <div className="bg-teal-700 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-medium text-sm">Chat with us</span>
              <button onClick={() => setOpen(false)} aria-label="Close chat options">
                <X size={16} />
              </button>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {quickMessages.map((qm) => (
                <a
                  key={qm.label}
                  href={`https://wa.me/${number}?text=${encodeURIComponent(qm.text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-3 py-2.5 rounded-lg bg-paper-dim hover:bg-stone-200 text-ink-900 transition-colors"
                >
                  {qm.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open WhatsApp chat"
        className="w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-lifted transition-transform hover:scale-105"
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}
