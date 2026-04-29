import React from 'react';
import { Link } from 'react-router-dom';
import CommonLayout from '../components/layout/CommonLayout';
import { ArrowLeft } from 'lucide-react';

const MerchantTermsPage = () => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <CommonLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              to="/restaurant-request"
              className="inline-flex items-center text-primary hover:text-primary-600 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Back</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Restaurant (Merchant) Terms & Conditions
            </h1>
            <p className="text-gray-600">Effective Date: {currentDate}</p>
            <p className="text-gray-600">Platform: Jomfood.my</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 lg:p-10 max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Nature of Platform</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Jomfood.my operates as a digital promotional platform that allows restaurants ("Merchant") to list promotional deals, offers, and vouchers to customers.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">Jomfood.my:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Does not prepare food</li>
                <li>Does not handle food delivery</li>
                <li>Does not manage order fulfillment</li>
                <li>Is not responsible for in-store service quality</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                The Merchant is solely responsible for redeeming and honoring published deals.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Merchant Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-3">To list deals, the Merchant must:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Be a legally registered business in Malaysia</li>
                <li>Hold all required food and business licenses</li>
                <li>Provide accurate business and banking information</li>
                <li>Agree to comply with Malaysian laws and regulations</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Jomfood.my reserves the right to approve or reject any Merchant application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Deal Listing Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed mb-3">The Merchant agrees to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate deal descriptions</li>
                <li>Clearly define offer details, validity period, redemption terms, and exclusions (if any)</li>
                <li>Honor all published deals during the validity period</li>
                <li>Not refuse valid customer redemptions</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Once a deal is published, the Merchant must fulfill it as advertised.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Commission & Payment Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                The commercial structure will be agreed separately and may include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Commission percentage per deal sold</li>
                <li>Fixed promotional fee</li>
                <li>Subscription-based listing fee</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-3">
                If Jomfood.my collects payment from customers:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Payouts will be transferred according to the agreed cycle.</li>
                <li>Refunds, disputes, or chargebacks may be deducted from payouts.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                If Jomfood.my does not collect payment, the Merchant handles payment directly with customers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Redemption Process</h2>
              <p className="text-gray-700 leading-relaxed mb-3">The Merchant is responsible for:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Verifying voucher or deal validity</li>
                <li>Ensuring staff are trained on redemption procedures</li>
                <li>Preventing misuse or fraudulent redemptions</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Jomfood.my is not responsible for operational errors at the restaurant level.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Refund & Dispute Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-3">If customers raise complaints:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Jomfood.my may investigate the issue.</li>
                <li>In case of verified non-compliance, refunds may be issued.</li>
                <li>Associated costs may be deducted from the Merchant's earnings.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Repeated complaints may result in account suspension.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Marketing & Promotion Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                By listing on Jomfood.my, the Merchant grants permission to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Use restaurant name, logo, images</li>
                <li>Promote deals via website, social media, email, and advertisements</li>
                <li>Feature the Merchant in campaigns</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                All intellectual property remains owned by the Merchant.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Merchant Obligations</h2>
              <p className="text-gray-700 leading-relaxed mb-3">The Merchant must:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Maintain service quality</li>
                <li>Avoid discriminatory practices</li>
                <li>Comply with food safety regulations</li>
                <li>Avoid misleading advertising</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                The Merchant is fully liable for customer experience at their premises.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Prohibited Activities</h2>
              <p className="text-gray-700 leading-relaxed mb-3">The Merchant shall not:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Publish false or misleading deals</li>
                <li>Refuse valid redemptions</li>
                <li>Artificially inflate pricing before discounts</li>
                <li>Engage in fraudulent or deceptive practices</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Violation may result in immediate termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Suspension & Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Jomfood.my may suspend or terminate a Merchant account if:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Terms are violated</li>
                <li>Excessive complaints are received</li>
                <li>Fraud is suspected</li>
                <li>Legal violations occur</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                The Merchant may terminate participation with written notice (e.g., 14 days).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Jomfood.my is a marketing platform only.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">We are not liable for:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Food quality issues</li>
                <li>In-store service problems</li>
                <li>Customer injury or health claims</li>
                <li>Revenue loss due to deal performance</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                The Merchant agrees to indemnify Jomfood.my against claims arising from their operations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Data Protection</h2>
              <p className="text-gray-700 leading-relaxed mb-3">Merchant agrees to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Use customer data only for redemption purposes</li>
                <li>Not store or misuse customer contact details</li>
                <li>Comply with Malaysia's PDPA regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                This Agreement is governed by the laws of Malaysia. Any disputes shall be subject to Malaysian jurisdiction.
              </p>
            </section>
          </div>
        </div>
      </div>
    </CommonLayout>
  );
};

export default MerchantTermsPage;
