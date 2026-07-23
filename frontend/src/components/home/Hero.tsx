import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Globe2,
  FileCheck,
} from 'lucide-react';
import { useSettings } from '@/lib/queries';

export default function Hero() {
  const { data: settings } = useSettings();
  const hero = settings?.hero;

  const eyebrow =
    hero?.eyebrow ||
    (settings?.issn
      ? `ISSN ${settings.issn} • Peer-Reviewed • Open Access`
      : 'Peer-Reviewed • Open Access');

  const title = hero?.title || settings?.journalName || 'The Catalyst';

  const subtitle =
    hero?.subtitle ||
    `${
      settings?.tagline ||
      'International Journal of Multidisciplinary Research and Innovation'
    } dedicated to publishing high-quality, peer-reviewed research that advances scientific knowledge and academic excellence worldwide.`;

  const primaryText = hero?.primaryButtonText || 'Submit Manuscript';
  const primaryUrl = hero?.primaryButtonUrl || '/submit-paper';

  const secondaryText = hero?.secondaryButtonText || 'Current Issue';
  const secondaryUrl = hero?.secondaryButtonUrl || '/current-issue';

  return (
    <section className="relative overflow-hidden bg-navy-900">
      {/* Background Texture */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent, transparent 60px, rgba(255,255,255,0.03) 60px, rgba(255,255,255,0.03) 61px)',
        }}
      />

      {/* Softer Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <p className="inline-flex items-center rounded-full border border-gold-500/20 bg-white/5 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-gold-400">
            {eyebrow}
          </p>

          {/* Title */}
          <h1 className="mt-4 max-w-6xl mx-auto text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] text-white">
            {title}
          </h1>

          {/* Divider */}
          <div className="w-20 h-px bg-gold-500/60 mx-auto my-4" />

          {/* Subtitle */}
          <p className="max-w-5xl mx-auto text-sm md:text-base lg:text-lg leading-7 text-stone-300">
            {subtitle}
          </p>

          {/* Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={primaryUrl}
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-navy-950 transition-all duration-300 hover:bg-gold-400"
            >
              {primaryText}
              <ArrowRight size={16} />
            </Link>

            <Link
              to={secondaryUrl}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-2.5 text-sm text-white transition-all duration-300 hover:bg-white/10"
            >
              <BookOpen size={16} />
              {secondaryText}
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl border border-white/15 bg-white/[0.06] p-4 transition-all duration-300 hover:border-gold-500/30 hover:bg-white/[0.08]">
              <ShieldCheck className="mx-auto h-7 w-7 text-gold-400" />

              <h3 className="mt-3 text-base font-semibold text-white">
                Rigorous Peer Review
              </h3>

              <p className="mt-2 text-[13px] leading-6 text-stone-400">
                
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/[0.06] p-4 transition-all duration-300 hover:border-gold-500/30 hover:bg-white/[0.08]">
              <Globe2 className="mx-auto h-7 w-7 text-gold-400" />

              <h3 className="mt-3 text-base font-semibold text-white">
                Global Research Network
              </h3>

              <p className="mt-2 text-[13px] leading-6 text-stone-400">
                
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/[0.06] p-4 transition-all duration-300 hover:border-gold-500/30 hover:bg-white/[0.08]">
              <FileCheck className="mx-auto h-7 w-7 text-gold-400" />

              <h3 className="mt-3 text-base font-semibold text-white">
                Ethical Publishing
              </h3>

              <p className="mt-2 text-[13px] leading-6 text-stone-400">
                
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}