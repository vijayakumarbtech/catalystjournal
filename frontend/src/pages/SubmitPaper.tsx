import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { UploadCloud, FileCheck2, Loader2, Info } from 'lucide-react';
import { api, apiUpload } from '@/lib/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import type { FormField, ApiResponse } from '@/types';

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const MOBILE_PATTERN = /^[\d\s+()-]{7,20}$/;

export default function SubmitPaper() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm();
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch form fields from API
  const { data: fields, isLoading: fieldsLoading } = useQuery({
    queryKey: ['public', 'form-fields'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FormField[]>>('/form-fields');
      return data.data;
    },
  });

  useEffect(() => {
    document.title = 'Submit Paper — The Catalyst';
  }, []);

  const formValues = watch(); // Watch all fields for conditional logic

  const activeFields = fields
    ?.filter((f) => f.isEnabled)
    .sort((a, b) => a.order - b.order) || [];

  async function onSubmit(values: any) {
    setSubmitError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      
      for (const field of activeFields) {
        // Skip conditionally hidden fields
        if (field.conditionalLogic?.dependsOn) {
          const dependentValue = values[field.conditionalLogic.dependsOn];
          if (dependentValue !== field.conditionalLogic.value) {
            continue;
          }
        }

        const value = values[field.name];
        
        if (field.type === 'file_upload') {
          if (value && value[0]) {
            formData.append(field.name, value[0]);
          }
        } else {
          formData.append(field.name, value ?? '');
        }
      }

      const { data } = await apiUpload.post('/submissions', formData);
      // Move to the payment step with the newly created submission's ID.
      navigate(`/submit-paper/payment/${data.data._id}`, {
        state: { trackingId: data.data.trackingId, amount: data.data.amount },
      });
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors as Record<string, string> | undefined;
      if (serverErrors) {
        Object.entries(serverErrors).forEach(([field, message]) => {
          setError(field, { type: 'server', message });
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

  function getValidationRules(field: FormField) {
    const rules: any = {};
    if (field.isRequired) {
      rules.required = `${field.label} is required.`;
    }
    
    if (field.name === 'email' || field.type === 'email') {
      rules.pattern = { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' };
    } else if (field.name === 'phone' || field.type === 'phone') {
      rules.pattern = { value: MOBILE_PATTERN, message: 'Enter a valid mobile number.' };
    } else if (field.name === 'orcid') {
      rules.pattern = { value: ORCID_PATTERN, message: 'Format: 0000-0002-1825-0097' };
    }
    
    if (field.validation?.minLength) rules.minLength = { value: field.validation.minLength, message: `Minimum length is ${field.validation.minLength}` };
    if (field.validation?.maxLength) rules.maxLength = { value: field.validation.maxLength, message: `Maximum length is ${field.validation.maxLength}` };

    if (field.type === 'file_upload') {
      rules.validate = (value: any) => {
        if (field.isRequired && (!value || value.length === 0)) return `${field.label} is required.`;
        if (value && value.length > 0) {
          const file = value[0];
          if (field.validation?.maxSize && file.size > field.validation.maxSize * 1024 * 1024) {
            return `File must be under ${field.validation.maxSize}MB.`;
          }
          // Accept string mapping (e.g., "application/pdf, image/png" -> array of strings)
          if (field.validation?.allowedTypes && field.validation.allowedTypes.length > 0) {
             const typesStr = (field.validation.allowedTypes as unknown as string);
             if (typeof typesStr === 'string' && typesStr.trim()) {
               const allowed = typesStr.split(',').map(s => s.trim());
               if (!allowed.includes(file.type)) {
                 return `Allowed file types: ${allowed.join(', ')}`;
               }
             }
          } else if (field.name === 'manuscript' || field.name === 'copyrightForm') {
            const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowed.includes(file.type)) {
              return 'Only PDF, DOC, or DOCX files are accepted.';
            }
          }
        }
        return true;
      };
    }

    return rules;
  }

  const renderField = (field: FormField) => {
    // Check conditional logic
    if (field.conditionalLogic?.dependsOn) {
      const dependentValue = formValues[field.conditionalLogic.dependsOn];
      if (dependentValue !== field.conditionalLogic.value) {
        return null;
      }
    }

    const fieldError = errors[field.name];
    const widthClass = field.width === 'half' ? 'col-span-1' : 'col-span-1 sm:col-span-2';

    if (field.type === 'file_upload') {
      const fileValue = formValues[field.name];
      const selectedFile = fileValue && fileValue.length > 0 ? fileValue[0] : null;

      return (
        <div key={field._id} className={widthClass}>
          <label className="block text-sm font-medium text-navy-900 mb-2">
            {field.label} {field.isRequired && '*'}
          </label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-lg py-8 cursor-pointer hover:border-gold-500 focus-within:border-navy-600 focus-within:shadow-glow transition-all">
            {selectedFile ? (
              <>
                <FileCheck2 className="text-teal-600" size={28} />
                <span className="text-sm text-ink-900 text-center px-4">{selectedFile.name}</span>
              </>
            ) : (
              <>
                <UploadCloud className="text-ink-500" size={28} />
                <span className="text-sm text-ink-500 text-center px-4">Click to upload {field.validation?.maxSize ? `(max ${field.validation.maxSize}MB)` : ''}</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              {...register(field.name, getValidationRules(field))}
            />
          </label>
          {field.helpText && <p className="text-xs text-ink-500 mt-1.5">{field.helpText}</p>}
          {fieldError && <p className="text-xs text-crimson-600 mt-1">{fieldError.message as string}</p>}
        </div>
      );
    }

    return (
      <div key={field._id} className={widthClass}>
        <label className="block text-sm font-medium text-navy-900 mb-1.5">
          {field.label} {field.isRequired && '*'}
        </label>
        
        {field.type === 'textarea' ? (
          <textarea 
            rows={4} 
            placeholder={field.placeholder}
            {...register(field.name, getValidationRules(field))} 
            className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm resize-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500" 
          />
        ) : field.type === 'select' ? (
          <select 
            {...register(field.name, getValidationRules(field))} 
            className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm bg-white focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : field.type === 'radio' ? (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-ink-700">
                <input 
                  type="radio" 
                  value={opt} 
                  {...register(field.name, getValidationRules(field))} 
                  className="w-4 h-4 text-navy-600 border-stone-300 focus:ring-navy-500"
                />
                {opt}
              </label>
            ))}
          </div>
        ) : (
          <input 
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text'}
            placeholder={field.placeholder}
            {...register(field.name, getValidationRules(field))} 
            className="w-full border border-stone-300 rounded px-3 py-2.5 text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500" 
          />
        )}
        
        {field.helpText && <p className="text-xs text-ink-500 mt-1.5">{field.helpText}</p>}
        {fieldError && <p className="text-xs text-crimson-600 mt-1">{fieldError.message as string}</p>}
      </div>
    );
  };

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

        {fieldsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-navy-500" size={32} />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8 bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-stone-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
              {activeFields.map(renderField)}
            </div>

            {submitError && <p className="text-sm text-crimson-600 bg-crimson-50 p-3 rounded-lg border border-crimson-100">{submitError}</p>}

            <div className="pt-6 border-t border-stone-100 mt-8">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 bg-navy-900 text-white px-8 py-3.5 rounded hover:bg-navy-800 disabled:opacity-60 text-base font-medium shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Submitting…
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
