import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { CallForPaper, ApiResponse } from '@/types';

type FormValues = Omit<CallForPaper, '_id' | 'createdAt' | 'topics'> & {
  topics: { value: string }[];
};

export default function AdminCallForPapers() {
  const [cfps, setCfps] = useState<CallForPaper[]>([]);
  const [editing, setEditing] = useState<CallForPaper | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      topics: [{ value: '' }],
      isActive: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'topics',
  });

  const fetchCfps = async () => {
    try {
      const { data } = await api.get<ApiResponse<CallForPaper[]>>('/admin/cfps');
      setCfps(data.data);
    } catch (err) {
      console.error('Error fetching CFPs:', err);
    }
  };

  useEffect(() => {
    fetchCfps();
  }, []);

  function openCreate() {
    setEditing(null);
    reset({
      title: '',
      subtitle: '',
      description: '',
      scope: '',
      topics: [{ value: '' }],
      submissionDeadline: '',
      acceptanceDate: '',
      publicationDate: '',
      instructions: '',
      posterUrl: '',
      pdfUrl: '',
      brochureUrl: '',
      isActive: false,
    });
    setIsFormOpen(true);
  }

  function openEdit(cfp: CallForPaper) {
    setEditing(cfp);
    reset({
      ...cfp,
      topics: cfp.topics && cfp.topics.length > 0 ? cfp.topics.map(t => ({ value: t })) : [{ value: '' }],
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
  }

  async function handleFileUpload(file: File, endpoint: string, fieldName: keyof FormValues) {
    const formData = new FormData();
    formData.append(endpoint === 'upload-poster' ? 'poster' : endpoint === 'upload-pdf' ? 'cfpPdf' : 'brochure', file);
    try {
      const { data } = await api.post<ApiResponse<{ url: string }>>(`/admin/cfps/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValue(fieldName, data.data.url, { shouldDirty: true });
      alert('File uploaded successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    }
  }

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        topics: data.topics.map(t => t.value).filter(Boolean),
      };

      if (editing) {
        await api.put(`/admin/cfps/${editing._id}`, payload);
      } else {
        await api.post('/admin/cfps', payload);
      }
      await fetchCfps();
      closeForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save Call for Papers.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteCfp(id: string) {
    if (!confirm('Are you sure you want to delete this Call for Papers?')) return;
    try {
      await api.delete(`/admin/cfps/${id}`);
      await fetchCfps();
    } catch (err) {
      console.error(err);
      alert('Failed to delete.');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Call for Papers</h1>
        {!isFormOpen && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Create New
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="bg-white rounded-lg shadow border border-stone-200 p-6">
          <h2 className="text-lg font-bold mb-4">{editing ? 'Edit' : 'Create'} Call for Papers</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input {...register('title', { required: true })} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Subtitle</label>
                <input {...register('subtitle')} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea {...register('description')} rows={3} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Scope</label>
                <textarea {...register('scope')} rows={3} className="w-full border rounded px-3 py-2" />
              </div>

              {/* Topics */}
              <div className="md:col-span-2 bg-stone-50 p-4 rounded-lg border border-stone-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">Topics of Interest</label>
                  <button type="button" onClick={() => append({ value: '' })} className="text-sm text-gold-600 hover:text-gold-700">
                    + Add Topic
                  </button>
                </div>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <input {...register(`topics.${index}.value`)} className="flex-1 border rounded px-3 py-2 text-sm" placeholder="Enter topic" />
                      <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-sm font-medium mb-1">Submission Deadline</label>
                <input {...register('submissionDeadline')} className="w-full border rounded px-3 py-2" placeholder="e.g. August 31, 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Acceptance Date</label>
                <input {...register('acceptanceDate')} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Publication Date</label>
                <input {...register('publicationDate')} className="w-full border rounded px-3 py-2" />
              </div>

              {/* Files */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-stone-200 p-4 rounded">
                  <label className="block text-sm font-medium mb-2">CFP PDF</label>
                  <input type="text" {...register('pdfUrl')} readOnly className="w-full border rounded px-3 py-2 text-xs text-stone-500 bg-stone-50 mb-2" placeholder="No file uploaded" />
                  <input type="file" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'upload-pdf', 'pdfUrl')} className="text-sm w-full" />
                </div>
                <div className="border border-stone-200 p-4 rounded">
                  <label className="block text-sm font-medium mb-2">Poster (PDF/Image)</label>
                  <input type="text" {...register('posterUrl')} readOnly className="w-full border rounded px-3 py-2 text-xs text-stone-500 bg-stone-50 mb-2" placeholder="No file uploaded" />
                  <input type="file" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'upload-poster', 'posterUrl')} className="text-sm w-full" />
                </div>
                <div className="border border-stone-200 p-4 rounded">
                  <label className="block text-sm font-medium mb-2">Brochure (PDF)</label>
                  <input type="text" {...register('brochureUrl')} readOnly className="w-full border rounded px-3 py-2 text-xs text-stone-500 bg-stone-50 mb-2" placeholder="No file uploaded" />
                  <input type="file" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'upload-brochure', 'brochureUrl')} className="text-sm w-full" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Instructions / Notes</label>
                <textarea {...register('instructions')} rows={2} className="w-full border rounded px-3 py-2" />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" {...register('isActive')} className="rounded text-gold-600 focus:ring-gold-500 w-4 h-4" />
                  Make Active (will deactivate others)
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-stone-100">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving...' : 'Save Call for Papers'}
              </button>
              <button type="button" onClick={closeForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-stone-200">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Deadline</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cfps.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                    No Call for Papers found.
                  </td>
                </tr>
              ) : (
                cfps.map((cfp) => (
                  <tr key={cfp._id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-navy-900">{cfp.title}</td>
                    <td className="px-4 py-3 text-stone-600">{cfp.submissionDeadline || '-'}</td>
                    <td className="px-4 py-3">
                      {cfp.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs">
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-stone-500 bg-stone-100 px-2 py-1 rounded text-xs">
                          <XCircle size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(cfp)} className="text-blue-600 hover:text-blue-800 p-1">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteCfp(cfp._id)} className="text-red-600 hover:text-red-800 p-1">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
