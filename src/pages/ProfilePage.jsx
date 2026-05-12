import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import CommonLayout from '../components/layout/CommonLayout';
import {
  Edit2,
  Save,
  X,
  User,
  Mail,
  Phone as PhoneIcon,
  Copy,
  Share2,
  Link2,
  ImagePlus,
} from 'lucide-react';
import { toast } from '../utils/toast';
import CountryPhoneInput from '../components/common/CountryPhoneInput';
import { uploadImageFile } from '../utils/api';

const ProfilePage = () => {
  const { user, loading, updateProfile, deleteAccount } = useUser();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const normalizePhoneForInput = (phone) =>
    phone ? String(phone).replace(/[^\d]/g, '') : '';

  const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/[\+\s\-]/g, '');
    if (phone.trim().startsWith('+')) {
      return phone.trim();
    }
    const countryCodes = ['60', '92', '91', '62', '66', '84', '65', '86', '81', '82', '44', '1'];
    for (const code of countryCodes) {
      if (cleaned.startsWith(code) && cleaned.length > code.length) {
        return `+${code} ${cleaned.slice(code.length)}`;
      }
    }
    if (cleaned.length >= 10) {
      if (cleaned.startsWith('1') && cleaned.length === 11) {
        return `+1 ${cleaned.slice(1)}`;
      }
      if (cleaned.length >= 11) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
      }
    }
    return phone;
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: normalizePhoneForInput(user.phone || ''),
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone is required');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim().startsWith('+')
          ? formData.phone.trim()
          : `+${formData.phone.trim()}`,
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: normalizePhoneForInput(user.phone || ''),
      });
    }
    setIsEditing(false);
  };

  const handlePhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      const url = await uploadImageFile(file);
      await updateProfile({ image: url });
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || 'Could not upload photo'
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    const ok = window.confirm('Remove your profile photo? You can add one again anytime.');
    if (!ok) return;
    setPhotoBusy(true);
    try {
      await updateProfile({ image: null });
      toast.success('Photo removed');
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || 'Could not remove photo'
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('This will permanently delete your account. Continue?');
    if (!confirmed) return;
    try {
      await deleteAccount();
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  const referralCode = user?.referralCode || '';
  const referralCount = typeof user?.referralCount === 'number' ? user.referralCount : 0;
  const inviteUrl =
    referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}`
      : '';

  const copyText = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy — copy manually');
    }
  };

  const shareInvite = async () => {
    if (!inviteUrl) return;
    // Omit `url` — many browsers append `url` to `text`, which duplicated the link when both were set.
    const shareData = {
      title: 'Sign up with JomFood',
      text: `Hey! Sign up with JomFood and order the best deal for you. Please use this referral code: ${referralCode}\n\n${inviteUrl}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyText(inviteUrl, 'Invite link');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        toast.error('Share was cancelled or failed');
      }
    }
  };

  const initials = useMemo(() => {
    if (!user?.name) return '?';
    const parts = String(user.name).trim().split(/\s+/);
    const a = parts[0]?.[0] || '';
    const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || '';
    return `${a}${b}`.toUpperCase() || '?';
  }, [user?.name]);

  if (loading) {
    return (
      <CommonLayout>
        <div className="bg-slate-50/80 min-h-[calc(100vh-5rem)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm animate-pulse space-y-4">
                <div className="flex gap-3 items-center">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-1/2" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
                <div className="h-28 bg-slate-100 rounded-xl" />
              </div>
              <div className="hidden lg:block lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse h-64" />
            </div>
          </div>
        </div>
      </CommonLayout>
    );
  }

  if (!user) {
    return (
      <CommonLayout>
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">You&apos;re not logged in</h1>
            <p className="text-sm text-slate-600 mb-6">Please log in to view your account.</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/login"
                className="bg-primary hover:bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                Log In
              </Link>
              <Link to="/signup" className="text-primary font-medium text-sm hover:underline">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </CommonLayout>
    );
  }

  /** Compact referral widget — secondary to main profile */
  const referralAside = (
    <aside className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-900/5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Referrals</p>
      <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Invite friends</h2>
      <p className="text-sm text-slate-500 mt-1 mb-5 leading-relaxed">
        When someone signs up with your referral code, your referral count increases.
      </p>

      <div className="flex items-stretch gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1 pl-3">
        <div className="flex-1 min-w-0 flex items-center">
          <span className="font-mono text-sm sm:text-base font-semibold text-slate-900 tracking-wide truncate">
            {referralCode || '—'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => copyText(referralCode, 'Referral code')}
          disabled={!referralCode}
          title="Copy code"
          className="shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 transition-colors"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copyText(inviteUrl, 'Invite link')}
          disabled={!inviteUrl}
          className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-35 transition-colors"
        >
          <Link2 className="w-4 h-4 shrink-0 text-slate-500" />
          Copy link
        </button>
        <button
          type="button"
          onClick={shareInvite}
          disabled={!inviteUrl}
          className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-35 transition-colors"
        >
          <Share2 className="w-4 h-4 shrink-0" />
          Share
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
        <span className="text-slate-500">Successful referrals</span>
        <span className="tabular-nums font-semibold text-slate-900">{referralCount}</span>
      </div>
    </aside>
  );

  return (
    <CommonLayout>
      <div className="bg-slate-50/80 min-h-[calc(100vh-5rem)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <header className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Account</h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base max-w-2xl">
              Manage your account and preferences.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 items-start">
            {/* Primary: profile (~67%) */}
            <div className="lg:col-span-8 min-w-0">
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
                {/* Identity hero — makes profile feel like the main surface */}
                <div className="relative px-5 sm:px-6 pt-4 pb-4 sm:pt-5 sm:pb-4 bg-gradient-to-br from-slate-50 via-white to-white border-b border-slate-100">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 backdrop-blur px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-white hover:border-slate-300 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                      Edit profile
                    </button>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelected}
                    disabled={photoBusy}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pr-20 sm:pr-0">
                    <div className="relative shrink-0 group rounded-xl ring-2 ring-white shadow overflow-hidden outline-none focus-within:ring-primary/30 focus-within:ring-2">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover shrink-0 block"
                        />
                      ) : (
                        <div
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-primary to-emerald-700 text-white flex items-center justify-center text-base sm:text-lg font-semibold shrink-0"
                          aria-hidden
                        >
                          {initials}
                        </div>
                      )}
                      {/* Desktop / fine pointer: actions on hover or keyboard focus */}
                      <div
                        className="pointer-events-none absolute inset-0 z-10 hidden sm:flex flex-col items-center justify-center gap-0.5 bg-slate-900/60 text-white opacity-0 invisible transition-all duration-150 group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
                        aria-label="Profile photo actions"
                      >
                        <button
                          type="button"
                          disabled={photoBusy}
                          onClick={() => photoInputRef.current?.click()}
                          className="pointer-events-auto text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded hover:bg-white/15 disabled:opacity-50"
                        >
                          {photoBusy ? '…' : 'Change'}
                        </button>
                        {user.image ? (
                          <button
                            type="button"
                            disabled={photoBusy}
                            onClick={handleRemovePhoto}
                            className="pointer-events-auto text-[10px] font-medium text-white/85 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      {photoBusy && (
                        <div className="absolute inset-0 z-20 rounded-xl bg-white/80 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-slate-600">…</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl font-semibold text-slate-900 truncate leading-tight">
                        {user.name || '—'}
                      </h2>
                      <p className="text-sm text-slate-500 truncate mt-0.5">{user.email || ''}</p>
                      {/* Touch / small screens: photo actions (no hover) */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 sm:hidden">
                        <button
                          type="button"
                          disabled={photoBusy}
                          onClick={() => photoInputRef.current?.click()}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-700 disabled:opacity-50"
                        >
                          <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                          {photoBusy ? 'Uploading…' : 'Change photo'}
                        </button>
                        {user.image ? (
                          <button
                            type="button"
                            disabled={photoBusy}
                            onClick={handleRemovePhoto}
                            className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
                          >
                            Remove photo
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 sm:px-6 py-6 sm:py-7">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
                    Personal information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <div className="md:col-span-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                        <User className="w-3.5 h-3.5" />
                        Full name {isEditing && <span className="text-red-500">*</span>}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                          placeholder="Your name"
                          required
                        />
                      ) : (
                        <p className="text-slate-900 font-medium py-2.5 border-b border-transparent">
                          {user.name || '—'}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                        <PhoneIcon className="w-3.5 h-3.5" />
                        Phone {isEditing && <span className="text-red-500">*</span>}
                      </label>
                      {isEditing ? (
                        <CountryPhoneInput
                          value={formData.phone}
                          onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
                          placeholder="+60 123456789"
                        />
                      ) : (
                        <p className="text-slate-900 font-medium py-2.5">{formatPhoneNumber(user.phone)}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </label>
                      {isEditing ? (
                        <>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                          />
                          <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed here.</p>
                        </>
                      ) : (
                        <p className="text-slate-900 font-medium py-2.5 break-all">{user.email || '—'}</p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 inline-flex justify-center items-center gap-2 bg-primary text-white py-2.5 px-5 rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="mt-10 pt-6 border-t border-slate-100">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Danger zone</p>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                      >
                        Delete account
                      </button>
                      <p className="text-xs text-slate-400 mt-2 max-w-md">
                        Permanently remove your account and personal data. This cannot be undone.
                      </p>
                    </div>
                  )}
                </div>

                {/* Mobile: referral below main card content */}
                <div className="lg:hidden px-5 sm:px-6 pb-6 border-t border-slate-100 bg-slate-50/50">
                  <div className="pt-6">
                    {referralAside}
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary: referrals (~33%) — visually subordinate */}
            <div className="hidden lg:block lg:col-span-4 min-w-0 lg:self-start lg:sticky lg:top-24">
              {referralAside}
            </div>
          </div>
        </div>
      </div>
    </CommonLayout>
  );
};

export default ProfilePage;
