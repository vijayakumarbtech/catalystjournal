import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FacebookIcon, TwitterIcon, LinkedinIcon, InstagramIcon } from '@/components/common/SocialIcons';
import { useState, useEffect } from 'react';
import { useSettings, useNav } from '@/lib/queries';
import { api } from '@/lib/api';
import type { NavItemType } from '@/types';

const DEFAULT_QUICK_LINKS: NavItemType[] = [
  { _id: 'q1', location: 'footer-quick', label: 'Current Issue', path: '/current-issue', order: 1, enabled: true, children: [] },
  { _id: 'q2', location: 'footer-quick', label: 'Archives', path: '/archives', order: 2, enabled: true, children: [] },
  { _id: 'q3', location: 'footer-quick', label: 'Call for Papers', path: '/call-for-papers', order: 3, enabled: true, children: [] },
  { _id: 'q4', location: 'footer-quick', label: 'News', path: '/news', order: 4, enabled: true, children: [] },
  { _id: 'q5', location: 'footer-quick', label: 'Submit Paper', path: '/submit-paper', order: 5, enabled: true, children: [] },
];

const DEFAULT_POLICY_LINKS: NavItemType[] = [
  { _id: 'p1', location: 'footer-policies', label: 'Submission Guidelines', path: '/submission-guidelines', order: 1, enabled: true, children: [] },
  { _id: 'p2', location: 'footer-policies', label: 'Publication Ethics', path: '/publication-ethics', order: 2, enabled: true, children: [] },
  { _id: 'p3', location: 'footer-policies', label: 'FAQ', path: '/faq', order: 3, enabled: true, children: [] },
];

export default function Footer() {
  const { data: settings } = useSettings();
  const { data: nav } = useNav();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [settings?.logoUrl]);

  const quickLinks = (nav && nav.some((n) => n.location === 'footer-quick')
    ? nav.filter((n) => n.location === 'footer-quick')
    : DEFAULT_QUICK_LINKS
  ).sort((a, b) => a.order - b.order);

  const policyLinks = (nav && nav.some((n) => n.location === 'footer-policies')
    ? nav.filter((n) => n.location === 'footer-policies')
    : DEFAULT_POLICY_LINKS
  ).sort((a, b) => a.order - b.order);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      await api.post('/newsletter/subscribe', { email });
      setStatus('sent');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              {settings?.logoUrl && !logoError ? (
                <img
                  src={settings.logoUrl}
                  alt={`${settings?.journalName || 'The Catalyst'} logo`}
                  className="h-10 w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-navy-800 border-2 border-gold-500 flex items-center justify-center">
                  <span className="font-display text-gold-400 font-bold">C</span>
                </div>
              )}
              <div className="font-display text-lg font-bold text-white">
                {settings?.journalName || 'The Catalyst'}
              </div>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
              {settings?.tagline || 'International Journal of Multidisciplinary Research and Innovation'}
            </p>
            <div className="mt-5 space-y-2 text-sm text-stone-400">
              {settings?.address && (
                <div className="flex gap-2 items-start">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-gold-500" />
                  <span>{settings.address}</span>
                </div>
              )}
              {settings?.email && (
                <div className="flex gap-2 items-center">
                  <Mail size={16} className="text-gold-500" />
                  <a href={`mailto:${settings.email}`} className="hover:text-white">
                    {settings.email}
                  </a>
                </div>
              )}
              {settings?.phone && (
                <div className="flex gap-2 items-center">
                  <Phone size={16} className="text-gold-500" />
                  <a href={`tel:${settings.phone}`} className="hover:text-white">
                    {settings.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-label text-xs uppercase tracking-wider text-gold-500 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((link) => (
                <li key={link._id}>
                  <Link to={link.path || '/'} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-label text-xs uppercase tracking-wider text-gold-500 mb-4">
              Policies
            </h4>
            <ul className="space-y-2.5 text-sm">
              {policyLinks.map((link) => (
                <li key={link._id}>
                  <Link to={link.path || '/'} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-label text-xs uppercase tracking-wider text-gold-500 mb-4">
              Stay Updated
            </h4>
            <p className="text-sm text-stone-400 mb-3">
              Get new-issue alerts and call-for-papers announcements.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                required
                placeholder="you@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-navy-900 border border-navy-700 rounded px-3 py-2 text-sm text-white placeholder:text-stone-500 focus:border-gold-500 outline-none"
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn-primary bg-gold-500 text-navy-950 rounded px-3 py-2 text-sm hover:bg-gold-400 transition-colors disabled:opacity-60"
              >
                {status === 'sent' ? 'Subscribed ✓' : status === 'sending' ? 'Subscribing…' : 'Subscribe'}
              </button>
              {status === 'error' && (
                <p className="text-xs text-red-400">Something went wrong. Try again.</p>
              )}
            </form>
            <div className="flex gap-3 mt-5">
              {settings?.socials?.facebook && (
                <a href={settings.socials.facebook} aria-label="Facebook" className="hover:text-gold-400">
                  <FacebookIcon width={18} height={18} />
                </a>
              )}
              {settings?.socials?.twitter && (
                <a href={settings.socials.twitter} aria-label="Twitter" className="hover:text-gold-400">
                  <TwitterIcon width={18} height={18} />
                </a>
              )}
              {settings?.socials?.linkedin && (
                <a href={settings.socials.linkedin} aria-label="LinkedIn" className="hover:text-gold-400">
                  <LinkedinIcon width={18} height={18} />
                </a>
              )}
              {settings?.socials?.instagram && (
                <a href={settings.socials.instagram} aria-label="Instagram" className="hover:text-gold-400">
                  <InstagramIcon width={18} height={18} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-stone-500">
          <span>
            {settings?.footerCopyrightText
              ? settings.footerCopyrightText
              : `© ${year} ${settings?.journalName || 'The Catalyst'}. All rights reserved.${settings?.issn ? ` ISSN: ${settings.issn}` : ''}`}
          </span>
          <Link to="/admin/login" className="hover:text-stone-300">
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
