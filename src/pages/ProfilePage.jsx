import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import CommonLayout from '../components/layout/CommonLayout';
import { Edit2, Save, X, User, Mail, Phone as PhoneIcon } from 'lucide-react';
import { toast } from '../utils/toast';
import CountryPhoneInput from '../components/common/CountryPhoneInput';

const ProfilePage = () => {
  const { user, loading, updateProfile, deleteAccount } = useUser();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const normalizePhoneForInput = (phone) =>
    phone ? String(phone).replace(/[^\d]/g, '') : '';

  // Format phone number for display (e.g., 60123456789 -> +60 123456789)
  const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    
    // Remove any existing +, spaces, or dashes
    const cleaned = phone.replace(/[\+\s\-]/g, '');
    
    // If already starts with +, return as is (already formatted)
    if (phone.trim().startsWith('+')) {
      return phone.trim();
    }
    
    // Common 2-digit country codes
    const countryCodes = ['60', '92', '91', '62', '66', '84', '65', '86', '81', '82', '44', '1'];
    
    // Check for 2-digit country code
    for (const code of countryCodes) {
      if (cleaned.startsWith(code) && cleaned.length > code.length) {
        return `+${code} ${cleaned.slice(code.length)}`;
      }
    }
    
    // If no country code match, try to detect 1-digit country codes (like USA +1)
    if (cleaned.length >= 10) {
      // For numbers starting with 1 (US/Canada), format as +1
      if (cleaned.startsWith('1') && cleaned.length === 11) {
        return `+1 ${cleaned.slice(1)}`;
      }
      // Default: assume 2-digit country code
      if (cleaned.length >= 11) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
      }
    }
    
    // If we can't format it, return as is
    return phone;
  };

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: normalizePhoneForInput(user.phone || '')
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
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
          : `+${formData.phone.trim()}`
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
    // Reset form data to original user data
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: normalizePhoneForInput(user.phone || '')
      });
    }
    setIsEditing(false);
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

  if (loading) {
    return (
      <CommonLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </CommonLayout>
    );
  }

  if (!user) {
    return (
      <CommonLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">You're not logged in</h1>
            <p className="text-sm text-gray-600 mb-4">Please log in to view your profile.</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/login" className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded font-medium text-sm transition-colors">Log In</Link>
              <Link to="/signup" className="text-primary font-medium text-sm">Create account</Link>
            </div>
          </div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span className="text-sm font-medium">Edit</span>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-6">Manage your account details.</p>

          {/* Profile Information */}
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <User className="w-3 h-3" />
                Name {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter your name"
                  required
                />
              ) : (
                <div className="text-sm text-gray-900 font-medium">{user.name || '-'}</div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Mail className="w-3 h-3" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              ) : (
                <div className="text-sm text-gray-900 font-medium">{user.email || '-'}</div>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed from your profile.</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <PhoneIcon className="w-3 h-3" />
                Phone {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <CountryPhoneInput
                  value={formData.phone}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      phone: value
                    }));
                  }}
                  placeholder="+60 123456789"
                />
              ) : (
                <div className="text-sm text-gray-900 font-medium">{formatPhoneNumber(user.phone)}</div>
              )}
            </div>

          </div>

          {/* Action Buttons (shown only in edit mode) */}
          {isEditing && (
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}

          {!isEditing && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-center gap-2 border border-red-500 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                Delete Account
              </button>
              <p className="text-xs text-gray-500 mt-2">
                This will permanently delete your account and remove your personal data.
              </p>
            </div>
          )}
        </div>
      </div>
    </CommonLayout>
  );
};

export default ProfilePage;


