import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Settings as SettingsIcon } from 'lucide-react';
import { api } from '@/lib/api';
import type { FormField, ApiResponse } from '@/types';

type FormFieldValues = Omit<FormField, '_id' | 'isSystem'>;

export default function AdminFormFields() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<FormField | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { data: fields, isLoading } = useQuery({
    queryKey: ['admin', 'form-fields'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FormField[]>>('/admin/form-fields');
      return data.data;
    },
  });

  const { register, handleSubmit, reset, watch, control } = useForm<FormFieldValues>({
    defaultValues: {
      isEnabled: true,
      options: [],
      validation: {},
      width: 'full',
      order: 0,
    }
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: 'options' as never,
  });

  const fieldType = watch('type');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'form-fields'] });

  const createItem = useMutation({
    mutationFn: (values: FormFieldValues) => api.post('/admin/form-fields', values),
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Error creating field');
    }
  });

  const updateItem = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<FormFieldValues> }) => api.put(`/admin/form-fields/${id}`, values),
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Error updating field');
    }
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/form-fields/${id}`),
    onSuccess: invalidate,
  });

  const toggleEnabled = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) => api.put(`/admin/form-fields/${id}`, { isEnabled }),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => api.patch('/admin/form-fields/reorder', { ids }),
    onSuccess: invalidate,
  });

  function openEdit(item: FormField) {
    setEditingItem(item);
    reset({
      name: item.name,
      label: item.label,
      type: item.type,
      placeholder: item.placeholder || '',
      helpText: item.helpText || '',
      isRequired: item.isRequired,
      isEnabled: item.isEnabled,
      options: item.options || [],
      validation: item.validation || {},
      conditionalLogic: item.conditionalLogic || { dependsOn: '', value: '' },
      width: item.width,
      order: item.order,
    } as any);
  }

  function openAdd() {
    setIsAdding(true);
    reset({
      name: '',
      label: '',
      type: 'text',
      placeholder: '',
      helpText: '',
      isRequired: false,
      isEnabled: true,
      options: [],
      validation: {},
      conditionalLogic: { dependsOn: '', value: '' },
      width: 'full',
      order: (fields?.length || 0) * 10,
    } as any);
  }

  function closeModal() {
    setEditingItem(null);
    setIsAdding(false);
  }

  // HTML5 Drag and Drop Handlers
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to allow the drag image to generate before adding opacity
    setTimeout(() => {
      const el = document.getElementById(`field-${id}`);
      if (el) el.classList.add('opacity-50');
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId && fields) {
      const oldIndex = fields.findIndex((f) => f._id === draggedId);
      const newIndex = fields.findIndex((f) => f._id === targetId);
      
      const newFields = [...fields];
      const [movedItem] = newFields.splice(oldIndex, 1);
      newFields.splice(newIndex, 0, movedItem);
      
      reorder.mutate(newFields.map(f => f._id));
    }
    
    if (draggedId) {
      const el = document.getElementById(`field-${draggedId}`);
      if (el) el.classList.remove('opacity-50');
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    if (draggedId) {
      const el = document.getElementById(`field-${draggedId}`);
      if (el) el.classList.remove('opacity-50');
    }
    setDraggedId(null);
  };

  const needsOptions = ['select', 'radio', 'checkbox', 'multi-select'].includes(fieldType);
  const isFile = ['file_upload'].includes(fieldType);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Submission Form CMS</h1>
          <p className="text-sm text-ink-500">Manage dynamic fields for the author submission form.</p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary inline-flex items-center gap-1.5 text-sm bg-navy-900 text-white px-4 py-2 rounded hover:bg-navy-800"
        >
          <Plus size={16} /> New Field
        </button>
      </div>

      {isLoading && <p className="text-ink-500">Loading…</p>}

      <div className="bg-white border border-stone-200 rounded-lg">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-stone-50 border-b border-stone-200 text-xs font-semibold text-ink-500 uppercase tracking-wider">
          <div className="col-span-1">Drag</div>
          <div className="col-span-3">Label / Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Required</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-stone-100">
          {fields?.length === 0 && (
            <p className="px-4 py-6 text-sm text-ink-500 text-center">No fields yet.</p>
          )}
          {fields?.sort((a, b) => a.order - b.order).map((field) => (
            <div
              key={field._id}
              id={`field-${field._id}`}
              draggable
              onDragStart={(e) => handleDragStart(e, field._id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, field._id)}
              onDragEnd={handleDragEnd}
              className="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-stone-50/50 transition-colors"
            >
              <div className="col-span-1 cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600">
                <SettingsIcon size={18} />
              </div>
              <div className="col-span-3 min-w-0">
                <div className="font-medium text-navy-900 text-sm truncate flex items-center gap-2">
                  {field.label}
                  {field.isSystem && (
                    <span className="text-[10px] uppercase tracking-wider bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded">System</span>
                  )}
                </div>
                <div className="text-xs text-ink-500 truncate font-mono mt-0.5">{field.name}</div>
              </div>
              <div className="col-span-2 text-sm text-ink-600">
                {field.type}
              </div>
              <div className="col-span-2">
                <span className={`text-xs px-2 py-1 rounded-full ${field.isRequired ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                  {field.isRequired ? 'Required' : 'Optional'}
                </span>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-1.5 text-xs text-ink-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.isEnabled}
                    onChange={(e) => toggleEnabled.mutate({ id: field._id, isEnabled: e.target.checked })}
                    disabled={field.isSystem && field.isRequired} // Don't let them disable critical system fields
                    className="rounded border-stone-300 text-navy-600 focus:ring-navy-500 disabled:opacity-50"
                  />
                  {field.isEnabled ? 'Enabled' : 'Disabled'}
                </label>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2 text-ink-500">
                <button onClick={() => openEdit(field)} aria-label="Edit" className="hover:text-navy-900 p-1.5 rounded hover:bg-stone-100">
                  <Pencil size={16} />
                </button>
                {!field.isSystem && (
                  <button onClick={() => confirm(`Delete field "${field.label}"?`) && deleteItem.mutate(field._id)} aria-label="Delete" className="hover:text-crimson-600 p-1.5 rounded hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(editingItem || isAdding) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 sticky top-0 bg-white rounded-t-lg z-10">
              <h2 className="font-semibold text-navy-900">{editingItem ? 'Edit Field' : 'New Field'}</h2>
              <button type="button" onClick={closeModal} aria-label="Close"><X size={18} /></button>
            </div>
            
            <form
              onSubmit={handleSubmit((values) => {
                // Ensure options are an array of strings
                const mappedValues = {
                  ...values,
                  options: values.options?.map((opt: any) => typeof opt === 'string' ? opt : opt.value) || [],
                };
                
                if (editingItem) {
                  updateItem.mutate({ id: editingItem._id, values: mappedValues });
                } else if (isAdding) {
                  createItem.mutate(mappedValues as any);
                }
              })}
              className="p-6 space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wide border-b pb-2">Basic Info</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Label *</label>
                    <input {...register('label', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" placeholder="e.g. Previous Publication URL" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Unique Name / Key {editingItem?.isSystem ? '(System Field)' : '*'}</label>
                    <input 
                      {...register('name', { required: true })} 
                      className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono disabled:bg-stone-100 disabled:text-stone-500" 
                      placeholder="e.g. previous_pub_url"
                      disabled={editingItem?.isSystem}
                    />
                    <p className="text-xs text-ink-500 mt-1">Used as the JSON key in the database.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Field Type</label>
                    <select 
                      {...register('type')} 
                      className="w-full border border-stone-300 rounded px-3 py-2 text-sm disabled:bg-stone-100"
                      disabled={editingItem?.isSystem}
                    >
                      <option value="text">Text (Single Line)</option>
                      <option value="textarea">Textarea (Multi Line)</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone Number</option>
                      <option value="url">URL</option>
                      <option value="date">Date</option>
                      <option value="select">Dropdown (Select)</option>
                      <option value="radio">Radio Buttons</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="multi-select">Multi-Select</option>
                      <option value="file_upload">File Upload</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-navy-900 cursor-pointer">
                      <input type="checkbox" {...register('isRequired')} className="rounded border-stone-300 text-navy-600 focus:ring-navy-500 w-4 h-4" />
                      Required Field
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-navy-900 cursor-pointer">
                      <input type="checkbox" {...register('isEnabled')} className="rounded border-stone-300 text-navy-600 focus:ring-navy-500 w-4 h-4" />
                      Enabled
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Width</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" value="half" {...register('width')} /> Half Width
                      </label>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" value="full" {...register('width')} /> Full Width
                      </label>
                    </div>
                  </div>
                </div>

                {/* Display & Validation */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wide border-b pb-2">Display & Logic</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Placeholder</label>
                    <input {...register('placeholder')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Help Text</label>
                    <input {...register('helpText')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                  </div>

                  <div className="pt-2 border-t mt-4">
                    <label className="block text-sm font-medium text-navy-900 mb-1">Conditional Display (Optional)</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-xs text-ink-500 mb-1 block">Depends on Field (Name)</span>
                        <input {...register('conditionalLogic.dependsOn')} placeholder="e.g. subject" className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono" />
                      </div>
                      <div>
                        <span className="text-xs text-ink-500 mb-1 block">Has Value</span>
                        <input {...register('conditionalLogic.value')} placeholder="e.g. Other" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                      </div>
                    </div>
                  </div>

                  {isFile && (
                    <div className="pt-2 border-t mt-4">
                      <label className="block text-sm font-medium text-navy-900 mb-1">File Validation</label>
                      <div className="space-y-2 mt-2">
                        <div>
                          <span className="text-xs text-ink-500 mb-1 block">Allowed Mime Types (comma separated)</span>
                          <input 
                            {...register('validation.allowedTypes')} 
                            placeholder="e.g. application/pdf, image/png" 
                            className="w-full border border-stone-300 rounded px-3 py-2 text-sm" 
                            onChange={() => {
                              // Empty placeholder logic
                            }}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-ink-500 mb-1 block">Max Size (MB)</span>
                          <input type="number" {...register('validation.maxSize', { valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  {!isFile && !needsOptions && (
                    <div className="pt-2 border-t mt-4">
                      <label className="block text-sm font-medium text-navy-900 mb-1">Text Validation (Optional)</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-xs text-ink-500 mb-1 block">Min Length</span>
                          <input type="number" {...register('validation.minLength', { valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <span className="text-xs text-ink-500 mb-1 block">Max Length</span>
                          <input type="number" {...register('validation.maxLength', { valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Options for Select/Radio/Checkbox */}
              {needsOptions && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-navy-900 uppercase tracking-wide">Options</h3>
                    <button 
                      type="button" 
                      onClick={() => appendOption({ value: '' } as any)}
                      className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {optionFields.length === 0 && <p className="text-sm text-ink-500 italic">No options added yet.</p>}
                    {optionFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-center">
                        <input 
                          {...register(`options.${index}.value` as any, { required: true })} 
                          defaultValue={(field as any).value || field}
                          className="flex-1 border border-stone-300 rounded px-3 py-2 text-sm" 
                          placeholder="Option value"
                        />
                        <button type="button" onClick={() => removeOption(index)} className="p-2 text-stone-400 hover:text-crimson-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-ink-600 hover:bg-stone-50 rounded">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createItem.isPending || updateItem.isPending}
                  className="btn-primary bg-navy-900 text-white px-6 py-2 rounded hover:bg-navy-800 text-sm disabled:opacity-50"
                >
                  {createItem.isPending || updateItem.isPending ? 'Saving…' : 'Save Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
