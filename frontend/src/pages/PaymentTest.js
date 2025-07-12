import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentModal from '../components/PaymentModal';
import { CreditCard, DollarSign, Users, FileText, CheckCircle } from 'lucide-react';

const PaymentTest = () => {
  const [pricing, setPricing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    fetchPricing();
    fetchPaymentHistory();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await axios.get('/api/payments/pricing');
      setPricing(response.data.pricing);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await axios.get('/api/payments/history');
      setPaymentHistory(response.data.payments || []);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    }
  };

  const createOrder = async (serviceType, params = {}) => {
    try {
      let endpoint = '/api/payments/create-order';
      let data = {
        amount: 499, // $4.99 in cents
        currency: 'USD',
        child_id: 'test-child-id',
        report_type: 'full'
      };

      switch (serviceType) {
        case 'subscription':
          endpoint = '/api/payments/create-subscription-order';
          data = { subscription_type: 'monthly', currency: 'USD' };
          break;
        case 'license':
          endpoint = '/api/payments/create-license-upgrade-order';
          data = { currency: 'USD' };
          break;
        case 'report':
          endpoint = '/api/payments/create-report-unlock-order';
          data = { child_id: 'test-child-id', currency: 'USD' };
          break;
      }

      const response = await axios.post(endpoint, data);
      setOrderData(response.data);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setOrderData(null);
    fetchPaymentHistory(); // Refresh payment history
  };

  const formatAmount = (amount, currency = 'USD') => {
    const value = amount / 100; // Convert from cents
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment System Test
          </h1>
          <p className="text-gray-600">
            Test the dummy payment system with various services
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold">Report Unlock</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {pricing?.report_unlock?.USD ? `$${pricing.report_unlock.USD}` : '$4.99'}
            </p>
            <p className="text-gray-600 mb-4">Unlock detailed diagnostic reports</p>
            <button
              onClick={() => createOrder('report')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Purchase Report
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Users className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold">License Upgrade</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {pricing?.license_upgrade?.parent?.USD ? `$${pricing.license_upgrade.parent.USD}` : '$9.99'}
            </p>
            <p className="text-gray-600 mb-4">Upgrade from 10 to 25 child slots</p>
            <button
              onClick={() => createOrder('license')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Upgrade License
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold">Premium Subscription</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {pricing?.premium_subscription?.monthly?.USD ? `$${pricing.premium_subscription.monthly.USD}` : '$9.99'}
            </p>
            <p className="text-gray-600 mb-4">Monthly premium features</p>
            <button
              onClick={() => createOrder('subscription')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              Subscribe Monthly
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="w-8 h-8 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold">Custom Order</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">$4.99</p>
            <p className="text-gray-600 mb-4">Test with custom amount</p>
            <button
              onClick={() => createOrder('custom')}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700"
            >
              Custom Payment
            </button>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          {paymentHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No payment history available. Make a payment to see it here.
            </p>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium">Payment {payment.id}</p>
                      <p className="text-sm text-gray-500">
                        {payment.method} • {payment.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatAmount(payment.amount, payment.currency)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">About This Payment System</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• This is a dummy payment system for testing purposes</li>
            <li>• No real charges will be made to your account</li>
            <li>• Payments have a 95% success rate (simulated)</li>
            <li>• Processing takes 2 seconds (simulated delay)</li>
            <li>• All payment data is stored locally for demonstration</li>
          </ul>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderData={orderData}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default PaymentTest; 