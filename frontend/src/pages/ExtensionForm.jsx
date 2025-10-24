/**
 * Extension Form Component
 * Form for creating and editing SIP extensions
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Phone, Building } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { Card, Button, Input, Textarea, Spinner, Select, Switch } from '../components/common';
import { extensionService, tenantService } from '../api';

const extensionSchema = z.object({
  extensionNumber: z.string()
    .min(1, 'Extension number is required')
    .max(20, 'Extension number must be less than 20 characters')
    .regex(/^[0-9*#]+$/, 'Extension number can only contain digits, * and #'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must be less than 50 characters'),
  description: z.string().max(255, 'Description must be less than 255 characters').optional(),
  tenantId: z.string().min(1, 'Tenant is required'),
  isActive: z.boolean().default(true),
  config: z.object({
    callerIdName: z.string().max(50).optional(),
    callerIdNumber: z.string().max(20).optional(),
    voicemailEnabled: z.boolean().default(true),
    callRecording: z.boolean().default(false),
    maxCallDuration: z.number().min(30).max(3600).default(1800), // 30 seconds to 1 hour
    ringTimeout: z.number().min(5).max(120).default(30), // 5 seconds to 2 minutes
  }).default({}),
});

const ExtensionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(extensionSchema),
    defaultValues: {
      extensionNumber: '',
      password: '',
      description: '',
      tenantId: '',
      isActive: true,
      config: {
        callerIdName: '',
        callerIdNumber: '',
        voicemailEnabled: true,
        callRecording: false,
        maxCallDuration: 1800,
        ringTimeout: 30,
      },
    },
  });

  useEffect(() => {
    fetchTenants();
    if (isEditing) {
      fetchExtension();
    }
  }, [id]);

  const fetchTenants = async () => {
    try {
      const response = await tenantService.getTenants({ limit: 100 });
      setTenants(response.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants');
    }
  };

  const fetchExtension = async () => {
    try {
      setLoading(true);
      const response = await extensionService.getExtension(id);
      const extension = response.extension;

      reset({
        extensionNumber: extension.extensionNumber,
        password: '', // Don't populate password for security
        description: extension.description || '',
        tenantId: extension.tenantId,
        isActive: extension.isActive,
        config: {
          callerIdName: extension.config?.callerIdName || '',
          callerIdNumber: extension.config?.callerIdNumber || '',
          voicemailEnabled: extension.config?.voicemailEnabled ?? true,
          callRecording: extension.config?.callRecording || false,
          maxCallDuration: extension.config?.maxCallDuration || 1800,
          ringTimeout: extension.config?.ringTimeout || 30,
        },
      });
    } catch (error) {
      console.error('Error fetching extension:', error);
      toast.error('Failed to load extension');
      navigate('/admin/extensions');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);

      if (isEditing) {
        await extensionService.updateExtension(id, data);
        toast.success('Extension updated successfully');
      } else {
        await extensionService.createExtension(data);
        toast.success('Extension created successfully');
      }

      navigate('/admin/extensions');
    } catch (error) {
      console.error('Error saving extension:', error);
      toast.error(error.response?.data?.message || 'Failed to save extension');
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
            onClick={() => navigate('/admin/extensions')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Extensions
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Extension' : 'Create Extension'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEditing ? 'Update extension configuration and settings.' : 'Add a new SIP extension to the system.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Phone className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extension Number *
                </label>
                <Input
                  {...register('extensionNumber')}
                  placeholder="Enter extension number (e.g., 1001)"
                  error={errors.extensionNumber?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  {...register('password')}
                  placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter password'}
                  error={errors.password?.message}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant *
              </label>
              <Select
                {...register('tenantId')}
                error={errors.tenantId?.message}
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.domain})
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                {...register('description')}
                placeholder="Enter extension description"
                rows={2}
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
                  Active Extension
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Inactive extensions cannot receive or make calls.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Call Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caller ID Name
                </label>
                <Input
                  {...register('config.callerIdName')}
                  placeholder="Display name for outgoing calls"
                  error={errors.config?.callerIdName?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caller ID Number
                </label>
                <Input
                  {...register('config.callerIdNumber')}
                  placeholder="Display number for outgoing calls"
                  error={errors.config?.callerIdNumber?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Call Duration (seconds)
                </label>
                <Input
                  type="number"
                  {...register('config.maxCallDuration', { valueAsNumber: true })}
                  placeholder="1800"
                  min="30"
                  max="3600"
                  error={errors.config?.maxCallDuration?.message}
                />
                <p className="mt-1 text-xs text-gray-500">30 seconds to 1 hour</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ring Timeout (seconds)
                </label>
                <Input
                  type="number"
                  {...register('config.ringTimeout', { valueAsNumber: true })}
                  placeholder="30"
                  min="5"
                  max="120"
                  error={errors.config?.ringTimeout?.message}
                />
                <p className="mt-1 text-xs text-gray-500">5 seconds to 2 minutes</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Features</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <Switch
                  checked={watch('config.voicemailEnabled')}
                  onChange={(checked) => setValue('config.voicemailEnabled', checked)}
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">Voicemail</label>
                  <p className="text-xs text-gray-500">Allow voicemail functionality</p>
                </div>
              </div>

              <div className="flex items-center">
                <Switch
                  checked={watch('config.callRecording')}
                  onChange={(checked) => setValue('config.callRecording', checked)}
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">Call Recording</label>
                  <p className="text-xs text-gray-500">Record all calls for this extension</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/extensions')}
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
              {saving ? 'Saving...' : 'Save Extension'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default ExtensionForm;