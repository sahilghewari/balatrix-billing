/**
 * Extensions Management Page
 * Admin interface for managing SIP extensions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Phone,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { Card, Button, Input, Spinner, Badge, Select } from '../components/common';
import { extensionService, tenantService } from '../api';

const ExtensionsPage = () => {
  const navigate = useNavigate();
  const [extensions, setExtensions] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTenants();
    fetchExtensions();
  }, [currentPage, searchTerm, selectedTenant]);

  const fetchTenants = async () => {
    try {
      const response = await tenantService.getTenants({ limit: 100 });
      setTenants(response.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchExtensions = async () => {
    try {
      setLoading(true);
      const response = await extensionService.getExtensions({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        tenantId: selectedTenant || undefined,
      });

      setExtensions(response.extensions || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching extensions:', error);
      toast.error('Failed to load extensions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExtension = async (extensionId, extensionNumber) => {
    if (!window.confirm(`Are you sure you want to delete extension "${extensionNumber}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await extensionService.deleteExtension(extensionId);
      toast.success('Extension deleted successfully');
      fetchExtensions();
    } catch (error) {
      console.error('Error deleting extension:', error);
      toast.error('Failed to delete extension');
    }
  };

  const handleSyncExtension = async (extensionId, extensionNumber) => {
    try {
      await extensionService.syncExtension(extensionId);
      toast.success(`Extension ${extensionNumber} synced successfully`);
      fetchExtensions();
    } catch (error) {
      console.error('Error syncing extension:', error);
      toast.error('Failed to sync extension');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'registered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unregistered':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'registered':
        return <Badge variant="success">Registered</Badge>;
      case 'unregistered':
        return <Badge variant="danger">Unregistered</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading && extensions.length === 0) {
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Extensions</h1>
            <p className="mt-2 text-gray-600">
              Manage SIP extensions and their registration status.
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/extensions/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Extension
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search extensions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-48"
            >
              <option value="">All Tenants</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </Select>
            <Button
              onClick={fetchExtensions}
              variant="outline"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Search'}
            </Button>
          </div>
        </Card>

        {/* Extensions List */}
        <Card className="p-6">
          {extensions.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No extensions found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedTenant ? 'Try adjusting your search or filters.' : 'Get started by creating your first extension.'}
              </p>
              <Button onClick={() => navigate('/admin/extensions/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Extension
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {extensions.map((extension) => (
                <div
                  key={extension.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      {getStatusIcon(extension.registrationStatus)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{extension.extensionNumber}</h3>
                        {getStatusBadge(extension.registrationStatus)}
                      </div>
                      <p className="text-sm text-gray-600">{extension.description || 'No description'}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {extension.tenant?.name || 'No tenant'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Created {new Date(extension.createdAt).toLocaleDateString()}
                        </span>
                        {extension.lastRegistration && (
                          <span className="text-xs text-gray-500">
                            Last seen {new Date(extension.lastRegistration).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/extensions/${extension.id}`)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/extensions/${extension.id}/edit`)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncExtension(extension.id, extension.extensionNumber)}
                      className="flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteExtension(extension.id, extension.extensionNumber)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ExtensionsPage;