import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UploadCloud, FileCheck2, Loader2, Info } from 'lucide-react';
import { apiUpload } from '@/lib/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import type { SubmissionFormValues } from '@/types';

const subjects = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biomedical Sciences',
  'Management & Commerce',
  'Social Sciences & Humanities',
  'Environmental Sciences',
  'Other',
];

const ACCEPTED_DOC_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const MOBILE_PATTERN = /^[\d\s+()-]{7,20}$/;

export default function SubmitPaper() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SubmissionFormValues>();
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [copyrightFile, setCopyrightFile] = useState<File | null>(null);
  const [manuscriptFileError, setManuscriptFileError] = useState('');
  const [copyrightFileError, setCopyrightFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    document.title = 'Submit Paper — The Catalyst';
  }, []);

  function validateDocFile(file: File | null, setFileError: (msg: string) => void): boolean {
    if (!file) return true;
    if (!ACCEPTED_DOC_TYPES.has(file.type)) {
      setFileError('Only PDF, DOC, or DOCX files are accepted.');
      return false;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFileError('File must be under 15MB.');
      return false;
    }
    setFileError('');
    return true;
  }

  function handleManuscriptChange(file: File | null) {
    if (validateDocFile(file, setManuscriptFileError)) {
      setManuscriptFile(file);
    } else {
      setManuscriptFile(null);
    }
  }

  function handleCopyrightChange(file: File | null) {
    if (validateDocFile(file, setCopyrightFileError)) {
      setCopyrightFile(file);
    } else {
      setCopyrightFile(null);
    }
  }

  async function onSubmit(values: SubmissionFormValues) {
    setSubmitError('');

    let hasFileError = false;
    if (!manuscriptFile) {
      setManuscriptFileError('Please upload your manuscript (PDF, DOC, or DOCX).');
      hasFileError = true;
    }
    if (hasFileError) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.append(key, value ?? ''));
      formData.append('manuscript', manuscriptFile as File);
      if (copyrightFile) formData.append('copyrightForm', copyrightFile);

      const { data } = await apiUpload.post('/submissions', formData);
      // Move to the payment step with the newly created submission's ID.
      navigate(`/submit-paper/payment/${data.data._id}`, {
        state: { trackingId: data.data.trackingId, amount: data.data.amount },
      });
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors as Record<string, string> | undefined;
      if (serverErrors) {
        Object.entries(serverErrors).forEach(([field, message]) => {
          if (field === 'manuscript') {
            setManuscriptFileError(message);
          } else {
            setError(field as keyof SubmissionFormValues, { type: 'server', message });
          }
        });
        setSubmitError('Please correct the highlighted fields and try again.');
      } else {
        setSubmitError(
          err?.response?.data?.message || 'Something went wrong while submitting. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Submit Paper' }]} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Submit Your Paper</h1>
        <p className="text-ink-700 mb-6">
          Complete the form below. After submission, you'll be directed to
          make the publication fee payment to finalize your submission.
        </p>

        <div className="flex items-start gap-3 bg-info-100 border border-info-500/30 rounded-lg px-4 py-3.5 mb-10">
          <Info size={18} className="text-info-600 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-700">
            Please review our{' '}
            <Link to="/submission-guidelines" className="text-info-600 font-medium hover:underline">
              submission guidelines
            </Link>{' '}
            before uploading — manuscripts that don't follow the required
            format may be sent back for revision.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10 text-xs font-label uppercase tracking-wide">
          <span className="flex items-center gap-1.5 text-navy-900 font-semibold">
            <span className="w-5 h-5 rounded-full bg-navy-900 text-white flex items-center justify-center text-[10px]">1</span>
            Details & Upload
          </span>
          <span className="flex-1 h-px bg-stone-300" />
          <span className="flex items-center gap-1.5 text-ink-500">
            <span className="w-5 h-5 rounded-full bg-stone-300 text-white flex items-center justify-center text-[10px]">2</span>
            Payment
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
          <fieldset className="space-y-5">
            <legend className="font-label text-sm uppercase tracking-wide text-ink-500 mb-2">
              Author Information
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Author Name *</label>
                <input {...register('authorName', { required: 'Author name is required.' })} className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm" />
                {errors.authorName && <p className="text-xs text-crimson-600 mt-1">{errors.authorName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Co-Author(s)</label>
                <input {...register('coAuthors')} placeholder="Comma separated" className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email address is required.',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
                  })}
                  className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm"
                />
                {errors.email && <p className="text-xs text-crimson-600 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  {...register('phone', {
                    required: 'Mobile number is required.',
                    pattern: { value: MOBILE_PATTERN, message: 'Enter a valid mobile number.' },
                  })}
                  placeholder="+91 98765 43210"
                  className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm"
                />
                {errors.phone && <p className="text-xs text-crimson-600 mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Institution / Organization *</label>
                <input {...register('institution', { required: 'Institution is required.' })} className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm" />
                {errors.institution && <p className="text-xs text-crimson-600 mt-1">{errors.institution.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Department</label>
                <input {...register('department')} className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Country *</label>
                <input {...register('country', { required: 'Country is required.' })} className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm" />
                {errors.country && <p className="text-xs text-crimson-600 mt-1">{errors.country.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">ORCID iD</label>
                <input
                  {...register('orcid', {
                    pattern: { value: ORCID_PATTERN, message: 'Format: 0000-0002-1825-0097' },
                  })}
                  placeholder="0000-0002-1825-0097"
                  className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm"
                />
                {errors.orcid && <p className="text-xs text-crimson-600 mt-1">{errors.orcid.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Subject Area *</label>
                <select {...register('subject', { required: 'Subject area is required.' })} className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm bg-white">
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.subject && <p className="text-xs text-crimson-600 mt-1">{errors.subject.message}</p>}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="font-label text-sm uppercase tracking-wide text-ink-500 mb-2">
              Paper Details
            </legend>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">Paper Title *</label>
              <input {...register('paperTitle', { required: 'Paper title is required.' })} className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm" />
              {errors.paperTitle && <p className="text-xs text-crimson-600 mt-1">{errors.paperTitle.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">Abstract *</label>
              <textarea rows={5} {...register('abstract', { required: 'Abstract is required.' })} className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm resize-none" />
              {errors.abstract && <p className="text-xs text-crimson-600 mt-1">{errors.abstract.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">Keywords *</label>
              <input {...register('keywords', { required: 'Keywords are required.' })} placeholder="Comma separated" className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm" />
              {errors.keywords && <p className="text-xs text-crimson-600 mt-1">{errors.keywords.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">Additional Comments</label>
              <textarea rows={3} {...register('message')} className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm resize-none" />
            </div>
          </fieldset>

          <fieldset className="space-y-5">
            <legend className="font-label text-sm uppercase tracking-wide text-ink-500 mb-2">
              File Upload
            </legend>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-2">Upload Manuscript (PDF/DOC/DOCX) *</label>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-lg py-8 cursor-pointer hover:border-gold-500 focus-within:border-navy-600 focus-within:shadow-glow transition-all">
                {manuscriptFile ? (
                  <>
                    <FileCheck2 className="text-teal-600" size={28} />
                    <span className="text-sm text-ink-900">{manuscriptFile.name}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="text-ink-500" size={28} />
                    <span className="text-sm text-ink-500">Click to upload PDF, DOC, or DOCX (max 15MB)</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => handleManuscriptChange(e.target.files?.[0] || null)}
                />
              </label>
              {manuscriptFileError && <p className="text-xs text-crimson-600 mt-1">{manuscriptFileError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-2">Upload Copyright Form (optional at this stage)</label>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-lg py-6 cursor-pointer hover:border-gold-500 focus-within:border-navy-600 focus-within:shadow-glow transition-all">
                {copyrightFile ? (
                  <>
                    <FileCheck2 className="text-teal-600" size={22} />
                    <span className="text-sm text-ink-900">{copyrightFile.name}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="text-ink-500" size={22} />
                    <span className="text-sm text-ink-500">Click to upload signed copyright form (PDF/DOC/DOCX)</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => handleCopyrightChange(e.target.files?.[0] || null)}
                />
              </label>
              {copyrightFileError && <p className="text-xs text-crimson-600 mt-1">{copyrightFileError}</p>}
            </div>
          </fieldset>

          {submitError && <p className="text-sm text-crimson-600">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-navy-900 text-white px-8 py-3.5 rounded hover:bg-navy-800 disabled:opacity-60 text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Submitting…
              </>
            ) : (
              'Continue to Payment'
            )}
          </button>
        </form>
      </div>
    </>
  );
}
