import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CommonLayout from '../components/layout/CommonLayout';
import { ArrowLeft, Phone, Mail } from 'lucide-react';

const ContactUsPage = () => {
  const { t } = useTranslation();

  return (
    <CommonLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-primary hover:text-primary-600 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>{t('common.backToHome')}</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Contact Us
            </h1>
            <p className="text-gray-600">
              Get in touch with us. We'd love to hear from you!
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 lg:p-10">
            <div className="space-y-6">
              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
                  <a 
                    href="tel:+60124140892" 
                    className="text-gray-700 hover:text-primary transition-colors"
                  >
                    +60 12-414 0892
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                  <a 
                    href="mailto:info@jomfood.my" 
                    className="text-gray-700 hover:text-primary transition-colors break-all"
                  >
                    info@jomfood.my
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center text-primary hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>{t('common.backToHome')}</span>
            </Link>
          </div>
        </div>
      </div>
    </CommonLayout>
  );
};

export default ContactUsPage;

