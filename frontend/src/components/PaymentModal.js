import React, { useState } from 'react';
import axios from 'axios';
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, orderData, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (!orderData?.order_id) {
      setError('No order data available');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Process the payment
      const response = await axios.post('/api/payments/process', {
        order_id: orderData.order_id,
        payment_method: paymentMethod
      });

      if (response.data.success) {
        setPaymentStatus('success');
        onSuccess?.(response.data);
      } else {
        setPaymentStatus('failed');
        setError(response.data.error || 'Payment failed');
      }
    } catch (err) {
      setPaymentStatus('failed');
      setError(err.response?.data?.detail || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount, currency = 'USD') => {
    const value = amount / 100; // Convert from cents
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {paymentStatus === 'success' ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-600 mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-600 mb-4">
              Your payment has been processed successfully.
            </p>
            <button
              onClick={onClose}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
            >
              Close
            </button>
          </div>
        ) : paymentStatus === 'failed' ? (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-600 mb-2">
              Payment Failed
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setPaymentStatus(null);
                setError('');
              }}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Amount:</span>
                  <span className="font-semibold">
                    {orderData?.amount ? formatAmount(orderData.amount, orderData.currency) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Currency:</span>
                  <span>{orderData?.currency || 'USD'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="text-sm text-gray-500">{orderData?.order_id}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Payment Method</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600"
                  />
                  <CreditCard size={16} />
                  <span>Credit Card</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="debit"
                    checked={paymentMethod === 'debit'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Debit Card</span>
                </label>
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a dummy payment system for testing purposes. 
                No real charges will be made to your account.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal; 