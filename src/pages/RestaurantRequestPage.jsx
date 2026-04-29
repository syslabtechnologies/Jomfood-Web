import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { businessRequestAPI, categoriesAPI, banksAPI } from '../utils/api';
import { toast } from '../utils/toast';
import CommonLayout from '../components/layout/CommonLayout';
import jomfoodLogo from '../assets/JomFood.png';
import ScrollableSelect from '../components/ui/ScrollableSelect';
import { LoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const initialForm = {
  name: '',
  type: '',
  address: {
    googleLocation: '',
    city: '',
    state: '',
    area: '',
    zip_code: '',
    latitude: '',
    longitude: ''
  },
  person_in_charge: {
    name: '',
    number: '+60 ',
    whatsapp: '+60 ',
    email: '',
    website: ''
  },
  socials: {
    facebook: '',
    instagram: '',
    tiktok: ''
  },
  bank_details: {
    bank_name: '',
    account_holder: '',
    account_number: '',
    swiftCode: ''
  },
  terms_accepted: false
};

const RestaurantRequestPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [selectedBankId, setSelectedBankId] = useState('');

  // Fetch categories from API on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await categoriesAPI.getCategoriesDropdown();
        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          console.error('Invalid response format:', response);
          toast.error('Failed to load restaurant types');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        toast.error('Failed to load restaurant types');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch active banks from API on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      setBanksLoading(true);
      try {
        const response = await banksAPI.getActiveBanks();
        if (response.success && Array.isArray(response.data)) {
          setBanks(response.data);
        } else {
          setBanks([]);
          toast.error('Failed to load bank list');
        }
      } catch (err) {
        console.error('Error fetching banks:', err);
        setBanks([]);
        toast.error('Failed to load bank list');
      } finally {
        setBanksLoading(false);
      }
    };

    fetchBanks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else if (name.startsWith('person_in_charge.')) {
      const field = name.split('.')[1];
      
      // Handle phone number fields to ensure +60 prefix
      if ((field === 'number' || field === 'whatsapp') && value.length > 0) {
        // If user tries to delete the +60 prefix, restore it
        if (!value.startsWith('+60 ')) {
          // If they're typing, add +60 prefix
          const cleanValue = value.replace(/^\+?60?\s?/, '');
          setForm(prev => ({
            ...prev,
            person_in_charge: {
              ...prev.person_in_charge,
              [field]: cleanValue ? `+60 ${cleanValue}` : '+60 '
            }
          }));
          return;
        }
      }
      
      setForm(prev => ({
        ...prev,
        person_in_charge: {
          ...prev.person_in_charge,
          [field]: value
        }
      }));
    } else if (name.startsWith('socials.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        socials: {
          ...prev.socials,
          [field]: value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error(t('restaurantRequest.validation.nameRequired'));
      return false;
    }
    if (!form.type) {
      toast.error(t('restaurantRequest.validation.typeRequired'));
      return false;
    }
    if (!form.address.city.trim()) {
      toast.error(t('restaurantRequest.validation.cityRequired'));
      return false;
    }
    if (!form.address.state.trim()) {
      toast.error(t('restaurantRequest.validation.stateRequired'));
      return false;
    }
    if (!form.address.area.trim()) {
      toast.error(t('restaurantRequest.validation.areaRequired'));
      return false;
    }
    if (!form.address.zip_code.trim()) {
      toast.error(t('restaurantRequest.validation.zipCodeRequired'));
      return false;
    }
    if (!form.person_in_charge.name.trim()) {
      toast.error(t('restaurantRequest.validation.contactNameRequired'));
      return false;
    }
    if (!form.person_in_charge.number.trim() || form.person_in_charge.number.trim() === '+60') {
      toast.error(t('restaurantRequest.validation.phoneRequired'));
      return false;
    }
    if (!form.person_in_charge.whatsapp.trim() || form.person_in_charge.whatsapp.trim() === '+60') {
      toast.error(t('restaurantRequest.validation.whatsappRequired'));
      return false;
    }
    if (!form.person_in_charge.email.trim()) {
      toast.error(t('restaurantRequest.validation.emailRequired'));
      return false;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.person_in_charge.email)) {
      toast.error(t('restaurantRequest.validation.emailInvalid'));
      return false;
    }
    if (!form.bank_details.bank_name.trim()) {
      toast.error(t('restaurantRequest.validation.bankNameRequired'));
      return false;
    }
    if (!form.bank_details.account_holder.trim()) {
      toast.error(t('restaurantRequest.validation.accountHolderRequired'));
      return false;
    }
    if (!form.bank_details.account_number.trim()) {
      toast.error(t('restaurantRequest.validation.accountNumberRequired'));
      return false;
    }
    if (!form.bank_details.swiftCode.trim()) {
      toast.error(t('restaurantRequest.validation.swiftCodeRequired'));
      return false;
    }
    if (!form.terms_accepted) {
      toast.error(t('restaurantRequest.validation.termsRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Prepare payload - remove empty optional fields
      const addressPayload = {
        googleLocation: form.address.googleLocation?.trim() || '',
        city: form.address.city.trim(),
        state: form.address.state.trim(),
        area: form.address.area.trim(),
        zip_code: form.address.zip_code.trim()
      };

      // Add latitude and longitude if they exist
      if (form.address.latitude && form.address.latitude.trim()) {
        addressPayload.latitude = form.address.latitude.trim();
      }
      if (form.address.longitude && form.address.longitude.trim()) {
        addressPayload.longitude = form.address.longitude.trim();
      }

      const payload = {
        name: form.name.trim(),
        type: form.type,
        address: addressPayload,
        person_in_charge: {
          name: form.person_in_charge.name.trim(),
          number: form.person_in_charge.number.trim(),
          whatsapp: form.person_in_charge.whatsapp.trim(),
          email: form.person_in_charge.email.trim()
        }
      };

      // Add optional fields only if they have values
      if (form.person_in_charge.website.trim()) {
        payload.person_in_charge.website = form.person_in_charge.website.trim();
      }

      const socials = {};
      if (form.socials.facebook.trim()) {
        socials.facebook = form.socials.facebook.trim();
      }
      if (form.socials.instagram.trim()) {
        socials.instagram = form.socials.instagram.trim();
      }
      if (form.socials.tiktok.trim()) {
        socials.tiktok = form.socials.tiktok.trim();
      }

      if (Object.keys(socials).length > 0) {
        payload.socials = socials;
      }

      payload.bank_details = {
        bank_name: form.bank_details.bank_name.trim(),
        account_holder: form.bank_details.account_holder.trim(),
        account_number: form.bank_details.account_number.trim(),
        swiftCode: form.bank_details.swiftCode.trim()
      };
      payload.terms_accepted = Boolean(form.terms_accepted);

      const response = await businessRequestAPI.submitRequest(payload);
      
      if (response.success) {
        // Reset form
        setForm(initialForm);
        setSelectedBankId('');
        // Show success modal
        setShowSuccessModal(true);
      } else {
        toast.error(response.message || t('restaurantRequest.submitError'));
      }
    } catch (err) {
      const message = err?.message || err?.data?.message || t('restaurantRequest.submitError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Show Thank You page instead of form if submission successful
  if (showSuccessModal) {
    return (
      <CommonLayout>
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-8 px-4">
          <div className="max-w-2xl w-full text-center">
            {/* Success Animation */}
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>

            {/* Thank You Message */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              {t('restaurantRequest.successTitle', 'Thank You!')}
            </h1>
            
            <p className="text-xl text-gray-700 mb-2 font-medium">
              {t('restaurantRequest.submitSuccess', 'Your restaurant request has been submitted successfully!')}
            </p>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t('restaurantRequest.thankYouMessage', 'We\'ve received your information and our team will review it shortly. We\'ll get back to you soon!')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setForm(initialForm);
                }}
                className="px-8 py-3 bg-primary hover:bg-primary-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                {t('restaurantRequest.submitAnother', 'Submit Another Request')}
              </button>
              <a
                href="/"
                className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                {t('common.backToHome', 'Back to Home')}
              </a>
            </div>
          </div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout>
      <div className="min-h-[calc(100vh-120px)] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            {/* <img src={jomfoodLogo} alt="JomFood" className="h-12 w-auto mx-auto mb-4" /> */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('restaurantRequest.title')}
            </h1>
            <p className="text-gray-600">
              {t('restaurantRequest.subtitle')}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Restaurant Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('restaurantRequest.sections.restaurantInfo')}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.restaurantName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder={t('restaurantRequest.placeholders.restaurantName')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.restaurantType')} <span className="text-red-500">*</span>
                    </label>
                    <ScrollableSelect
                      value={form.type}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          type: value,
                        }))
                      }
                      options={categories.map((category) => ({
                        label: category.name,
                        value: category.id,
                      }))}
                      placeholder={categoriesLoading ? t('common.loading', 'Loading...') : t('restaurantRequest.placeholders.selectType')}
                      className="mt-1"
                      maxVisibleItems={4}
                      searchable
                      searchPlaceholder={t('restaurantRequest.placeholders.restaurantTypeSearch', 'Search restaurant type')}
                      disabled={categoriesLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('restaurantRequest.sections.address')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Google Places Autocomplete */}
                  <div className="md:col-span-2">
                    <label htmlFor="googleLocation" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.googleLocation', 'Search Address')}
                    </label>
                    <LoadScript
                      googleMapsApiKey={'AIzaSyD2Sj_UrDNY-TReJnMMNu3SlJTbs5z1nX8'}
                      libraries={libraries}
                    >
                      <PlacesAutocomplete form={form} setForm={setForm} t={t} />
                    </LoadScript>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('restaurantRequest.hints.googleLocation', 'Start typing to search and autofill address fields below')}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.city')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="address.city"
                      name="address.city"
                      type="text"
                      value={form.address.city}
                      onChange={handleChange}
                      placeholder={t('restaurantRequest.placeholders.city')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.state')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="address.state"
                      name="address.state"
                      type="text"
                      value={form.address.state}
                      onChange={handleChange}
                      placeholder={t('restaurantRequest.placeholders.state')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="address.area" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.area')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="address.area"
                      name="address.area"
                      type="text"
                      value={form.address.area}
                      onChange={handleChange}
                      placeholder={t('restaurantRequest.placeholders.area')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="address.zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.zipCode')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="address.zip_code"
                      name="address.zip_code"
                      type="text"
                      value={form.address.zip_code}
                      onChange={handleChange}
                      placeholder={t('restaurantRequest.placeholders.zipCode')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Person in Charge Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('restaurantRequest.sections.contactPerson')}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="person_in_charge.name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.contactName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="person_in_charge.name"
                      name="person_in_charge.name"
                      type="text"
                      value={form.person_in_charge.name}
                      onChange={handleChange}
                      placeholder={t('restaurantRequest.placeholders.contactName')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="person_in_charge.number" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('restaurantRequest.fields.phone')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="person_in_charge.number"
                        name="person_in_charge.number"
                        type="tel"
                        value={form.person_in_charge.number}
                        onChange={handleChange}
                        onFocus={(e) => {
                          if (!e.target.value || e.target.value === '') {
                            setForm(prev => ({
                              ...prev,
                              person_in_charge: {
                                ...prev.person_in_charge,
                                number: '+60 '
                              }
                            }));
                          }
                        }}
                        placeholder={t('restaurantRequest.placeholders.phone')}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="person_in_charge.whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('restaurantRequest.fields.whatsapp')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="person_in_charge.whatsapp"
                        name="person_in_charge.whatsapp"
                        type="tel"
                        value={form.person_in_charge.whatsapp}
                        onChange={handleChange}
                        onFocus={(e) => {
                          if (!e.target.value || e.target.value === '') {
                            setForm(prev => ({
                              ...prev,
                              person_in_charge: {
                                ...prev.person_in_charge,
                                whatsapp: '+60 '
                              }
                            }));
                          }
                        }}
                        placeholder={t('restaurantRequest.placeholders.whatsapp')}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="person_in_charge.email" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('restaurantRequest.fields.email')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="person_in_charge.email"
                        name="person_in_charge.email"
                        type="email"
                        value={form.person_in_charge.email}
                        onChange={handleChange}
                        placeholder={t('restaurantRequest.placeholders.email')}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="person_in_charge.website" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('restaurantRequest.fields.website')}
                      </label>
                      <input
                        id="person_in_charge.website"
                        name="person_in_charge.website"
                        type="url"
                        value={form.person_in_charge.website}
                        onChange={handleChange}
                        placeholder={t('restaurantRequest.placeholders.website')}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Section */}
              {/* <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('restaurantRequest.sections.socialMedia')}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {t('restaurantRequest.socialMediaNote')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="socials.facebook" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.facebook')}
                    </label>
                    <input
                      id="socials.facebook"
                      name="socials.facebook"
                      type="url"
                      value={form.socials.facebook}
                      onChange={handleChange}
                      placeholder={t('restaurantRequest.placeholders.facebook')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="socials.instagram" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.instagram')}
                    </label>
                    <input
                      id="socials.instagram"
                      name="socials.instagram"
                      type="url"
                      value={form.socials.instagram}
                      onChange={handleChange}
                      placeholder={t('restaurantRequest.placeholders.instagram')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="socials.tiktok" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.tiktok')}
                    </label>
                    <input
                      id="socials.tiktok"
                      name="socials.tiktok"
                      type="url"
                      value={form.socials.tiktok}
                      onChange={handleChange}
                      placeholder={t('restaurantRequest.placeholders.tiktok')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                    />
                  </div>
                </div>
              </div> */}

              {/* Bank Account Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('restaurantRequest.sections.bankDetails')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.bankName')} <span className="text-red-500">*</span>
                    </label>
                    <ScrollableSelect
                      value={selectedBankId}
                      onChange={(value) => {
                        const selectedBank = banks.find((bank) => bank._id === value);
                        setSelectedBankId(value);
                        setForm((prev) => ({
                          ...prev,
                          bank_details: {
                            ...prev.bank_details,
                            bank_name: selectedBank?.name || '',
                            swiftCode: selectedBank?.code || ''
                          }
                        }));
                      }}
                      options={banks.map((bank) => ({
                        label: `${bank.name} (${bank.code})`,
                        value: bank._id
                      }))}
                      placeholder={banksLoading ? t('common.loading', 'Loading...') : t('restaurantRequest.placeholders.selectBankWithSwift', 'Select bank')}
                      className="mt-1"
                      maxVisibleItems={5}
                      searchable
                      searchPlaceholder={t('restaurantRequest.placeholders.searchBank', 'Search bank')}
                      disabled={banksLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="bank_details.account_holder" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.accountHolder')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="bank_details.account_holder"
                      name="bank_details.account_holder"
                      type="text"
                      value={form.bank_details.account_holder}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bank_details: {
                            ...prev.bank_details,
                            account_holder: e.target.value
                          }
                        }))
                      }
                      placeholder={t('restaurantRequest.placeholders.accountHolder')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="bank_details.account_number" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.accountNumber')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="bank_details.account_number"
                      name="bank_details.account_number"
                      type="text"
                      value={form.bank_details.account_number}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bank_details: {
                            ...prev.bank_details,
                            account_number: e.target.value
                          }
                        }))
                      }
                      placeholder={t('restaurantRequest.placeholders.accountNumber')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      required
                    />
                  </div>

                  {/* Swift code input kept for future use; hidden from UI as requested */}
                  {/*
                  <div>
                    <label htmlFor="bank_details.swiftCode" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('restaurantRequest.fields.swiftCode')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="bank_details.swiftCode"
                      name="bank_details.swiftCode"
                      type="text"
                      value={form.bank_details.swiftCode}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bank_details: {
                            ...prev.bank_details,
                            swiftCode: e.target.value
                          }
                        }))
                      }
                      placeholder={t('restaurantRequest.placeholders.swiftCode')}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      required
                    />
                  </div>
                  */}

                </div>
              </div>

              {/* Terms of Service */}
              <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.terms_accepted)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        terms_accepted: e.target.checked
                      }))
                    }
                    className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary-400"
                  />
                  <span className="text-sm text-gray-800">
                    {t('restaurantRequest.terms.prefix')}{" "}
                    <a
                      href="/merchant-terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary underline"
                    >
                      {t('restaurantRequest.terms.linkText')}
                    </a>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded font-medium transition-colors"
                >
                  {submitting ? t('restaurantRequest.submitting') : t('restaurantRequest.submitButton')}
                </button>
              </div>

              {/* Note */}
              <div className="text-sm text-gray-500 text-center">
                <p>{t('restaurantRequest.note')}</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </CommonLayout>
  );
};

