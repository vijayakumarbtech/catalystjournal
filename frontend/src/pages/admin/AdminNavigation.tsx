import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { NavItemType, ApiResponse } from '@/types';

type ItemFormValues = { label: string; path: string };

const LOCATIONS: { key: NavItemType['location']; title: string; description: string }[] = [
  { key: 'header', title: 'Header Menu', description: 'Main navigation bar. The one item with sub-pages renders as a dropdown.' },
  { key: 'footer-quick', title: 'Footer — Quick Links', description: 'The "Quick Links" column in the site footer.' },
  { key: 'footer-policies', title: 'Footer — Policies', description: 'The "Policies" column in the site footer.' },
];

export default function AdminNavigation() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<NavItemType | null>(null);
  const [addingToLocation, setAddingToLocation] = useState<NavItemType['location'] | null>(null);
  const [addingChildTo, setAddingChildTo] = useState<NavItemType | null>(null);
  const [editingChild, setEditingChild] = useState<{ parent: NavItemType; childId: string; label: string; path: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin', 'nav'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<NavItemType[]>>('/admin/nav');
      return data.data;
    },
  });

  const { register, handleSubmit, reset } = useForm<ItemFormValues>();
  const childForm = useForm<ItemFormValues>();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'nav'] });

  const createItem = useMutation({
    mutationFn: (values: ItemFormValues & { location: NavItemType['location'] }) => api.post('/admin/nav', values),
    onSuccess: () => {
      invalidate();
      setAddingToLocation(null);
      reset();
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ItemFormValues }) => api.put(`/admin/nav/${id}`, values),
    onSuccess: () => {
      invalidate();
      setEditingItem(null);
      reset();
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/nav/${id}`),
    onSuccess: invalidate,
  });

  const toggleEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.put(`/admin/nav/${id}`, { enabled }),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: 'up' | 'down' }) =>
      api.patch(`/admin/nav/${id}/reorder`, { direction }),
    onSuccess: invalidate,
  });

  const addChild = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ItemFormValues }) => api.post(`/admin/nav/${id}/children`, values),
    onSuccess: () => {
      invalidate();
      setAddingChildTo(null);
      childForm.reset();
    },
  });

  const updateChild = useMutation({
    mutationFn: ({ id, childId, values }: { id: string; childId: string; values: ItemFormValues }) =>
      api.put(`/admin/nav/${id}/children/${childId}`, values),
    onSuccess: () => {
      invalidate();
      setEditingChild(null);
    },
  });

  const deleteChild = useMutation({
    mutationFn: ({ id, childId }: { id: string; childId: string }) => api.delete(`/admin/nav/${id}/children/${childId}`),
    onSuccess: invalidate,
  });

  function openEdit(item: NavItemType) {
    setEditingItem(item);
    reset({ label: item.label, path: item.path || '' });
  }

  function openAdd(location: NavItemType['location']) {
    setAddingToLocation(location);
    reset({ label: '', path: '' });
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">Navigation</h1>
      <p className="text-sm text-ink-500 mb-8">
        Reorder, rename, or enable/disable menu items. Changes reflect on the site immediately.
      </p>

      {isLoading && <p className="text-ink-500">Loading…</p>}

      {LOCATIONS.map((loc) => {
        const locationItems = (items || [])
          .filter((i) => i.location === loc.key)
          .sort((a, b) => a.order - b.order);

        return (
          <section key={loc.key} className="mb-10">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-navy-900">{loc.title}</h2>
              <button
                onClick={() => openAdd(loc.key)}
                className="btn-primary inline-flex items-center gap-1.5 text-xs bg-navy-900 text-white px-3 py-1.5 rounded hover:bg-navy-800"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            <p className="text-xs text-ink-500 mb-4">{loc.description}</p>

            <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100">
              {locationItems.length === 0 && (
                <p className="px-4 py-6 text-sm text-ink-500 text-center">No items yet.</p>
              )}
              {locationItems.map((item) => (
                <div key={item._id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {item.children.length > 0 && (
                      <button
                        onClick={() => setExpanded((e) => ({ ...e, [item._id]: !e[item._id] }))}
                        aria-label="Toggle sub-menu"
                        className="text-ink-500"
                      >
                        <ChevronRight
                          size={16}
                          className={`transition-transform ${expanded[item._id] ? 'rotate-90' : ''}`}
                        />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-navy-900 text-sm truncate">{item.label}</div>
                      <div className="text-xs text-ink-500 truncate">{item.path || '(dropdown parent)'}</div>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-ink-500 shrink-0">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => toggleEnabled.mutate({ id: item._id, enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                    <div className="flex items-center gap-1 text-ink-500 shrink-0">
                      <button onClick={() => reorder.mutate({ id: item._id, direction: 'up' })} aria-label="Move up" className="hover:text-navy-900">
                        <ArrowUp size={15} />
                      </button>
                      <button onClick={() => reorder.mutate({ id: item._id, direction: 'down' })} aria-label="Move down" className="hover:text-navy-900">
                        <ArrowDown size={15} />
                      </button>
                      <button onClick={() => openEdit(item)} aria-label="Edit" className="hover:text-navy-900">
                        <Pencil size={15} />
                      </button>
                      {loc.key === 'header' && (
                        <button
                          onClick={() => {
                            setAddingChildTo(item);
                            childForm.reset({ label: '', path: '' });
                          }}
                          aria-label="Add sub-menu item"
                          className="hover:text-navy-900"
                        >
                          <Plus size={15} />
                        </button>
                      )}
                      <button onClick={() => confirm(`Remove "${item.label}" from the menu?`) && deleteItem.mutate(item._id)} aria-label="Delete" className="hover:text-crimson-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {expanded[item._id] && item.children.length > 0 && (
                    <div className="pl-10 pb-2">
                      {item.children
                        .sort((a, b) => a.order - b.order)
                        .map((child) => (
                          <div key={child._id} className="flex items-center gap-3 py-2 border-t border-stone-50 first:border-0">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-ink-900 truncate">{child.label}</div>
                              <div className="text-xs text-ink-500 truncate">{child.path}</div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${child.enabled ? 'bg-teal-100 text-teal-700' : 'bg-stone-200 text-ink-500'}`}>
                              {child.enabled ? 'On' : 'Off'}
                            </span>
                            <div className="flex items-center gap-1 text-ink-500 shrink-0">
                              <button
                                onClick={() =>
                                  setEditingChild({ parent: item, childId: child._id, label: child.label, path: child.path })
                                }
                                aria-label="Edit sub-item"
                                className="hover:text-navy-900"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => deleteChild.mutate({ id: item._id, childId: child._id })}
                                aria-label="Delete sub-item"
                                className="hover:text-crimson-600"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Add/Edit top-level item modal */}
      {(editingItem || addingToLocation) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button onClick={() => { setEditingItem(null); setAddingToLocation(null); }} aria-label="Close"><X size={18} /></button>
            </div>
            <form
              onSubmit={handleSubmit((values) => {
                if (editingItem) {
                  updateItem.mutate({ id: editingItem._id, values });
                } else if (addingToLocation) {
                  createItem.mutate({ ...values, location: addingToLocation });
                }
              })}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Label</label>
                <input {...register('label', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Path</label>
                <input {...register('path')} placeholder="/example-page" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <button
                type="submit"
                className="btn-primary w-full bg-navy-900 text-white px-4 py-2.5 rounded hover:bg-navy-800 text-sm"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add child modal */}
      {addingChildTo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">Add Sub-Menu Item to "{addingChildTo.label}"</h2>
              <button onClick={() => setAddingChildTo(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <form
              onSubmit={childForm.handleSubmit((values) => addChild.mutate({ id: addingChildTo._id, values }))}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Label</label>
                <input {...childForm.register('label', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Path</label>
                <input {...childForm.register('path', { required: true })} placeholder="/example-page" className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <button
                type="submit"
                className="btn-primary w-full bg-navy-900 text-white px-4 py-2.5 rounded hover:bg-navy-800 text-sm"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit child modal */}
      {editingChild && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">Edit Sub-Menu Item</h2>
              <button onClick={() => setEditingChild(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Label</label>
                <input
                  value={editingChild.label}
                  onChange={(e) => setEditingChild({ ...editingChild, label: e.target.value })}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Path</label>
                <input
                  value={editingChild.path}
                  onChange={(e) => setEditingChild({ ...editingChild, path: e.target.value })}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={() =>
                  updateChild.mutate({
                    id: editingChild.parent._id,
                    childId: editingChild.childId,
                    values: { label: editingChild.label, path: editingChild.path },
                  })
                }
                className="btn-primary w-full bg-navy-900 text-white px-4 py-2.5 rounded hover:bg-navy-800 text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
