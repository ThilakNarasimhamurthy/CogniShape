import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CreditCard, 
  Check, 
  Star, 
  Users, 
  FileText, 
  Shield, 
  Zap,
  Crown,
  ArrowRight,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { paymentAPI, licenseAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Payment = () => {
  const { type } = useParams(); // upgrade, subscription, etc.
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState({});
  const [currentUsage, setCurrentUsage] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    fetchPricingAndUsage();
  }, []);

  const fetchPricingAndUsage = async () => {
    try {
      setLoading(true);
      const [pricingRes, usageRes] = await Promise.all([
        paymentAPI.getPricing('license_upgrade', user?.role, 'INR'),
        licenseAPI.getUsage()
      ]);
      
      setPricing(pricingRes.data);
      setCurrentUsage(usageRes.data);
    } catch (error) {
      console.error('Failed to fetch pricing data:', error);
      toast.error('Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  const plans = {
    parent: [
      {
        id: 'basic',
        name: 'Basic',
        price: { monthly: 999, yearly: 9999 },
        children: 3,
        features: [
          'Up to 3 children profiles',
          'Basic behavioral analysis',
          'Monthly reports',
          'Email support',
          'Standard game library'
        ],
        popular: false
      },
      {
        id: 'standard',
        name: 'Standard',
        price: { monthly: 1999, yearly: 19999 },
        children: 7,
        features: [
          'Up to 7 children profiles',
          'Advanced AI analysis',
          'Weekly reports',
          'Priority support',
          'Extended game library',
          'Progress tracking',
          'Peer comparisons'
        ],
        popular: true
      },
      {
        id: 'premium',
        name: 'Premium',
        price: { monthly: 2999, yearly: 29999 },
        children: 10,
        features: [
          'Up to 10 children profiles',
          'Expert-level AI analysis',
          'Real-time reports',
          '24/7 support',
          'Complete game library',
          'Detailed analytics',
          'Professional consultations',
          'Export capabilities'
        ],
        popular: false
      }
    ],
    doctor: [
      {
        id: 'professional',
        name: 'Professional',
        price: { monthly: 4999, yearly: 49999 },
        children: 15,
        features: [
          'Up to 15 patient profiles',
          'Clinical-grade analysis',
          'Diagnostic reports',
          'Priority support',
          'Professional dashboard',
          'Data export',
          'HIPAA compliance'
        ],
        popular: false
      },
      {
        id: 'clinic',
        name: 'Clinic',
        price: { monthly: 7999, yearly: 79999 },
        children: 25,
        features: [
          'Up to 25 patient profiles',
          'Advanced diagnostics',
          'Custom report templates',
          'Dedicated support',
          'Multi-user access',
          'API integration',
          'Training resources',
          'Bulk operations'
        ],
        popular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: { monthly: 'Custom', yearly: 'Custom' },
        children: 'Unlimited',
        features: [
          'Unlimited patient profiles',
          'Custom AI models',
          'White-label solution',
          'Dedicated account manager',
          'Custom integrations',
          'On-premise deployment',
          'Advanced analytics',
          'Research collaboration'
        ],
        popular: false
      }
    ]
  };

  const currentPlans = plans[user?.role] || plans.parent;

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const formatPrice = (price) => {
    if (typeof price === 'string') return price;
    return `₹${price.toLocaleString()}`;
  };

  const calculateSavings = (plan) => {
    if (typeof plan.price.yearly === 'string') return 0;
    const monthlyCost = plan.price.monthly * 12;
    const yearlyCost = plan.price.yearly;
    return Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100);
  };

  const processPayment = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }

    try {
      setLoading(true);
      
      const amount = billingCycle === 'yearly' 
        ? selectedPlan.price.yearly 
        : selectedPlan.price.monthly;
        
      if (typeof amount === 'string') {
        toast.info('Please contact sales for enterprise pricing');
        return;
      }

      // Create order
      const orderResponse = await paymentAPI.createOrder({
        amount: amount * 100, // Convert to paisa
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        plan_id: selectedPlan.id,
        billing_cycle: billingCycle
      });

      const order = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'NeuroNest',
        description: `${selectedPlan.name} Plan - ${billingCycle}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment
            await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: selectedPlan.id,
              billing_cycle: billingCycle
            });

            toast.success('Payment successful! Your plan has been upgraded.');
            navigate('/dashboard');
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.full_name || user?.email?.split('@')[0],
          email: user?.email,
          contact: user?.phone || ''
        },
        theme: {
          color: '#3B82F6'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment initiation failed:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedPlan) {
    return <LoadingSpinner size="large" text="Loading payment options..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock the full potential of NeuroNest with advanced AI-powered autism screening 
            and comprehensive behavioral analysis tools.
          </p>
        </div>

        {/* Current Usage */}
        {currentUsage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Current Usage</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You are currently using {currentUsage.children_count || 0} out of {currentUsage.children_limit || 0} {' '}
                  {user?.role === 'doctor' ? 'patient' : 'children'} slots. 
                  {currentUsage.children_count >= currentUsage.children_limit && (
                    <span className="font-medium"> Upgrade to add more profiles.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <div className="flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingCycle === 'yearly'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save up to 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {currentPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
                selectedPlan?.id === plan.id
                  ? 'border-primary-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              } ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}
              onClick={() => handlePlanSelect(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {formatPrice(plan.price[billingCycle])}
                    {typeof plan.price[billingCycle] !== 'string' && (
                      <span className="text-lg font-normal text-gray-500">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && calculateSavings(plan) > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      Save {calculateSavings(plan)}% annually
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Users className="w-5 h-5 text-primary-600" />
                    <span className="text-lg font-medium text-gray-900">
                      {plan.children} {user?.role === 'doctor' ? 'patients' : 'children'}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    selectedPlan?.id === plan.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Section */}
        {selectedPlan && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Purchase</h2>
              
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Billing:</span>
                    <span className="font-medium capitalize">{billingCycle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {user?.role === 'doctor' ? 'Patients' : 'Children'}:
                    </span>
                    <span className="font-medium">{selectedPlan.children}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatPrice(selectedPlan.price[billingCycle])}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Credit/Debit Card, UPI, Net Banking</span>
                  </label>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900">Secure Payment</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Your payment information is encrypted and secure. We use industry-standard security measures.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={loading || typeof selectedPlan.price[billingCycle] === 'string'}
                  className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <>
                      <span>
                        {typeof selectedPlan.price[billingCycle] === 'string' 
                          ? 'Contact Sales' 
                          : 'Pay Now'
                        }
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center mt-6">
                By completing this purchase, you agree to our{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">Privacy Policy</a>.
                You can cancel your subscription at any time.
              </p>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Can I change my plan later?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use enterprise-grade security and are HIPAA compliant to ensure your data is always protected.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee if you're not satisfied with our service.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, UPI, and net banking through our secure payment gateway.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;