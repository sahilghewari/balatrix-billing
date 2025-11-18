/**
 * Toll-Free Number Management Page
 * Allows customers to view and manage their assigned toll-free numbers
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Phone,
  PhoneOff,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Calendar,
  DollarSign
} from 'lucide-react';
import { tollFreeNumberService } from '../api';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import ConfirmDialog from '../components/common/ConfirmDialog';

const TollFreeNumberManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unassigning, setUnassigning] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  // Get customer ID from user
  const customerId = user?.customer?.id;

  useEffect(() => {
    fetchCustomerNumbers();
  }, []);

  const fetchCustomerNumbers = async () => {
    try {
      setLoading(true);
      const response = await tollFreeNumberService.getMyNumbers();
      setNumbers(response.data || []);
    } catch (error) {
      console.error('Error fetching customer numbers:', error);
      toast.error('Failed to load toll-free numbers');
      setNumbers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignNumber = async (numberId, number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Unassign Toll-Free Number',
      message: `Are you sure you want to unassign ${number}? This action cannot be undone.`,
      onConfirm: () => confirmUnassignNumber(numberId),
    });
  };

  const confirmUnassignNumber = async (numberId) => {
    try {
      setUnassigning(numberId);
      await tollFreeNumberService.unassignNumber(numberId);
      toast.success('Toll-free number unassigned successfully');
      await fetchCustomerNumbers(); // Refresh the list
    } catch (error) {
      console.error('Error unassigning number:', error);
      toast.error('Failed to unassign toll-free number');
    } finally {
      setUnassigning(null);
      setConfirmDialog({ isOpen: false });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      inactive: { color: 'bg-red-100 text-red-800', label: 'Inactive' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', label: 'Suspended' },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Manage Toll-Free Numbers</h1>
              <p className="mt-2 text-gray-600">
                View and manage your assigned toll-free numbers
              </p>
            </div>
          </div>
        </div>

        {/* Numbers Grid */}
        {numbers.length === 0 ? (
          <Card className="text-center py-12">
            <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Toll-Free Numbers Assigned
            </h3>
            <p className="text-gray-600 mb-6">
              You don't have any toll-free numbers assigned to your account yet.
            </p>
            <Button
              onClick={() => navigate('/plans')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Browse Plans
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {numbers.map((number) => (
              <Card key={number.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Phone className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {number.number}
                      </h3>
                      <p className="text-sm text-gray-600">Toll-Free Number</p>
                    </div>
                  </div>
                  {getStatusBadge(number.status)}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Assigned: {formatDate(number.assignedAt)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>
                      ${number.monthlyCost}/month + ${number.perMinuteCost}/min
                    </span>
                  </div>

                  {number.provider && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Provider:</span>
                      <span className="capitalize">{number.provider}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate('/routing')}
                    disabled={unassigning === number.id}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Configure
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    color="red"
                    onClick={() => handleUnassignNumber(number.id, number.number)}
                    disabled={unassigning === number.id || numbers.length <= 1}
                    className="flex-1"
                  >
                    {unassigning === number.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <PhoneOff className="w-4 h-4 mr-2" />
                    )}
                    Unassign
                  </Button>
                </div>

                {numbers.length <= 1 && (
                  <div className="mt-3 flex items-center text-xs text-amber-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Cannot unassign your last number
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        {numbers.length > 0 && (
          <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Need More Numbers?
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  To add more toll-free numbers to your account, you'll need to upgrade your plan or purchase additional numbers as add-ons.
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate('/plans')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  View Plans
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false })}
        confirmText="Unassign"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default TollFreeNumberManagementPage;