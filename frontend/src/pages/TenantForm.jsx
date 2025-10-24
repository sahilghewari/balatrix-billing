/**
 * Tenant Form Component
 * Form for creating and editing tenants
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Building } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { Card, Button, Input, Textarea, Spinner, Switch } from '../components/common';
import { tenantService } from '../api';

const tenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').max(100, 'Name must be less than 100 characters'),
  domain: z.string().min(1, 'Domain is required').max(255, 'Domain must be less than 255 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean().default(true),
  config: z.object({
    maxExtensions: z.number().min(1).max(10000).default(100),
    maxConcurrentCalls: z.number().min(1).max(1000).default(50),
    billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
    features: z.object({
      callRecording: z.boolean().default(false),
      voicemail: z.boolean().default(true),
      ivr: z.boolean().default(false),
      conference: z.boolean().default(false),
    }).default({}),
  }).default({}),
});

const TenantForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      domain: '',
      description: '',
      isActive: true,
      config: {
        maxExtensions: 100,
        maxConcurrentCalls: 50,
        billingCycle: 'monthly',
        features: {
          callRecording: false,
          voicemail: true,
          ivr: false,
          conference: false,
        },
      },
    },
  });

  const watchedFeatures = watch('config.features');

  useEffect(() => {
    if (isEditing) {
      fetchTenant();
    }
  }, [id]);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      const response = await tenantService.getTenant(id);
      const tenant = response.tenant;

      reset({
        name: tenant.name,
        domain: tenant.domain,
        description: tenant.description || '',
        isActive: tenant.isActive,
        config: {
          maxExtensions: tenant.config?.maxExtensions || 100,
          maxConcurrentCalls: tenant.config?.maxConcurrentCalls || 50,
          billingCycle: tenant.config?.billingCycle || 'monthly',
          features: {
            callRecording: tenant.config?.features?.callRecording || false,
            voicemail: tenant.config?.features?.voicemail ?? true,
            ivr: tenant.config?.features?.ivr || false,
            conference: tenant.config?.features?.conference || false,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching tenant:', error);
      toast.error('Failed to load tenant');
      navigate('/admin/tenants');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);

      if (isEditing) {
        await tenantService.updateTenant(id, data);
        toast.success('Tenant updated successfully');
      } else {
        await tenantService.createTenant(data);
        toast.success('Tenant created successfully');
      }

      navigate('/admin/tenants');
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast.error(error.response?.data?.message || 'Failed to save tenant');
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/tenants')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tenants
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Tenant' : 'Create Tenant'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEditing ? 'Update tenant information and configuration.' : 'Add a new tenant organization to the system.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Name *
                </label>
                <Input
                  {...register('name')}
                  placeholder="Enter tenant name"
                  error={errors.name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain *
                </label>
                <Input
                  {...register('domain')}
                  placeholder="Enter domain (e.g., company.com)"
                  error={errors.domain?.message}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                {...register('description')}
                placeholder="Enter tenant description"
                rows={3}
                error={errors.description?.message}
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center">
                <Switch
                  checked={watch('isActive')}
                  onChange={(checked) => setValue('isActive', checked)}
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Active Tenant
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Inactive tenants cannot create new extensions or make calls.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Extensions
                </label>
                <Input
                  type="number"
                  {...register('config.maxExtensions', { valueAsNumber: true })}
                  placeholder="100"
                  min="1"
                  max="10000"
                  error={errors.config?.maxExtensions?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Concurrent Calls
                </label>
                <Input
                  type="number"
                  {...register('config.maxConcurrentCalls', { valueAsNumber: true })}
                  placeholder="50"
                  min="1"
                  max="1000"
                  error={errors.config?.maxConcurrentCalls?.message}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Cycle
              </label>
              <select
                {...register('config.billingCycle')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Features</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <Switch
                  checked={watchedFeatures?.voicemail}
                  onChange={(checked) => setValue('config.features.voicemail', checked)}
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">Voicemail</label>
                  <p className="text-xs text-gray-500">Allow voicemail functionality</p>
                </div>
              </div>

              <div className="flex items-center">
                <Switch
                  checked={watchedFeatures?.callRecording}
                  onChange={(checked) => setValue('config.features.callRecording', checked)}
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">Call Recording</label>
                  <p className="text-xs text-gray-500">Enable call recording features</p>
                </div>
              </div>

              <div className="flex items-center">
                <Switch
                  checked={watchedFeatures?.ivr}
                  onChange={(checked) => setValue('config.features.ivr', checked)}
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">IVR</label>
                  <p className="text-xs text-gray-500">Interactive Voice Response</p>
                </div>
              </div>

              <div className="flex items-center">
                <Switch
                  checked={watchedFeatures?.conference}
                  onChange={(checked) => setValue('config.features.conference', checked)}
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">Conference</label>
                  <p className="text-xs text-gray-500">Conference calling features</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/tenants')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Tenant'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default TenantForm;