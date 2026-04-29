import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { setPasswordAPI } from '../utils/api';
import { useUser } from '../context/UserContext';
import { authStorage } from '../utils/auth';
import { toast } from '../utils/toast';
import CommonLayout from '../components/layout/CommonLayout';

const SetPasswordPage = () => {
    const navigate = useNavigate();
    const { reload } = useUser();
    const { t } = useTranslation();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const token = authStorage.getAccessToken();
    if (!token) {
        navigate('/signup', { replace: true });
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || password.length < 6) {
            toast.error(t('setPassword.minLength', 'Password must be at least 6 characters long.'));
            return;
        }

        if (password !== confirmPassword) {
            toast.error(t('setPassword.mismatch', 'Passwords do not match.'));
            return;
        }

        setSubmitting(true);

        try {
            const response = await setPasswordAPI.setPassword(password);

            if (response?.data?.success || response?.success) {
                await reload();
                toast.success(t('setPassword.success', 'Password set successfully!'));
                navigate('/', { replace: true, state: { showFirstOrderDiscountModal: true } });
            } else {
                throw new Error(response?.message || 'Failed to set password');
            }
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || t('setPassword.failed', 'Failed to set password.');
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <CommonLayout>
            <div className="flex items-center min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-7xl mx-auto px-4 py-6">
                    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                                {t('setPassword.title', 'Set Your Password')}
                            </h1>
                            <p className="text-sm text-gray-600">
                                {t('setPassword.subtitle', 'Your email has been verified. Please create a password to secure your account.')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('setPassword.newPassword', 'New Password')}
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t('setPassword.newPasswordPlaceholder', 'Enter your password')}
                                        className="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('setPassword.confirmPassword', 'Confirm Password')}
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={t('setPassword.confirmPasswordPlaceholder', 'Re-enter your password')}
                                        className="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                {t('setPassword.hint', 'Password must be at least 6 characters long.')}
                            </p>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-primary hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('common.loading', 'Loading...')}
                                    </>
                                ) : (
                                    t('setPassword.submit', 'Set Password')
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </CommonLayout>
    );
};

export default SetPasswordPage;
