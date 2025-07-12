import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CreditCard, 
  Crown, 
  Shield, 
  CheckCircle, 
  XCircle, 
  FileText,
  Users,
  Zap,
  Star,
  ArrowLeft
} from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Payment = () => {
  const { type } = useParams(); // 'report' or 'license'
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pricing, setPricing] = useState({});

  useEffect(() => {
    loadRazorpayScript();
    fetchPricing();
    
    // Set default plan based on type
    if (type === 'license') {
      setSelectedPlan(user?.role === 'doctor' ? 'doctor_upgrade' : 'parent_upgrade');
    } else if (type === 'report') {
      setSelectedPlan('report_unlock');
    }
  }, [type, user?.role]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchPricing = async () => {
    try {
      const reportResponse = await api.get('/payments/pricing?item_type=report_unlock&currency=INR');
      const parentResponse = await api.get('/payments/pricing?item_type=license_upgrade&user_role=parent&currency=INR');
      const doctorResponse = await api.get('/payments/pricing?item_type=license_upgrade&user_role=doctor&currency=INR');
      
      setPricing({
        report_unlock: reportResponse.data.amount || 299,
        parent_upgrade: parentResponse.data.amount || 999,
        doctor_upgrade: doctorResponse.data.amount || 2499
      });
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      // Fallback pricing
      setPricing({
        report_unlock: 299,
        parent_upgrade: 999,
        doctor_upgrade: 2499
      });
    }
  };

  const createOrder = async (planType) => {
    setLoading(true);
    try {
      const amount = pricing[planType];
      const response = await api.post('/payments/create-order', {
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        child_id: type === 'report' ? 'report-unlock' : null,
        report_type: planType
      });
      
      setOrderData(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Failed to create payment order');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (planType) => {
    const order = await createOrder(planType);
    if (!order) return;

    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: 'NeuroNest',
      description: getPlanDescription(planType),
      order_id: order.order_id,
      image: '/logo192.png',
      handler: async (response) => {
        await verifyPayment(response);
      },
      prefill: {
        name: user?.email?.split('@')[0] || '',
        email: user?.email || '',
        contact: '',
      },
      notes: {
        address: 'NeuroNest - Autism Screening Platform'
      },
      theme: {
        color: '#3b82f6'
      },
      modal: {
        ondismiss: () => {
          setPaymentStatus('cancelled');
          toast.error('Payment cancelled');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const verifyPayment = async (paymentData) => {
    setLoading(true);
    try {
      const response = await api.post('/payments/verify', {
        order_id: paymentData.razorpay_order_id,
        payment_id: paymentData.razorpay_payment_id,
        signature: paymentData.razorpay_signature
      });

      if (response.data.message === 'Payment verified successfully') {
        setPaymentStatus('success');
        toast.success('Payment successful!');
        
        // Redirect after success
        setTimeout(() => {
          if (type === 'license') {
            navigate('/dashboard');
          } else {
            navigate('/reports');
          }
        }, 3000);
      } else {
        setPaymentStatus('failed');
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      setPaymentStatus('failed');
      toast.error('Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getPlanDescription = (planType) => {
    switch (planType) {
      case 'report_unlock':
        return 'Detailed AI Analysis Report';
      case 'parent_upgrade':
        return 'Parent License Upgrade (10→25 children)';
      case 'doctor_upgrade':
        return 'Doctor License Upgrade (25→50 patients)';
      default:
        return 'NeuroNest Service';
    }
  };

  const getPlanFeatures = (planType) => {
    switch (planType) {
      case 'report_unlock':
        return [
          'Comprehensive AI behavioral analysis',
          'ASD likelihood assessment',
          'Detailed behavioral indicators',
          'Professional recommendations',
          'Downloadable PDF report',
          'Peer comparison analysis'
        ];
      case 'parent_upgrade':
        return [
          'Increase from 10 to 25 children',
          'All premium features included',
          'Priority support',
          'Advanced analytics',
          'Export capabilities',
          'Family sharing options'
        ];
      case 'doctor_upgrade':
        return [
          'Increase from 25 to 50 patients',
          'Clinical dashboard',
          'Professional reporting tools',
          'Patient management system',
          'Compliance features',
          'Research data export'
        ];
      default:
        return [];
    }
  };

  const plans = [
    {
      id: 'report_unlock',
      name: 'Detailed Report',
      price: pricing.report_unlock || 299,
      description: 'Unlock comprehensive AI analysis',
      icon: FileText,
      popular: false,
      available: type === 'report'
    },
    {
      id: 'parent_upgrade',
      name: 'Parent Premium',
      price: pricing.parent_upgrade || 999,
      description: 'Expand to 25 children profiles',
      icon: Users,
      popular: true,
      available: type === 'license' && user?.role === 'parent'
    },
    {
      id: 'doctor_upgrade',
      name: 'Professional Premium',
      price: pricing.doctor_upgrade || 2499,
      description: 'Expand to 50 patient profiles',
      icon: Crown,
      popular: true,
      available: type === 'license' && user?.role === 'doctor'
    }
  ];

  const availablePlans = plans.filter(plan => plan.available);

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your {getPlanDescription(selectedPlan)} has been activated.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary w-full"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="btn btn-outline w-full"
            >
              View Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">
            Something went wrong with your payment. Please try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentStatus(null)}
              className="btn btn-primary w-full"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline w-full"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {type === 'license' ? 'Upgrade Your License' : 'Unlock Detailed Report'}
            </h1>
            <p className="mt-2 text-gray-600">
              {type === 'license' 
                ? 'Expand your capacity and unlock premium features'
                : 'Get comprehensive AI-powered behavioral analysis'
              }
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Secure Payment</h3>
              <p className="text-sm text-blue-700">
                Powered by Razorpay. Your payment information is encrypted and secure.
              </p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {availablePlans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg shadow-lg border-2 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-20' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.popular ? 'transform scale-105' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>Popular</span>
                    </span>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isSelected ? 'text-primary-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                      <span className="text-gray-500 ml-2">
                        {plan.id === 'report_unlock' ? 'one-time' : 'upgrade'}
                      </span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {getPlanFeatures(plan.id).map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handlePayment(plan.id)}
                    disabled={loading}
                    className={`w-full btn ${
                      isSelected ? 'btn-primary' : 'btn-outline'
                    } flex items-center justify-center space-x-2`}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <LoadingSpinner size="small" text="" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {isSelected ? 'Pay Now' : 'Select Plan'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What's Included</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <h4 className="font-medium text-gray-900">AI Analysis</h4>
                <p className="text-sm text-gray-500">GPT-4 powered insights</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="font-medium text-gray-900">Secure & Private</h4>
                <p className="text-sm text-gray-500">GDPR compliant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <h4 className="font-medium text-gray-900">Detailed Reports</h4>
                <p className="text-sm text-gray-500">Professional quality</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Is my payment secure?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Yes, all payments are processed securely through Razorpay with bank-level encryption.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Can I get a refund?</h4>
              <p className="text-sm text-gray-600 mt-1">
                We offer a 7-day money-back guarantee if you're not satisfied with the service.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Do I need to pay monthly?</h4>
              <p className="text-sm text-gray-600 mt-1">
                No, license upgrades are one-time payments. Reports are also one-time purchases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
