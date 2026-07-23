import { FileText, Users, CheckCircle, Award } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';

const steps = [
  {
    icon: FileText,
    title: 'Submit Manuscript',
    description: 'Prepare your paper per our formatting guidelines and submit it online along with the copyright form.',
  },
  {
    icon: Users,
    title: 'Peer Review',
    description: 'Your submission undergoes rigorous double-blind review by subject-matter experts on our editorial board.',
  },
  {
    icon: CheckCircle,
    title: 'Revision & Acceptance',
    description: 'Address reviewer feedback where needed. Once approved, your paper is accepted for publication.',
  },
  {
    icon: Award,
    title: 'Publication',
    description: 'Your paper is assigned a DOI, published in the upcoming issue, and you receive a certificate of publication.',
  },
];

export default function PublicationProcess() {
  return (
    <section className="py-20 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How It Works"
          title="Publication Process"
          align="center"
          description="A transparent, four-stage path from manuscript to publication."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">
          {steps.map((step, i) => (
            <div key={step.title} className="group relative text-center">
              <div className="w-16 h-16 rounded-full bg-navy-900 text-gold-400 flex items-center justify-center mx-auto mb-5 shadow-card">
                <step.icon size={26} />
              </div>
              <div className="eyebrow mb-1">Step {i + 1}</div>
              <h3 className="font-display font-bold text-lg text-navy-900 mb-2">{step.title}</h3>
              <p className="text-sm text-ink-700 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
