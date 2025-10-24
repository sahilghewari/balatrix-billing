/**
 * Tenants Management Page
 * Admin interface for managing tenants
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Phone,
  MoreVertical,
  Eye
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { Card, Button, Input, Spinner, Badge } from '../components/common';
import { tenantService } from '../api';

const TenantsPage = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTenants();
  }, [currentPage, searchTerm]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await tenantService.getTenants({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
      });

      setTenants(response.tenants || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenant = async (tenantId, tenantName) => {
    if (!window.confirm(`Are you sure you want to delete tenant "${tenantName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await tenantService.deleteTenant(tenantId);
      toast.success('Tenant deleted successfully');
      fetchTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error('Failed to delete tenant');
    }
  };

  const handleSyncExtensions = async (tenantId, tenantName) => {
    try {
      await tenantService.syncTenantExtensions(tenantId);
      toast.success(`Extensions synced for ${tenantName}`);
    } catch (error) {
      console.error('Error syncing extensions:', error);
      toast.error('Failed to sync extensions');
    }
  };

  if (loading && tenants.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
            <p className="mt-2 text-gray-600">
              Manage tenant organizations and their configurations.
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/tenants/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Tenant
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={fetchTenants}
              variant="outline"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Search'}
            </Button>
          </div>
        </Card>

        {/* Tenants List */}
        <Card className="p-6">
          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first tenant.'}
              </p>
              <Button onClick={() => navigate('/admin/tenants/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tenant
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                      <p className="text-sm text-gray-600">{tenant.domain}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant={tenant.isActive ? 'success' : 'secondary'}>
                          {tenant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Created {new Date(tenant.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/tenants/${tenant.id}/edit`)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncExtensions(tenant.id, tenant.name)}
                      className="flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
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

export default TenantsPage;