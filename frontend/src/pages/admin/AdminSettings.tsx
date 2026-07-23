import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { UploadCloud, CheckCircle2, Trash2, ImagePlus, Loader2 } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import type { SiteSettings, ApiResponse } from '@/types';

const IMG_HINT =
  'Supported formats: PNG, JPG, JPEG, WEBP (SVG allowed for logo). Maximum size: 5 MB.';

// Reusable file input label component with consistent styling
function UploadLabel({
  busy,
  label,
  accept,
  onChange,
}: {
  busy: boolean;
  label: string;
  accept: string;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer border border-dashed border-stone-300 rounded-lg px-4 py-3 hover:border-navy-600 transition-colors">
      {busy ? <Loader2 size={18} className="text-ink-500 animate-spin" /> : <UploadCloud size={18} className="text-ink-500" />}
      <span className="text-sm text-ink-700">{busy ? 'Uploading…' : label}</span>
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        disabled={busy}
      />
    </label>
  );
}

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState('');
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroMsg, setHeroMsg] = useState('');
  const [heroAlt, setHeroAlt] = useState('');
  const [heroImages, setHeroImages] = useState<{ url: string; alt: string }[]>([]);
  const [saveMsg, setSaveMsg] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SiteSettings>>('/admin/settings');
      return data.data;
    },
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<SiteSettings>();
  const watchedLogoUrl = watch('logoUrl');

  useEffect(() => {
    if (settings) {
      reset(settings);
      setHeroImages(settings.heroImages ?? []);
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: SiteSettings) => api.put('/admin/settings', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setSaveMsg('Settings saved successfully.');
      setTimeout(() => setSaveMsg(''), 4000);
    },
  });

  // ── Logo upload ────────────────────────────────────────────────────────
  async function handleLogoUpload(file: File | null) {
    if (!file) return;
    const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
    if (!ALLOWED.has(file.type)) {
      setLogoMsg(`Error: ${IMG_HINT}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoMsg('Error: File must be under 5 MB.');
      return;
    }
    setLogoUploading(true);
    setLogoMsg('');
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await api.post('/admin/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // The server auto-persists logoUrl to Settings, so also update local form.
      setValue('logoUrl', data.data.url);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setLogoMsg('✓ Logo uploaded and saved successfully.');
    } catch (err: any) {
      setLogoMsg(`Error: ${err?.response?.data?.message || 'Upload failed.'}`);
    } finally {
      setLogoUploading(false);
    }
  }

  // ── Hero image upload ──────────────────────────────────────────────────
  async function handleHeroUpload(file: File | null) {
    if (!file) return;
    const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!ALLOWED.has(file.type)) {
      setHeroMsg(`Error: ${IMG_HINT.replace(' (SVG allowed for logo)', '')}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHeroMsg('Error: File must be under 5 MB.');
      return;
    }
    setHeroUploading(true);
    setHeroMsg('');
    try {
      const formData = new FormData();
      formData.append('heroImage', file);
      if (heroAlt) formData.append('alt', heroAlt);
      const { data } = await api.post('/admin/settings/hero-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newImg = { url: data.data.url, alt: heroAlt || 'Hero image' };
      setHeroImages((prev) => [...prev, newImg]);
      setHeroAlt('');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setHeroMsg('✓ Hero image uploaded successfully.');
      setTimeout(() => setHeroMsg(''), 3000);
    } catch (err: any) {
      setHeroMsg(`Error: ${err?.response?.data?.message || 'Upload failed.'}`);
    } finally {
      setHeroUploading(false);
    }
  }

  async function deleteHeroImage(url: string) {
    try {
      await api.delete('/admin/settings/hero-image', { data: { url } });
      setHeroImages((prev) => prev.filter((img) => img.url !== url));
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err: any) {
      setHeroMsg(`Error deleting image: ${err?.response?.data?.message || 'Failed.'}`);
    }
  }

  if (isLoading) return <div className="p-8 text-ink-500">Loading…</div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">Settings</h1>
      <p className="text-sm text-ink-500 mb-8">
        Manage branding, contact details, homepage content, and integrations.
        Payment gateway and SMTP keys are configured via environment variables for security.
      </p>

      <form onSubmit={handleSubmit((v) => { setSaveMsg(''); saveMutation.mutate(v); })} className="space-y-8">

        {/* ── Website Branding ─────────────────────────────────────── */}
        <section className="bg-white border border-stone-200 rounded-lg p-6 space-y-5">
          <h2 className="font-semibold text-navy-900">Website Branding</h2>

          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-2">Website Logo</label>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg border border-stone-200 bg-paper-dim flex items-center justify-center overflow-hidden shrink-0">
                {watchedLogoUrl ? (
                  <img
                    src={getImageUrl(watchedLogoUrl)}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-xs text-ink-500 text-center p-1">No logo</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <UploadLabel
                  busy={logoUploading}
                  label="Click to upload logo (PNG/JPG/WEBP/SVG, max 5 MB)"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                />
                {logoMsg && (
                  <p className={`text-xs ${logoMsg.startsWith('Error') ? 'text-crimson-600' : 'text-teal-700'}`}>
                    {logoMsg}
                  </p>
                )}
                <p className="text-xs text-ink-500">{IMG_HINT}</p>
                <input
                  {...register('logoUrl')}
                  placeholder="Or paste a logo URL here"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Website Title (Journal Name)</label>
            <input {...register('journalName')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Website Subtitle</label>
            <input
              {...register('subtitle')}
              placeholder="e.g. Intl. Journal of Research & Innovation"
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
            <p className="text-xs text-ink-500 mt-1">Shown below the journal name in the header.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Full Tagline</label>
            <input {...register('tagline')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            <p className="text-xs text-ink-500 mt-1">Used in the hero section and page metadata.</p>
          </div>
        </section>

        {/* ── Hero Images ────────────────────────────────────────────── */}
        <section className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ImagePlus size={18} className="text-navy-900" />
            <h2 className="font-semibold text-navy-900">Hero Section Images</h2>
          </div>
          <p className="text-xs text-ink-500">
            Upload images to replace the default hero photos. The first image
            fills the main banner; the second fills the smaller panel. Any
            extras are stored but not displayed until you remove others.
          </p>

          {/* Current hero images */}
          {heroImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {heroImages.map((img, i) => (
                <div key={img.url} className="relative rounded-lg overflow-hidden border border-stone-200 aspect-video bg-stone-100">
                  <img
                    src={getImageUrl(img.url)}
                    alt={img.alt || `Hero image ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.classList.add('bg-stone-200');
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => deleteHeroImage(img.url)}
                      className="bg-white text-crimson-600 rounded-full p-1.5 shadow hover:bg-crimson-600 hover:text-white transition-colors"
                      aria-label="Delete hero image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                    {img.alt || `Image ${i + 1}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload new hero image */}
          <div className="space-y-2">
            <input
              type="text"
              value={heroAlt}
              onChange={(e) => setHeroAlt(e.target.value)}
              placeholder="Image description (alt text) — optional"
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
            <UploadLabel
              busy={heroUploading}
              label="Click to upload hero image (PNG/JPG/WEBP, max 5 MB)"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleHeroUpload}
            />
            {heroMsg && (
              <p className={`text-xs ${heroMsg.startsWith('Error') ? 'text-crimson-600' : 'text-teal-700'}`}>
                {heroMsg}
              </p>
            )}
            <p className="text-xs text-ink-500">
              Supported formats: PNG, JPG, JPEG, WEBP. Maximum size: 5 MB.
            </p>
          </div>
        </section>

        {/* ── Journal Identity ──────────────────────────────────────── */}
        <section className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-navy-900">Journal Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">ISSN</label>
              <input {...register('issn')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Publication Frequency</label>
              <input {...register('frequency')} placeholder="Quarterly" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Language</label>
              <input {...register('language')} placeholder="English" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </section>

        {/* ── Homepage Hero Copy ───────────────────────────────────── */}
        <section className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-navy-900">Homepage Hero Text &amp; Buttons</h2>
          <p className="text-xs text-ink-500 -mt-2">Leave blank to use defaults.</p>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Eyebrow Text</label>
            <input {...register('hero.eyebrow')} placeholder="Peer-Reviewed · Open Access" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Hero Title</label>
            <input {...register('hero.title')} placeholder="The Catalyst" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Hero Subtitle</label>
            <textarea rows={2} {...register('hero.subtitle')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Primary Button Text</label>
              <input {...register('hero.primaryButtonText')} placeholder="Submit Your Paper" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Primary Button URL</label>
              <input {...register('hero.primaryButtonUrl')} placeholder="/submit-paper" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Secondary Button Text</label>
              <input {...register('hero.secondaryButtonText')} placeholder="Read Current Issue" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Secondary Button URL</label>
              <input {...register('hero.secondaryButtonUrl')} placeholder="/current-issue" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </section>

        {/* ── Announcement Bar ─────────────────────────────────────── */}
        <section className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-navy-900">Announcement Bar</h2>
          <label className="flex items-center gap-2 text-sm text-navy-900">
            <input type="checkbox" {...register('announcementBar.enabled')} />
            Show announcement bar at the top of every page
          </label>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Text</label>
            <input {...register('announcementBar.text')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Link URL (optional)</label>
            <input {...register('announcementBar.linkUrl')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
          </div>
        </section>

        {/* ── Contact Information ──────────────────────────────────── */}
        <section className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-navy-900">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Email</label>
              <input type="email" {...register('email')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Phone</label>
              <input {...register('phone')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Office Address</label>
            <textarea rows={2} {...register('address')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">WhatsApp Number</label>
            <input {...register('whatsappNumber')} placeholder="+91XXXXXXXXXX" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
          </div>
        </section>

        {/* ── Social Media ─────────────────────────────────────────── */}
        <section className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-navy-900">Social Media Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Facebook URL</label>
              <input {...register('socials.facebook')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Twitter / X URL</label>
              <input {...register('socials.twitter')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">LinkedIn URL</label>
              <input {...register('socials.linkedin')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Instagram URL</label>
              <input {...register('socials.instagram')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <section className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-navy-900">Footer</h2>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Copyright Text</label>
            <input
              {...register('footerCopyrightText')}
              placeholder={`© ${new Date().getFullYear()} The Catalyst. All rights reserved.`}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
            <p className="text-xs text-ink-500 mt-1">Leave blank for the auto-generated default.</p>
          </div>
        </section>

        {/* ── Journal Statistics ───────────────────────────────────── */}
        <section className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-navy-900">Journal Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Years of Publication</label>
              <input type="number" {...register('stats.yearsOfPublication', { valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Total Articles</label>
              <input type="number" {...register('stats.totalArticles', { valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Total Authors</label>
              <input type="number" {...register('stats.totalAuthors', { valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Countries Reached</label>
              <input type="number" {...register('stats.countriesReached', { valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Total Downloads</label>
              <input type="number" {...register('stats.totalDownloads', { valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </section>

        {/* ── Payment Methods ───────────────────────────────────────── */}
        <section className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-navy-900">Payment Methods</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Publication Fee (paise for INR)</label>
              <input type="number" {...register('publicationFeeAmount', { valueAsNumber: true })} placeholder="250000 = ₹2,500" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Currency</label>
              <input {...register('publicationFeeCurrency')} placeholder="INR" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-navy-900">
            <input type="checkbox" {...register('paymentMethods.razorpayEnabled')} />
            Enable Razorpay (Card / Debit / Net Banking / Wallet)
          </label>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">UPI ID</label>
            <input {...register('paymentMethods.upiId')} placeholder="journal@upi" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Google Pay Link</label>
              <input {...register('paymentMethods.googlePayLink')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">PhonePe Link</label>
              <input {...register('paymentMethods.phonePeLink')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Paytm Link</label>
              <input {...register('paymentMethods.paytmLink')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Stripe Payment Link</label>
              <input {...register('paymentMethods.stripeLink')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-navy-900 pt-2">Bank Account Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Account Name</label>
              <input {...register('paymentMethods.bankDetails.accountName')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Account Number</label>
              <input {...register('paymentMethods.bankDetails.accountNumber')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">IFSC Code</label>
              <input {...register('paymentMethods.bankDetails.ifscCode')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Bank Name</label>
              <input {...register('paymentMethods.bankDetails.bankName')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="btn-primary bg-navy-900 text-white px-6 py-3 rounded-lg hover:bg-navy-800 disabled:opacity-60 text-sm shadow-sm"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save All Settings'}
          </button>
          {saveMsg && (
            <p className="flex items-center gap-1.5 text-sm text-teal-700">
              <CheckCircle2 size={16} /> {saveMsg}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
