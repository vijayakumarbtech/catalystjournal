import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';

const editorialPolicies = [
  { title: 'Peer Review Policy', to: '/peer-review-policy' },
  { title: 'Publication Ethics & Malpractice Statement', to: '/publication-ethics' },
  { title: 'Open Access Statement & Publishing', to: '/open-access-statement' },
];

const particulars: [string, string][] = [
  ['Title', 'The Catalyst: An International Multidisciplinary Journal of Social Sciences and Humanities'],
  ['Frequency', 'Bi-Monthly'],
  ['ISSN', 'Applied For'],
  ['Publisher & Editor', 'Lt. Dr. B. Ajantha (Editor-in-Chief)'],
  ['Copyright', '© 2026 The Catalyst. All rights reserved.'],
  ['Starting Year', '2026'],
  ['Subject', 'Social Sciences and Humanities (Multidisciplinary)'],
  ['Language', 'English'],
  ['Publication Format', 'Online'],
  ['Phone No.', '+91 95667 16554'],
  ['Email ID', 'catalystjournal2026@gmail.com'],
  ['Website', 'thecatalystjournals.com'],
  ['Address', 'Chidambaram - 608 001, Tamil Nadu, India'],
  ['ORCID iD', 'To Be Confirmed'],
];

export default function AboutJournalSection() {
  return (
    <section className="py-20 bg-paper-dim">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="About the Journal" title="About, Scope & Editorial Policies" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12">
          {/* Left column: About / Scope / Aims & Objectives / Editorial Policies */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h3 className="font-display font-bold text-xl text-navy-900 mb-3">About</h3>
              <p className="text-ink-700 leading-relaxed">
                The Catalyst: An International Multidisciplinary Journal of Social Sciences and
                Humanities is a peer-reviewed, open-access journal dedicated to publishing
                original research across the social sciences and humanities. The journal
                provides a scholarly platform for researchers, academicians, and practitioners to
                disseminate high-quality, methodologically sound, and critically engaged
                scholarship in fields including — but not limited to — literature, language
                studies, history, sociology, education, and cultural studies.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-xl text-navy-900 mb-3">Scope</h3>
              <p className="text-ink-700 leading-relaxed">
                The Catalyst welcomes submissions across the full breadth of the social sciences
                and humanities, including literature and language studies, history, sociology,
                education, cultural studies, philosophy, and interdisciplinary approaches that
                engage critically with contemporary and historical questions in these fields.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-xl text-navy-900 mb-3">Aim and Objectives</h3>
              <p className="text-ink-700 leading-relaxed mb-3">
                The Catalyst aims to promote interdisciplinary dialogue and critical inquiry
                within the social sciences and humanities. Its core objectives are to:
              </p>
              <ul className="list-disc list-inside text-ink-700 leading-relaxed space-y-1.5">
                <li>Provide a rigorous, peer-reviewed platform for original scholarly research.</li>
                <li>Promote high-quality empirical, methodological, and critical scholarship.</li>
                <li>Encourage interdisciplinary engagement across the social sciences and humanities.</li>
                <li>Support early-career and established researchers in disseminating their work.</li>
                <li>Ensure open, free access to published research for readers worldwide.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-xl text-navy-900 mb-3">Editorial Policies</h3>
              <div className="grid sm:grid-cols-1 gap-3">
                {editorialPolicies.map((p) => (
                  <Link
                    key={p.to}
                    to={p.to}
                    className="card-surface flex items-center justify-between px-5 py-4 group"
                  >
                    <span className="font-semibold text-navy-900">{p.title}</span>
                    <ArrowRight
                      size={16}
                      className="text-navy-700 group-hover:translate-x-1 transition-transform shrink-0 ml-3"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Journal Particulars */}
          <div>
            <h3 className="font-display font-bold text-xl text-navy-900 mb-3">Journal Particulars</h3>
            <div className="card-surface p-6">
              <dl className="divide-y divide-stone-200">
                {particulars.map(([label, value]) => (
                  <div key={label} className="py-3 first:pt-0 last:pb-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                      {label}
                    </dt>
                    <dd className="text-sm text-ink-900 mt-1 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
