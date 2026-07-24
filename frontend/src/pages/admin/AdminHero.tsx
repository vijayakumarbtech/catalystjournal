import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Check, X, Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import { useAdminHeroes } from '@/lib/queries';
import type { Hero } from '@/types';

type HeroFormData = Omit<Hero, '_id' | 'createdAt' | 'updatedAt'>;

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
    <label className="flex items-center gap-2 cursor-pointer border border-dashed border-stone-300 rounded-lg px-4 py-3 hover:border-navy-600 transition-colors w-full justify-center">
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

export default function AdminHero() {
  const queryClient = useQueryClient();
  const { data: heroes, isLoading } = useAdminHeroes();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [heroImgUploading, setHeroImgUploading] = useState(false);
  const [bgImgUploading, setBgImgUploading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<HeroFormData>({
    defaultValues: {
      isEnabled: true,
      displayOrder: 0,
    }
  });

  const heroImageUrl = watch('heroImageUrl');
  const backgroundImageUrl = watch('backgroundImageUrl');

  const saveMutation = useMutation({
    mutationFn: async (data: HeroFormData) => {
      if (editingId) {
        await api.put(`/admin/heroes/${editingId}`, data);
      } else {
        await api.post('/admin/heroes', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-heroes'] });
      queryClient.invalidateQueries({ queryKey: ['heroes'] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/heroes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-heroes'] });
      queryClient.invalidateQueries({ queryKey: ['heroes'] });
    },
  });

  const handleEdit = (hero: Hero) => {
    setEditingId(hero._id);
    reset({
      heading: hero.heading,
      subtitle: hero.subtitle || '',
      description: hero.description || '',
      buttonText: hero.buttonText || '',
      buttonUrl: hero.buttonUrl || '',
      heroImageUrl: hero.heroImageUrl || '',
      backgroundImageUrl: hero.backgroundImageUrl || '',
      isEnabled: hero.isEnabled,
      displayOrder: hero.displayOrder,
    });
    setIsEditing(true);
  };

  const closeForm = () => {
    setIsEditing(false);
    setEditingId(null);
    reset({
      heading: '', subtitle: '', description: '', buttonText: '', buttonUrl: '', heroImageUrl: '', backgroundImageUrl: '', isEnabled: true, displayOrder: 0,
    });
  };

  const onSubmit = (data: HeroFormData) => {
    saveMutation.mutate(data);
  };

  const handleImageUpload = async (file: File | null, type: 'hero' | 'bg') => {
    if (!file) return;
    const isHero = type === 'hero';
    const setUploading = isHero ? setHeroImgUploading : setBgImgUploading;
    const endpoint = isHero ? '/admin/heroes/upload-image' : '/admin/heroes/upload-bg';
    const fieldName = isHero ? 'heroImage' : 'backgroundImage';
    const formField = isHero ? 'heroImageUrl' : 'backgroundImageUrl';

    setUploading(true);
    const formData = new FormData();
    formData.append(fieldName, file);

    try {
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValue(formField, data.data.url, { shouldDirty: true });
    } catch (err) {
      alert('Upload failed. Please check the file size and type.');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Hero Management</h1>
          <p className="mt-1 text-sm text-ink-600">
            Manage the hero sections displayed on the homepage.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              closeForm();
              setIsEditing(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            <Plus size={16} />
            Create Hero
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Hero' : 'Create Hero'}</h2>
            <button type="button" onClick={closeForm} className="text-stone-400 hover:text-stone-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Heading *</label>
                <input
                  {...register('heading', { required: 'Heading is required' })}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2 focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
                  placeholder="e.g. The Catalyst"
                />
                {errors.heading && <p className="text-red-500 text-xs mt-1">{errors.heading.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Subtitle (Eyebrow)</label>
                <input
                  {...register('subtitle')}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2 focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
                  placeholder="e.g. Peer-Reviewed • Open Access"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2 focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
                  placeholder="e.g. International Journal of Multidisciplinary Research..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Button Text</label>
                <input
                  {...register('buttonText')}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2 focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
                  placeholder="e.g. Submit Manuscript"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Button URL</label>
                <input
                  {...register('buttonUrl')}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2 focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
                  placeholder="e.g. /submit-paper"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 h-full">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('isEnabled')} className="w-4 h-4 text-navy-600 rounded border-stone-300 focus:ring-navy-500" />
                  <span className="text-sm font-medium text-ink-700">Enable this Hero</span>
                </label>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-ink-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    {...register('displayOrder', { valueAsNumber: true })}
                    className="w-full rounded-lg border border-stone-300 px-4 py-2 focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 border border-stone-200 p-4 rounded-xl">
              <label className="block text-sm font-medium text-ink-700">Hero Image (Foreground)</label>
              {heroImageUrl && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-stone-100 border border-stone-200 mb-3">
                  <img src={getImageUrl(heroImageUrl)} alt="Hero" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setValue('heroImageUrl', '')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              <UploadLabel busy={heroImgUploading} label="Upload Image" accept="image/*" onChange={(f) => handleImageUpload(f, 'hero')} />
            </div>

            <div className="space-y-2 border border-stone-200 p-4 rounded-xl">
              <label className="block text-sm font-medium text-ink-700">Background Image</label>
              {backgroundImageUrl && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-stone-100 border border-stone-200 mb-3">
                  <img src={getImageUrl(backgroundImageUrl)} alt="Background" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setValue('backgroundImageUrl', '')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              <UploadLabel busy={bgImgUploading} label="Upload Background" accept="image/*" onChange={(f) => handleImageUpload(f, 'bg')} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <button type="button" onClick={closeForm} className="px-4 py-2 text-sm font-medium text-ink-600 hover:bg-stone-50 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-navy-900 px-6 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
            >
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {editingId ? 'Save Changes' : 'Create Hero'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-ink-500 border-b border-stone-200">
              <tr>
                <th className="px-6 py-4 font-medium">Preview</th>
                <th className="px-6 py-4 font-medium">Heading</th>
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {heroes?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-ink-500">
                    No heroes found. Click "Create Hero" to add one.
                  </td>
                </tr>
              ) : (
                heroes?.map((hero) => (
                  <tr key={hero._id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-4">
                      {hero.heroImageUrl || hero.backgroundImageUrl ? (
                        <div className="w-16 h-10 rounded overflow-hidden bg-stone-100 flex items-center justify-center">
                          <img 
                            src={getImageUrl(hero.heroImageUrl || hero.backgroundImageUrl)} 
                            alt="Hero" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-10 rounded bg-stone-100 flex items-center justify-center text-stone-400">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-ink-900">
                      {hero.heading}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-xs font-medium text-ink-600">
                        {hero.displayOrder}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {hero.isEnabled ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(hero)}
                          className="p-1.5 text-stone-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this hero?')) {
                              deleteMutation.mutate(hero._id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
