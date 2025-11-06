/**
 * Extension Management Page
 * Allows customers to view and manage their assigned extensions
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
  Key,
  User,
  Hash,
  Eye,
  EyeOff,
  Edit
} from 'lucide-react';
import { extensionService } from '../api';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MainLayout from '../components/layout/MainLayout';

const ExtensionManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [currentPasswords, setCurrentPasswords] = useState({});
  const [changePasswordDialog, setChangePasswordDialog] = useState({
    isOpen: false,
    extension: null,
    newPassword: '',
  });
  const [resetPasswordDialog, setResetPasswordDialog] = useState({
    isOpen: false,
    extension: null,
    newPassword: '',
  });

  useEffect(() => {
    fetchCustomerExtensions();
  }, []);

  const fetchCustomerExtensions = async () => {
    try {
      setLoading(true);
      const response = await extensionService.getMyExtensions();
      setExtensions(response || []);
    } catch (error) {
      console.error('Error fetching extensions:', error);
      toast.error('Failed to load your extensions');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (extension) => {
    setResetPasswordDialog({
      isOpen: true,
      extension,
      newPassword: '',
    });
  };

  const handleSyncExtension = async (extension) => {
    try {
      await extensionService.syncMyExtension(extension.id);
      toast.success(`Extension ${extension.extension} synced successfully`);
      fetchCustomerExtensions(); // Refresh the list
    } catch (error) {
      console.error('Error syncing extension:', error);
      toast.error('Failed to sync extension');
    }
  };

  const togglePasswordVisibility = async (extensionId) => {
    const isVisible = passwordVisibility[extensionId];
    
    if (!isVisible && !currentPasswords[extensionId]) {
      // Fetch password if not already fetched
      try {
        const result = await extensionService.getMyExtensionPassword(extensionId);
        setCurrentPasswords(prev => ({
          ...prev,
          [extensionId]: result.password,
        }));
      } catch (error) {
        console.error('Error fetching password:', error);
        toast.error('Failed to fetch current password');
        return;
      }
    }
    
    setPasswordVisibility(prev => ({
      ...prev,
      [extensionId]: !isVisible,
    }));
  };

  const handleChangePassword = (extension) => {
    setChangePasswordDialog({
      isOpen: true,
      extension,
      newPassword: '',
    });
  };

  const submitChangePassword = async () => {
    const { extension, newPassword } = changePasswordDialog;
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      await extensionService.updateMyExtensionPassword(extension.id, newPassword);
      toast.success(`Password changed for extension ${extension.extension}`);
      
      // Update local state
      setCurrentPasswords(prev => ({
        ...prev,
        [extension.id]: newPassword,
      }));
      
      setChangePasswordDialog({ isOpen: false, extension: null, newPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    }
  };

  const submitResetPassword = async () => {
    const { extension, newPassword } = resetPasswordDialog;
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      const result = await extensionService.resetMyExtensionPassword(extension.id, newPassword);
      toast.success(`Password reset for extension ${extension.extension}. New password: ${result.newPassword}`);
      
      // Update local state
      setCurrentPasswords(prev => ({
        ...prev,
        [extension.id]: newPassword,
      }));
      
      setResetPasswordDialog({ isOpen: false, extension: null, newPassword: '' });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset extension password');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Extensions</h1>
            <p className="mt-2 text-gray-600">
              Manage your SIP extensions and credentials.
            </p>
          </div>
        </div>

        {/* Extensions List */}
        {extensions.length === 0 ? (
          <Card className="p-8 text-center">
            <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Extensions Assigned
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have any extensions assigned to your account yet.
              Extensions are automatically assigned when you purchase a plan.
            </p>
            <Button onClick={() => navigate('/plans')}>
              View Available Plans
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {extensions.map((extension) => (
              <Card key={extension.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{extension.extension}</h3>
                      <p className="text-sm text-gray-600">
                        Base: {extension.basePrefix}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{extension.displayName || 'No display name'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Hash className="w-4 h-4" />
                    <span>Index: {extension.extensionIndex}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Assigned: {formatDate(extension.assignedAt)}</span>
                  </div>

                  {/* Password Section */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Password:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(extension.id)}
                          className="h-6 px-2 text-xs"
                        >
                          {passwordVisibility[extension.id] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChangePassword(extension)}
                          className="h-6 px-2 text-xs"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="font-mono text-sm bg-gray-50 p-2 rounded border">
                      {passwordVisibility[extension.id] ? (
                        currentPasswords[extension.id] || 'Loading...'
                      ) : (
                        '••••••••'
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetPassword(extension)}
                    className="flex items-center gap-2 flex-1"
                  >
                    <Key className="w-4 h-4" />
                    Reset Password
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncExtension(extension)}
                    className="flex items-center gap-2 flex-1"
                  >
                    <Loader2 className="w-4 h-4" />
                    Sync
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Usage Information */}
        {extensions.length > 0 && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">
                  Extension Usage Information
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use your extension number and password to configure SIP phones</li>
                  <li>• Domain: sip.balatrix.com</li>
                  <li>• Extensions are automatically assigned based on your plan</li>
                  <li>• Contact support if you need to change passwords or reconfigure</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
        />

        {/* Change Password Dialog */}
        {changePasswordDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Change Password for Extension {changePasswordDialog.extension?.extension}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={changePasswordDialog.newPassword}
                    onChange={(e) => setChangePasswordDialog(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password (min 6 characters)"
                    minLength={6}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={submitChangePassword}
                  className="flex-1"
                >
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setChangePasswordDialog({ isOpen: false, extension: null, newPassword: '' })}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Dialog */}
        {resetPasswordDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Reset Password for Extension {resetPasswordDialog.extension?.extension}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={resetPasswordDialog.newPassword}
                    onChange={(e) => setResetPasswordDialog(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password (min 6 characters)"
                    minLength={6}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={submitResetPassword}
                  className="flex-1"
                >
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setResetPasswordDialog({ isOpen: false, extension: null, newPassword: '' })}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ExtensionManagementPage;