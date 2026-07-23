import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Shield, KeyRound, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface ProfileForm {
  name: string;
  email: string;
  currentPassword: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div className={`flex items-start gap-2 text-sm rounded-lg px-4 py-3 ${type === 'success' ? 'bg-teal-100 text-teal-700' : 'bg-crimson-100 text-crimson-600'}`}>
      {type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
      {msg}
    </div>
  );
}

export default function AdminCredentials() {
  const { admin, refreshAdmin } = useAdminAuth();
  const queryClient = useQueryClient();

  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const profileForm = useForm<ProfileForm>({
    defaultValues: { name: admin?.name || '', email: admin?.email || '', currentPassword: '' },
  });

  const passwordForm = useForm<PasswordForm>();

  const profileMutation = useMutation({
    mutationFn: (values: ProfileForm) => api.put('/admin/auth/profile', values),
    onSuccess: (res) => {
      // Re-issue token so session stays valid with new identity.
      const { token } = res.data.data;
      localStorage.setItem('catalyst_admin_token', token);
      refreshAdmin();
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      profileForm.setValue('currentPassword', '');
      setProfileStatus({ type: 'success', msg: 'Profile updated successfully.' });
    },
    onError: (err: any) => {
      setProfileStatus({ type: 'error', msg: err?.response?.data?.message || 'Update failed.' });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (values: PasswordForm) => api.put('/admin/auth/password', values),
    onSuccess: (res) => {
      const { token } = res.data.data;
      localStorage.setItem('catalyst_admin_token', token);
      refreshAdmin();
      passwordForm.reset();
      setPasswordStatus({ type: 'success', msg: 'Password changed successfully.' });
    },
    onError: (err: any) => {
      setPasswordStatus({ type: 'error', msg: err?.response?.data?.message || 'Password change failed.' });
    },
  });

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-1">
        <Shield size={22} className="text-navy-900" />
        <h1 className="text-2xl font-bold text-navy-900">Account Security</h1>
      </div>
      <p className="text-sm text-ink-500 mb-8">
        Update your admin username, email address, and password. All changes require your current password.
      </p>

      {/* Profile / Identity */}
      <section className="bg-white border border-stone-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-navy-900" />
          <h2 className="font-semibold text-navy-900">Profile Information</h2>
        </div>
        <form
          onSubmit={profileForm.handleSubmit((v) => {
            setProfileStatus(null);
            profileMutation.mutate(v);
          })}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Name (Username)</label>
              <input
                {...profileForm.register('name', { required: 'Name is required.' })}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-crimson-600 mt-1">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Email Address</label>
              <input
                type="email"
                {...profileForm.register('email', {
                  required: 'Email is required.',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email.' },
                })}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              />
              {profileForm.formState.errors.email && (
                <p className="text-xs text-crimson-600 mt-1">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              Current Password <span className="text-ink-500 font-normal">(required to confirm changes)</span>
            </label>
            <input
              type="password"
              {...profileForm.register('currentPassword', { required: 'Enter your current password to save changes.' })}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
            {profileForm.formState.errors.currentPassword && (
              <p className="text-xs text-crimson-600 mt-1">{profileForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          {profileStatus && <Alert type={profileStatus.type} msg={profileStatus.msg} />}
          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="btn-primary bg-navy-900 text-white px-5 py-2.5 rounded hover:bg-navy-800 disabled:opacity-60 text-sm"
          >
            {profileMutation.isPending ? 'Saving…' : 'Update Profile'}
          </button>
        </form>
      </section>

      {/* Password change */}
      <section className="bg-white border border-stone-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={18} className="text-navy-900" />
          <h2 className="font-semibold text-navy-900">Change Password</h2>
        </div>
        <form
          onSubmit={passwordForm.handleSubmit((v) => {
            setPasswordStatus(null);
            passwordMutation.mutate(v);
          })}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Current Password</label>
            <input
              type="password"
              {...passwordForm.register('currentPassword', { required: 'Required.' })}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-xs text-crimson-600 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">New Password</label>
              <input
                type="password"
                {...passwordForm.register('newPassword', {
                  required: 'Required.',
                  minLength: { value: 8, message: 'Minimum 8 characters.' },
                })}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-crimson-600 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Confirm New Password</label>
              <input
                type="password"
                {...passwordForm.register('confirmPassword', {
                  required: 'Required.',
                  validate: (v) =>
                    v === passwordForm.getValues('newPassword') || 'Passwords do not match.',
                })}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-crimson-600 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
          {passwordStatus && <Alert type={passwordStatus.type} msg={passwordStatus.msg} />}
          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="btn-primary bg-navy-900 text-white px-5 py-2.5 rounded hover:bg-navy-800 disabled:opacity-60 text-sm"
          >
            {passwordMutation.isPending ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  );
}