// Google Places Autocomplete Component
const PlacesAutocomplete = ({ form, setForm, t }) => {
  const autocompleteRef = useRef(null);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();

    if (!place || !place.address_components) {
      console.warn('No place details available');
      return;
    }

    // Initialize empty values with more detailed fields
    let addressData = {
      street_number: '',
      route: '',
      sublocality: '',
      sublocality_level_1: '',
      neighborhood: '',
      premise: '',
      locality: '',
      administrative_area_level_1: '',
      postal_code: ''
    };

    // Extract address components - more detailed extraction
    place.address_components.forEach((component) => {
      const types = component.types;

      if (types.includes('street_number')) {
        addressData.street_number = component.long_name;
      }
      if (types.includes('route')) {
        addressData.route = component.long_name;
      }
      if (types.includes('sublocality')) {
        addressData.sublocality = component.long_name;
      }
      if (types.includes('sublocality_level_1')) {
        addressData.sublocality_level_1 = component.long_name;
      }
      if (types.includes('neighborhood')) {
        addressData.neighborhood = component.long_name;
      }
      if (types.includes('premise')) {
        addressData.premise = component.long_name;
      }
      if (types.includes('locality')) {
        addressData.locality = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        addressData.administrative_area_level_1 = component.long_name;
      }
      if (types.includes('postal_code')) {
        addressData.postal_code = component.long_name;
      }
    });

    // Extract latitude and longitude from geometry
    let latitude = '';
    let longitude = '';
    if (place.geometry && place.geometry.location) {
      latitude = typeof place.geometry.location.lat === 'function'
        ? place.geometry.location.lat()
        : place.geometry.location.lat;
      longitude = typeof place.geometry.location.lng === 'function'
        ? place.geometry.location.lng()
        : place.geometry.location.lng;
    }

    // Update form with extracted data - prioritize more specific fields
    setForm(prev => ({
      ...prev,
      address: {
        ...prev.address,
        googleLocation: place.formatted_address || '',
        area: addressData.sublocality_level_1 || addressData.sublocality || addressData.neighborhood || prev.address.area,
        city: addressData.locality || prev.address.city,
        state: addressData.administrative_area_level_1 || prev.address.state,
        zip_code: addressData.postal_code || prev.address.zip_code,
        latitude: latitude ? latitude.toString() : prev.address.latitude,
        longitude: longitude ? longitude.toString() : prev.address.longitude
      }
    }));
  };

  return (
    <Autocomplete
      onLoad={(autocomplete) => {
        autocompleteRef.current = autocomplete;
      }}
      onPlaceChanged={handlePlaceSelect}
      options={{
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id', 'business_status'],
        componentRestrictions: { country: 'my' },
        strictBounds: false
      }}
    >
      <input
        type="text"
        placeholder={t('restaurantRequest.placeholders.googleLocation', 'Search address to autofill...')}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
        defaultValue={form.address.googleLocation}
      />
    </Autocomplete>
  );
};

export default RestaurantRequestPage;

