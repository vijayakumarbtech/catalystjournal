import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/types';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function AdminContacts() {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin', 'contacts'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ContactMessage[]>>('/admin/contacts');
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/contacts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'contacts'] }),
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">Contact Messages</h1>
      <p className="text-sm text-ink-500 mb-6">Messages submitted through the site contact form.</p>

      {isLoading && <p className="text-ink-500">Loading…</p>}

      <div className="space-y-4">
        {messages?.map((m) => (
          <div key={m._id} className="bg-white border border-stone-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-navy-900" />
                <span className="font-semibold text-navy-900">{m.subject}</span>
              </div>
              <button onClick={() => deleteMutation.mutate(m._id)} aria-label="Delete" className="text-ink-500 hover:text-crimson-600">
                <Trash2 size={16} />
              </button>
            </div>
            <p className="text-sm text-ink-700 mb-2">{m.message}</p>
            <p className="text-xs text-ink-500">
              From {m.name} ({m.email}) · {new Date(m.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
        {messages?.length === 0 && <p className="text-ink-500 text-sm">No messages yet.</p>}
      </div>
    </div>
  );
}
