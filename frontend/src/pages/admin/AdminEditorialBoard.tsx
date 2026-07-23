import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, UploadCloud, Loader2, User } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import type { EditorialMember, ApiResponse } from '@/types';

type FormValues = Omit<EditorialMember, '_id'>;

const IMG_HINT = 'Supported formats: PNG, JPG, JPEG, WEBP. Maximum size: 5 MB.';

export default function AdminEditorialBoard() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditorialMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ['admin', 'editorial-board'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EditorialMember[]>>('/admin/editorial-board');
      return data.data;
    },
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>();
  const watchedPhotoUrl = watch('photoUrl');

  async function uploadPhotoToMember(memberId: string, file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await api.post(`/admin/editorial-board/${memberId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.url as string;
  }

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editing) {
        return api.put(`/admin/editorial-board/${editing._id}`, values);
      }
      const res = await api.post('/admin/editorial-board', values);
      const newMember = res.data.data;
      if (pendingPhotoFile) {
        try {
          await uploadPhotoToMember(newMember._id, pendingPhotoFile);
        } catch {
          // Member created; photo can be added later via Edit.
        }
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'editorial-board'] });
      queryClient.invalidateQueries({ queryKey: ['editorial-board'] });
      setShowForm(false);
      setEditing(null);
      setPhotoPreview('');
      setPhotoMsg('');
      setPendingPhotoFile(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/editorial-board/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'editorial-board'] });
      queryClient.invalidateQueries({ queryKey: ['editorial-board'] });
    },
  });

  function openNew() {
    setEditing(null);
    setPhotoPreview('');
    setPhotoMsg('');
    setPendingPhotoFile(null);
    reset({ role: 'editorial-board', order: (members?.length || 0) + 1 } as FormValues);
    setShowForm(true);
  }

  function openEdit(m: EditorialMember) {
    setEditing(m);
    setPhotoPreview(m.photoUrl || '');
    setPhotoMsg('');
    setPendingPhotoFile(null);
    reset(m);
    setShowForm(true);
  }

  async function handlePhotoUpload(file: File | null) {
    if (!file) return;
    const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!ALLOWED.has(file.type)) {
      setPhotoMsg(`Error: ${IMG_HINT}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMsg('Error: File must be under 5 MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
    setPhotoMsg('');

    if (editing) {
      setPhotoUploading(true);
      try {
        const url = await uploadPhotoToMember(editing._id, file);
        setValue('photoUrl', url);
        setPhotoPreview(url);
        queryClient.invalidateQueries({ queryKey: ['admin', 'editorial-board'] });
        setPhotoMsg('✓ Photo uploaded and saved.');
      } catch (err: any) {
        setPhotoMsg(`Error: ${err?.response?.data?.message || 'Upload failed.'}`);
        setPhotoPreview(editing.photoUrl || '');
      } finally {
        setPhotoUploading(false);
      }
    } else {
      setPendingPhotoFile(file);
      setPhotoMsg('✓ Photo selected. It will be uploaded when you save.');
    }
  }

  const displayPhoto = photoPreview || watchedPhotoUrl || '';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Editorial Board</h1>
          <p className="text-sm text-ink-500">Add, edit, or remove editorial board members.</p>
        </div>
        <button
          onClick={openNew}
          className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-lg hover:bg-navy-800 text-sm shadow-sm"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Photo</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Designation</th>
              <th className="text-left px-4 py-3">University</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && <tr><td colSpan={6} className="text-center py-10 text-ink-500">Loading…</td></tr>}
            {members?.map((m) => (
              <tr key={m._id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3">
                  {m.photoUrl ? (
                    <img
                      src={getImageUrl(m.photoUrl)}
                      alt={m.name}
                      className="w-9 h-9 rounded-full object-cover border border-stone-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-900">
                      <User size={16} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-navy-900">{m.name}</td>
                <td className="px-4 py-3">{m.designation}</td>
                <td className="px-4 py-3">{m.university}, {m.country}</td>
                <td className="px-4 py-3 text-xs">{m.role}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-ink-500">
                    <button onClick={() => openEdit(m)} aria-label="Edit" className="hover:text-navy-900">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => confirm('Remove this member?') && deleteMutation.mutate(m._id)}
                      aria-label="Delete"
                      className="hover:text-crimson-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">{editing ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="p-6 space-y-4">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">Profile Photo</label>
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-full border border-stone-200 bg-paper-dim flex items-center justify-center overflow-hidden shrink-0">
                    {displayPhoto ? (
                      <img
                        src={displayPhoto}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <User size={22} className="text-ink-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer border border-dashed border-stone-300 rounded-lg px-3 py-2.5 hover:border-navy-600 transition-colors">
                      {photoUploading
                        ? <Loader2 size={16} className="text-ink-500 animate-spin" />
                        : <UploadCloud size={16} className="text-ink-500" />}
                      <span className="text-xs text-ink-700">
                        {photoUploading ? 'Uploading…' : 'Upload photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
                        disabled={photoUploading}
                      />
                    </label>
                    {photoMsg && (
                      <p className={`text-xs ${photoMsg.startsWith('Error') ? 'text-crimson-600' : 'text-teal-700'}`}>
                        {photoMsg}
                      </p>
                    )}
                    <p className="text-xs text-ink-500">{IMG_HINT}</p>
                    <input
                      {...register('photoUrl')}
                      placeholder="Or paste photo URL here"
                      className="w-full border border-stone-300 rounded px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Name</label>
                <input {...register('name', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Designation</label>
                <input {...register('designation', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Qualification</label>
                <input {...register('qualification', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">University</label>
                  <input {...register('university', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Country</label>
                  <input {...register('country', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Role</label>
                <select {...register('role')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm bg-white">
                  <option value="editor-in-chief">Editor-in-Chief</option>
                  <option value="associate-editor">Associate Editor</option>
                  <option value="editorial-board">Editorial Board Member</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Email</label>
                  <input type="email" {...register('email')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">LinkedIn URL</label>
                  <input {...register('linkedin')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Display Order</label>
                <input type="number" {...register('order', { valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <button
                type="submit"
                disabled={saveMutation.isPending || photoUploading}
                className="btn-primary w-full bg-navy-900 text-white px-4 py-2.5 rounded-lg hover:bg-navy-800 disabled:opacity-60 text-sm shadow-sm"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
