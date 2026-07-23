import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional stagger delay in seconds, useful for sequential sections. */
  delay?: number;
  className?: string;
}

/**
 * Subtle "fade + rise" reveal on scroll, used to bring homepage sections in
 * gently as the user scrolls past them. Fires once (`viewport.once`), so it
 * never re-triggers when scrolling back up. Respects users' reduced-motion
 * preference automatically via framer-motion's built-in handling combined
 * with the prefers-reduced-motion override in index.css.
 */
export default function Reveal({ children, delay = 0, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
