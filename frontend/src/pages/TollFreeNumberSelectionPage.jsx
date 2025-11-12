/**
 * Toll-Free Number Selection Page
 * Allows customers to select toll-free numbers after plan selection
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2, Phone, Search, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { tollFreeNumberService } from '../api';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Input from '../components/common/Input';

const TollFreeNumberSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get plan data from navigation state
  const { plan, billingCycle, addons, pricing } = location.state || {};

  // Parse plan limits
  const planLimits = typeof plan?.limits === 'string' ? JSON.parse(plan?.limits || '{}') : (plan?.limits || {});
  const planFeatures = typeof plan?.features === 'string' ? JSON.parse(plan?.features || '{}') : (plan?.features || {});
  const maxTollFreeNumbers = planLimits?.maxTollFreeNumbers || planFeatures?.tollFreeNumbers || 1;
  const extraTollFreeNumbers = addons?.extraTollFreeNumbers || 0;
  const totalAllowedNumbers = maxTollFreeNumbers + extraTollFreeNumbers;

  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNumbers, setTotalNumbers] = useState(0);

  // Redirect if no plan data
  useEffect(() => {
    if (!plan || !pricing) {
      toast.error('Please select a plan first');
      navigate('/plans');
      return;
    }
    fetchAvailableNumbers();
  }, [plan, pricing, navigate]);

  // Fetch available numbers
  const fetchAvailableNumbers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const limit = 12;
      const offset = (page - 1) * limit;

      const response = await tollFreeNumberService.getAvailableNumbers({
        limit,
        offset,
        search: search || searchTerm,
      });

      setNumbers(response.data.numbers || []);
      setCurrentPage(page);
      setTotalPages(Math.ceil((response.data.pagination?.total || 0) / limit));
      setTotalNumbers(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching toll-free numbers:', error);
      toast.error('Failed to load available numbers');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAvailableNumbers(1, searchTerm);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAvailableNumbers(page, searchTerm);
  };

  // Handle number selection (toggle)
  const handleNumberSelect = (number) => {
    setSelectedNumbers(prev => {
      const isSelected = prev.some(selected => selected.id === number.id);
      if (isSelected) {
        // Remove from selection
        return prev.filter(selected => selected.id !== number.id);
      } else {
        // Add to selection (check limit)
        if (prev.length >= totalAllowedNumbers) {
          toast.error(`You can select up to ${totalAllowedNumbers} toll-free numbers for this plan`);
          return prev;
        }
        return [...prev, number];
      }
    });
  };

  // Handle proceed to checkout
  const handleProceedToCheckout = async () => {
    if (selectedNumbers.length === 0) {
      toast.error('Please select at least one toll-free number');
      return;
    }

    try {
      setSelecting(true);

      // Don't assign numbers here - they'll be assigned during subscription activation
      toast.success(`${selectedNumbers.length} toll-free number${selectedNumbers.length > 1 ? 's' : ''} selected successfully!`);

      // Navigate to checkout with number data
      navigate('/checkout', {
        state: {
          plan,
          billingCycle,
          addons,
          pricing,
          selectedNumbers,
        },
      });
    } catch (error) {
      console.error('Error selecting toll-free numbers:', error);
      toast.error(error.response?.data?.message || 'Failed to select toll-free numbers');
    } finally {
      setSelecting(false);
    }
  };

  // Handle back to plans
  const handleBackToPlans = () => {
    navigate('/plans');
  };

  if (loading && numbers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Select Toll-Free Numbers</h1>
              <p className="mt-2 text-gray-600">
                Choose up to {totalAllowedNumbers} toll-free number{totalAllowedNumbers > 1 ? 's' : ''} for your {plan?.planName} plan
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleBackToPlans}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Plans
            </Button>
          </div>

          {/* Plan Summary */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium">{plan?.planName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Billing Cycle</p>
                <p className="font-medium capitalize">{billingCycle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium">₹{pricing?.totalAmount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search for specific number patterns (e.g., 1800-XXX-XXXX)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" variant="outline" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </form>
        </div>

        {/* Numbers Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Available Numbers ({totalNumbers})
            </h2>
            {selectedNumbers.length > 0 && (
              <div className="text-sm text-gray-600">
                {selectedNumbers.length} of {totalAllowedNumbers} selected
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : numbers.length === 0 ? (
            <Card className="p-12 text-center">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No numbers available</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try a different search term' : 'All numbers are currently assigned'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {numbers.map((number) => (
                <Card
                  key={number.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedNumbers.some(selected => selected.id === number.id)
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleNumberSelect(number)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-mono text-lg font-semibold text-gray-900">
                          {number.number}
                        </p>
                        <p className="text-sm text-gray-500">
                          Provider: {number.provider}
                        </p>
                      </div>
                    </div>
                    {selectedNumbers.some(selected => selected.id === number.id) && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly Cost:</span>
                      <span className="font-medium">₹{number.monthlyCost}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Setup Cost:</span>
                      <span className="font-medium">₹0.00</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBackToPlans}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </Button>

          <Button
            onClick={handleProceedToCheckout}
            disabled={selectedNumbers.length === 0 || selecting}
            className="flex items-center gap-2"
          >
            {selecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Proceed to Checkout ({selectedNumbers.length} selected)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TollFreeNumberSelectionPage;