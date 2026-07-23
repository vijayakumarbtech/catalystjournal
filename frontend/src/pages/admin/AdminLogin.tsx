import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useSettings } from '@/lib/queries';

interface LoginForm {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const { login, admin } = useAdminAuth();
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [settings?.logoUrl]);

  useEffect(() => {
    document.title = 'Admin Login — The Catalyst';
    if (admin) navigate('/admin/dashboard');
  }, [admin, navigate]);

  async function onSubmit(values: LoginForm) {
    setLoading(true);
    setError('');
    try {
      await login(values.email, values.password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {settings?.logoUrl && !logoError ? (
            <img
              src={settings.logoUrl}
              alt={`${settings.journalName || 'The Catalyst'} logo`}
              className="h-14 w-auto object-contain mx-auto mb-4"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-navy-900 border-2 border-gold-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="text-gold-400" size={22} />
            </div>
          )}
          <h1 className="font-display text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-sm text-stone-400 mt-1">The Catalyst content management system</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-navy-900 border border-navy-700 rounded-xl p-6 space-y-5 shadow-2xl">
          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1.5">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Required' })}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-gold-500 outline-none transition-colors"
            />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-200 mb-1.5">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Required' })}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-gold-500 outline-none transition-colors"
            />
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 bg-gold-500 text-navy-950 px-4 py-3 rounded-lg hover:bg-gold-400 disabled:opacity-60 text-sm transition-all shadow-md hover:shadow-lg"
          >
            {loading ? <><Loader2 className="animate-spin" size={16} /> Signing in…</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
