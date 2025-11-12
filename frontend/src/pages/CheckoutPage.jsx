/**
 * Checkout Page Component
 * Handle payment and subscription activation
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { subscriptionService } from '../api';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { plan, billingCycle, addons, pricing, selectedNumbers } = location.state || {};

  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    country: 'IN',
    postalCode: '',
    gstNumber: '',
  });

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Redirect if no plan selected
    if (!plan || !pricing) {
      toast.error('Please select a plan first');
      navigate('/plans');
      return;
    }

    // Pre-fill user data
    if (user) {
      setCustomerData((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phoneNumber || '',
      }));
    }
  }, [plan, pricing, user, navigate]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!customerData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!customerData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[0-9]{10,15}$/.test(customerData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }
    if (!customerData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!customerData.state.trim()) {
      newErrors.state = 'State is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);

      // Create subscription and Razorpay order
      const response = await subscriptionService.createSubscriptionWithPayment({
        planId: plan.id,
        billingCycle,
        addons,
        customerData,
        selectedNumbers: selectedNumbers ? selectedNumbers.map(number => ({
          id: number.id,
          number: number.number,
          provider: 'balatrix', // Default provider
          setupCost: 0, // No setup cost in new API
          monthlyCost: number.monthlyCost,
          perMinuteCost: number.perMinuteCost,
        })) : [],
      });

      const { orderId, subscriptionId, amount, currency, key, customer } = response;

      // Configure Razorpay options
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: 'Balatrix Telecom',
        description: `${plan.planName} - ${billingCycle} subscription`,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.contact,
        },
        theme: {
          color: '#2563eb',
        },
        handler: async function (paymentResponse) {
          // Payment successful, verify on backend
          await verifyPayment(
            orderId,
            paymentResponse.razorpay_payment_id,
            paymentResponse.razorpay_signature,
            subscriptionId
          );
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      toast.error(error.response?.data?.message || error.message || 'Failed to create order');
      setProcessing(false);
    }
  };

  const verifyPayment = async (orderId, paymentId, signature, subscriptionId) => {
    try {
      const response = await subscriptionService.verifyPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        subscriptionId,
      });

      toast.success('Payment successful! Your subscription is now active.');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error(error.response?.data?.message || 'Payment verification failed');
      setProcessing(false);
    }
  };

  // Parse plan features for display
  const getPlanFeatures = () => {
    // Parse metadata if it's a string
    let metadata = plan.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }

    // Parse features from metadata
    let features = {};
    if (Array.isArray(metadata?.features)) {
      metadata.features.forEach(feature => {
        if (feature.includes('Toll-Free Number')) {
          const match = feature.match(/(\d+)/);
          if (match) features.tollFreeNumbers = parseInt(match[1]);
        } else if (feature.includes('Free Calling Credit')) {
          const match = feature.match(/₹(\d+)/);
          if (match) features.freeCredit = parseInt(match[1]);
        } else if (feature.includes('Extension')) {
          const match = feature.match(/(\d+)/);
          if (match) features.extensions = parseInt(match[1]);
        } else if (feature.includes('/minute') || feature.includes('/min')) {
          const match = feature.match(/₹(\d+\.?\d*)/);
          if (match) features.perMinuteCharge = parseFloat(match[1]);
        }
      });
    }

    // Fallback based on plan name
    if (Object.keys(features).length === 0) {
      if (plan.planName === 'Starter') {
        features = { tollFreeNumbers: 1, freeCredit: 199, extensions: 1, perMinuteCharge: 1.99 };
      } else if (plan.planName === 'Professional') {
        features = { tollFreeNumbers: 2, freeCredit: 700, extensions: 2, perMinuteCharge: 1.60 };
      } else if (plan.planName === 'Call Center') {
        features = { tollFreeNumbers: 5, freeCredit: 3500, extensions: 10, perMinuteCharge: 1.45 };
      }
    }

    return features;
  };

  const planFeatures = getPlanFeatures();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/plans')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Plans
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Information Form */}
          <div>
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Customer Information
              </h2>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={customerData.firstName}
                    onChange={handleInputChange}
                    error={errors.firstName}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={customerData.lastName}
                    onChange={handleInputChange}
                  />
                </div>

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={customerData.phone}
                  onChange={handleInputChange}
                  error={errors.phone}
                  placeholder="+91 98765 43210"
                  required
                />

                <Input
                  label="Company Name"
                  name="company"
                  value={customerData.company}
                  onChange={handleInputChange}
                  placeholder="Optional"
                />

                <Input
                  label="Address"
                  name="address"
                  value={customerData.address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={customerData.city}
                    onChange={handleInputChange}
                    error={errors.city}
                    required
                  />
                  <Input
                    label="State"
                    name="state"
                    value={customerData.state}
                    onChange={handleInputChange}
                    error={errors.state}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Postal Code"
                    name="postalCode"
                    value={customerData.postalCode}
                    onChange={handleInputChange}
                    placeholder="400001"
                  />
                  <Input
                    label="GST Number"
                    name="gstNumber"
                    value={customerData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4">
                {/* Plan Details */}
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {plan.planName}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    Billing Cycle: {billingCycle}
                  </p>
                </div>

                {/* Selected Toll-Free Numbers */}
                {selectedNumbers && selectedNumbers.length > 0 && (
                  <div className="pb-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Selected Numbers ({selectedNumbers.length}):
                    </h4>
                    <div className="space-y-2">
                      {selectedNumbers.map((number, index) => (
                        <div key={number.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-semibold text-green-600">
                              {number.number}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({number.provider})
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            ₹{number.monthlyCost}/month
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Total Setup Cost:</span>
                        <span>₹{selectedNumbers.reduce((sum, num) => sum + parseFloat(num.setupCost || 0), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Monthly Cost:</span>
                        <span>₹{selectedNumbers.reduce((sum, num) => sum + parseFloat(num.monthlyCost || 0), 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Limits */}
                <div className="pb-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Included:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {planFeatures.tollFreeNumbers || 0} Toll-Free Number{planFeatures.tollFreeNumbers !== 1 ? 's' : ''}
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      ₹{planFeatures.freeCredit || 0} Free Calling Credit
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {planFeatures.extensions || 0} Extension{planFeatures.extensions !== 1 ? 's' : ''}
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      ₹{planFeatures.perMinuteCharge || 0}/min after free credit
                    </li>
                  </ul>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Base Price</span>
                    <span>₹{(pricing.pricing?.basePrice || 0).toLocaleString('en-IN')}</span>
                  </div>

                  {pricing.addons?.length > 0 && (
                    <div className="space-y-2">
                      {pricing.addons.map((addon, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-600">
                          <span>{addon.name} (×{addon.quantity})</span>
                          <span>₹{(addon.totalPrice || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {pricing.pricing?.setupFee > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Setup Fee</span>
                      <span>₹{(pricing.pricing.setupFee || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-700 pt-3 border-t border-gray-200">
                    <span>Subtotal</span>
                    <span>₹{(pricing.pricing?.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>GST ({pricing.pricing?.gstPercentage || 18}%)</span>
                    <span>₹{(pricing.pricing?.gstAmount || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between items-center text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-300">
                    <span>Total</span>
                    <span className="text-blue-600">
                      ₹{(pricing.pricing?.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Payment Button */}
                <div className="pt-6">
                  <Button
                    variant="primary"
                    fullWidth
                    size="large"
                    onClick={handlePayment}
                    disabled={processing}
                    className="text-lg font-semibold"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay ₹{(pricing.pricing?.totalAmount || 0).toLocaleString('en-IN')}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-600 text-center mt-4">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Secure payment powered by Razorpay
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
