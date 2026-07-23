import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FacebookIcon, TwitterIcon, LinkedinIcon, InstagramIcon } from '@/components/common/SocialIcons';
import { useSettings } from '@/lib/queries';
import { api } from '@/lib/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const { data: settings } = useSettings();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>();
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  useEffect(() => {
    document.title = 'Contact — The Catalyst';
  }, []);

  async function onSubmit(values: ContactForm) {
    try {
      await api.post('/contact', values);
      setStatus('sent');
      reset();
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Contact' }]} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-ink-700 mb-12 max-w-2xl">
          Have a question about submission, review status, or partnerships?
          Reach out — we typically respond within one business day.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-4">
              <MapPin className="text-gold-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-navy-900 text-sm mb-1">Office Address</h3>
                <p className="text-sm text-ink-700">{settings?.address || 'Address available soon.'}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Mail className="text-gold-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-navy-900 text-sm mb-1">Email</h3>
                <a href={`mailto:${settings?.email}`} className="text-sm text-ink-700 hover:text-navy-900">
                  {settings?.email}
                </a>
              </div>
            </div>
            <div className="flex gap-4">
              <Phone className="text-gold-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-navy-900 text-sm mb-1">Phone</h3>
                <a href={`tel:${settings?.phone}`} className="text-sm text-ink-700 hover:text-navy-900">
                  {settings?.phone}
                </a>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              {settings?.socials?.facebook && (
                <a href={settings.socials.facebook} className="w-9 h-9 rounded-full bg-paper-dim flex items-center justify-center text-ink-700 hover:bg-navy-900 hover:text-white transition-colors">
                  <FacebookIcon width={16} height={16} />
                </a>
              )}
              {settings?.socials?.twitter && (
                <a href={settings.socials.twitter} className="w-9 h-9 rounded-full bg-paper-dim flex items-center justify-center text-ink-700 hover:bg-navy-900 hover:text-white transition-colors">
                  <TwitterIcon width={16} height={16} />
                </a>
              )}
              {settings?.socials?.linkedin && (
                <a href={settings.socials.linkedin} className="w-9 h-9 rounded-full bg-paper-dim flex items-center justify-center text-ink-700 hover:bg-navy-900 hover:text-white transition-colors">
                  <LinkedinIcon width={16} height={16} />
                </a>
              )}
              {settings?.socials?.instagram && (
                <a href={settings.socials.instagram} className="w-9 h-9 rounded-full bg-paper-dim flex items-center justify-center text-ink-700 hover:bg-navy-900 hover:text-white transition-colors">
                  <InstagramIcon width={16} height={16} />
                </a>
              )}
            </div>

            <div className="aspect-video rounded-lg overflow-hidden border border-stone-200 mt-6">
              <iframe
                title="Office location map"
                width="100%"
                height="100%"
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(settings?.address || 'India')}&output=embed`}
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-stone-200 rounded-lg shadow-card p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Name</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm"
                  />
                  {errors.name && <p className="text-xs text-crimson-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Email</label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm"
                  />
                  {errors.email && <p className="text-xs text-crimson-600 mt-1">{errors.email.message}</p>}
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Subject</label>
                <input
                  {...register('subject', { required: 'Subject is required' })}
                  className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm"
                />
                {errors.subject && <p className="text-xs text-crimson-600 mt-1">{errors.subject.message}</p>}
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Message</label>
                <textarea
                  rows={5}
                  {...register('message', { required: 'Message is required' })}
                  className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm resize-none"
                />
                {errors.message && <p className="text-xs text-crimson-600 mt-1">{errors.message.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary bg-navy-900 text-white px-6 py-3 rounded hover:bg-navy-800 disabled:opacity-60 text-sm"
              >
                {isSubmitting ? 'Sending…' : 'Send Message'}
              </button>
              {status === 'sent' && <p className="text-sm text-teal-700 mt-3">Message sent — we'll be in touch soon.</p>}
              {status === 'error' && <p className="text-sm text-crimson-600 mt-3">Something went wrong. Please try again.</p>}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
