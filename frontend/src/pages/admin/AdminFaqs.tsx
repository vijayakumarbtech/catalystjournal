import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { FaqItem, ApiResponse } from '@/types';

type FormValues = { question: string; answer: string; category?: string; order: number };

export default function AdminFaqs() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['admin', 'faqs'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FaqItem[]>>('/admin/faqs');
      return data.data;
    },
  });

  const { register, handleSubmit, reset } = useForm<FormValues>();

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing ? api.put(`/admin/faqs/${editing._id}`, values) : api.post('/admin/faqs', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      setShowForm(false);
      setEditing(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/faqs/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] }),
  });

  function openNew() {
    setEditing(null);
    reset({ order: (faqs?.length || 0) + 1 } as FormValues);
    setShowForm(true);
  }

  function openEdit(f: FaqItem) {
    setEditing(f);
    reset(f);
    setShowForm(true);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">FAQs</h1>
          <p className="text-sm text-ink-500">Manage frequently asked questions shown on the site.</p>
        </div>
        <button onClick={openNew} className="btn-primary inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded hover:bg-navy-800 text-sm">
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Question</th>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && <tr><td colSpan={3} className="text-center py-10 text-ink-500">Loading…</td></tr>}
            {faqs?.map((f) => (
              <tr key={f._id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3 font-medium text-navy-900 max-w-md truncate">{f.question}</td>
                <td className="px-4 py-3">{f.order}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-ink-500">
                    <button onClick={() => openEdit(f)} aria-label="Edit" className="hover:text-navy-900"><Pencil size={16} /></button>
                    <button onClick={() => confirm('Delete this FAQ?') && deleteMutation.mutate(f._id)} aria-label="Delete" className="hover:text-crimson-600">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-navy-900">{editing ? 'Edit FAQ' : 'Add FAQ'}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Question</label>
                <input {...register('question', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Answer</label>
                <textarea rows={4} {...register('answer', { required: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Category</label>
                  <input {...register('category')} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Order</label>
                  <input type="number" {...register('order', { valueAsNumber: true })} className="w-full border border-stone-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="btn-primary w-full bg-navy-900 text-white px-4 py-2.5 rounded hover:bg-navy-800 disabled:opacity-60 text-sm"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save FAQ'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
