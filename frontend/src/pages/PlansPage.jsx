/**
 * Plans Page Component
 * Display subscription plans and handle plan selection
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2, Check } from 'lucide-react';
import { planService, subscriptionService } from '../api';
import { useAuth } from '../hooks/useAuth';
import PlanCard from '../components/plans/PlanCard';
import AddonSelector from '../components/plans/AddonSelector';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';

const PlansPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('quarterly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [addons, setAddons] = useState({
    extraTollFreeNumbers: 0,
    extraExtensions: 0,
  });
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Fetch plans on mount
  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) {
      fetchCurrentSubscription();
    }
  }, [isAuthenticated]);

  // Calculate price when plan or addons change
  useEffect(() => {
    if (selectedPlan) {
      calculatePrice();
    }
  }, [selectedPlan, billingCycle, addons]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await planService.getPublicPlans();
      // response is already unwrapped by axios interceptor
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await subscriptionService.getMySubscription();
      // response is already unwrapped by axios interceptor
      setCurrentSubscription(response.data);
    } catch (error) {
      // User doesn't have a subscription yet, which is fine
      console.log('No active subscription found');
    }
  };

  const calculatePrice = async () => {
    if (!selectedPlan) return;

    try {
      setCalculating(true);
      const response = await planService.calculatePrice({
        planId: selectedPlan.id,
        billingCycle,
        addons, // Send as object: {extraTollFreeNumbers: 1, extraExtensions: 1}
      });
      setCalculatedPrice(response.data);
    } catch (error) {
      console.error('Error calculating price:', error);
      toast.error('Failed to calculate price');
    } finally {
      setCalculating(false);
    }
  };

  const handlePlanSelect = (plan) => {
    if (!isAuthenticated) {
      toast.error('Please login to select a plan');
      navigate('/login', { state: { from: '/plans' } });
      return;
    }

    setSelectedPlan(plan);
    setAddons({
      extraTollFreeNumbers: 0,
      extraExtensions: 0,
    });
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan || !calculatedPrice) {
      toast.error('Please select a plan');
      return;
    }

    // Navigate to checkout page with selected plan and pricing
    navigate('/checkout', {
      state: {
        plan: selectedPlan,
        billingCycle,
        addons,
        pricing: calculatedPrice,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with toll-free numbers and powerful calling features.
            Scale as you grow.
          </p>
        </div>

        {/* Billing Cycle Selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'quarterly'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Quarterly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                No Setup Fee
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              onSelect={handlePlanSelect}
              isPopular={index === 1} // Make Professional plan popular
              disabled={currentSubscription?.ratePlanId === plan.id}
            />
          ))}
        </div>

        {/* Selected Plan Configuration */}
        {selectedPlan && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Add-ons Section */}
            <AddonSelector
              plan={selectedPlan}
              billingCycle={billingCycle}
              addons={addons}
              onChange={setAddons}
            />

            {/* Price Summary */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Price Summary
              </h3>

              {calculating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : calculatedPrice ? (
                <div className="space-y-4">
                  {/* Base Price */}
                  <div className="flex justify-between text-gray-700">
                    <span>{selectedPlan.planName} ({billingCycle})</span>
                    <span className="font-semibold">
                      ₹{(calculatedPrice.pricing?.basePrice || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Add-ons */}
                  {calculatedPrice.addons?.length > 0 && (
                    <>
                      <div className="border-t border-gray-300 pt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Add-ons:</p>
                        {calculatedPrice.addons.map((addon, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>
                              {addon.name} (×{addon.quantity})
                            </span>
                            <span>₹{(addon.totalPrice || 0).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Setup Fee */}
                  {calculatedPrice.pricing?.setupFee > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Setup Fee</span>
                      <span className="font-semibold">
                        ₹{(calculatedPrice.pricing.setupFee || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="border-t border-gray-300 pt-4 flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      ₹{(calculatedPrice.pricing?.subtotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* GST */}
                  <div className="flex justify-between text-gray-700">
                    <span>GST ({calculatedPrice.pricing?.gstPercentage || 18}%)</span>
                    <span className="font-semibold">
                      ₹{(calculatedPrice.pricing?.gstAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-gray-400 pt-4 flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-blue-600">
                      ₹{(calculatedPrice.pricing?.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Proceed Button */}
                  <div className="pt-6">
                    <Button
                      variant="primary"
                      fullWidth
                      size="large"
                      onClick={handleProceedToPayment}
                      disabled={processing}
                      className="text-lg font-semibold shadow-lg hover:shadow-xl"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Proceed to Payment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        )}

        {/* Features Comparison */}
        <div className="mt-16 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Compare Plans
          </h2>
          <Card className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className="px-6 py-4 text-center text-sm font-semibold text-gray-900"
                    >
                      {plan.planName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">Toll-Free Numbers</td>
                  {plans.map((plan) => {
                    const limits = typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits;
                    const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                    return (
                      <td key={plan.id} className="px-6 py-4 text-center text-sm font-semibold">
                        {limits?.maxTollFreeNumbers || features?.tollFreeNumbers || '-'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">Included Minutes</td>
                  {plans.map((plan) => {
                    const limits = typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits;
                    const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                    return (
                      <td key={plan.id} className="px-6 py-4 text-center text-sm font-semibold">
                        {limits?.monthlyMinuteAllowance || features?.freeMinutes || '-'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">Extensions</td>
                  {plans.map((plan) => {
                    const limits = typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits;
                    const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                    return (
                      <td key={plan.id} className="px-6 py-4 text-center text-sm font-semibold">
                        {limits?.maxExtensions || features?.extensions || '-'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">Per Minute Rate</td>
                  {plans.map((plan) => {
                    const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
                    return (
                      <td key={plan.id} className="px-6 py-4 text-center text-sm font-semibold">
                        ₹{features?.perMinuteCharge || '-'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
