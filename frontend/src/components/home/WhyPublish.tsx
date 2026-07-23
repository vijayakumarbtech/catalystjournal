import { Globe2, ShieldCheck, Zap, Users2 } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';

const reasons = [
  { icon: Globe2, title: 'Global Reach', description: 'Indexed and discoverable by researchers across 40+ countries.' },
  { icon: ShieldCheck, title: 'Rigorous Review', description: 'Every submission undergoes structured double-blind peer review.' },
  { icon: Zap, title: 'Fast Turnaround', description: 'Editorial decisions typically within 3–4 weeks of submission.' },
  { icon: Users2, title: 'Expert Editorial Board', description: 'Guided by academics and researchers across multiple disciplines.' },
];

export default function WhyPublish() {
  return (
    <section className="py-20 bg-paper-dim">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why Publish With Us"
          title="Built for Serious Researchers"
          align="center"
          description="We combine academic rigor with a fast, author-friendly process."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          {reasons.map((r) => (
            <div key={r.title} className="card-surface p-6">
              <div className="w-12 h-12 rounded-lg bg-navy-100 flex items-center justify-center mb-4">
                <r.icon className="text-navy-800" size={22} />
              </div>
              <h3 className="font-display font-bold text-navy-900 text-lg mb-2">{r.title}</h3>
              <p className="text-sm text-ink-700 leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
