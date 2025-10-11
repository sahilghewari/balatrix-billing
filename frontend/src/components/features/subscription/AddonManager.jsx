import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Switch } from '../../ui/Switch';
import { Plus, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../../../services/subscription';
import toast from 'react-hot-toast';

export const AddonManager = () => {
  const queryClient = useQueryClient();
  
  const { data: addons, isLoading } = useQuery({
    queryKey: ['addons'],
    queryFn: subscriptionService.getAddons,
  });

  const { data: activeAddons } = useQuery({
    queryKey: ['active-addons'],
    queryFn: subscriptionService.getActiveAddons,
  });

  const toggleAddonMutation = useMutation({
    mutationFn: ({ addonId, action }) => 
      action === 'add' 
        ? subscriptionService.addAddon(addonId) 
        : subscriptionService.removeAddon(addonId),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-addons']);
      queryClient.invalidateQueries(['subscription']);
      toast.success('Add-on updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update add-on');
    },
  });

  const isAddonActive = (addonId) => {
    return activeAddons?.some((a) => a.id === addonId);
  };

  const handleToggleAddon = (addon) => {
    const isActive = isAddonActive(addon.id);
    toggleAddonMutation.mutate({
      addonId: addon.id,
      action: isActive ? 'remove' : 'add',
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add-ons Marketplace
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Enhance your subscription with additional features
          </p>
        </div>
      </div>

      {/* Featured Add-ons */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Popular Add-ons
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addons
            ?.filter((addon) => addon.featured)
            .map((addon) => {
              const isActive = isAddonActive(addon.id);
              
              return (
                <Card
                  key={addon.id}
                  className={`p-6 relative ${
                    isActive ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  {isActive && (
                    <Badge
                      variant="success"
                      className="absolute -top-2 -right-2"
                    >
                      Active
                    </Badge>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {addon.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {addon.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ₹{addon.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        /{addon.billingType}
                      </span>
                    </div>
                    {addon.quarterlyDiscount && (
                      <p className="text-sm text-green-600 mt-1">
                        Save {addon.quarterlyDiscount}% on quarterly payment
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-4">
                    {addon.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isActive ? 'outline' : 'primary'}
                    fullWidth
                    onClick={() => handleToggleAddon(addon)}
                    isLoading={toggleAddonMutation.isLoading}
                  >
                    {isActive ? 'Remove' : 'Add to Plan'}
                  </Button>
                </Card>
              );
            })}
        </div>
      </div>

      {/* All Add-ons */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          All Add-ons
        </h3>
        <div className="space-y-3">
          {addons
            ?.filter((addon) => !addon.featured)
            .map((addon) => {
              const isActive = isAddonActive(addon.id);
              
              return (
                <Card key={addon.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start flex-1">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {addon.name}
                          </h4>
                          {isActive && (
                            <Badge variant="success" size="sm">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {addon.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-gray-900 dark:text-white">
                          ₹{addon.price}
                        </p>
                        <p className="text-xs text-gray-500">
                          /{addon.billingType}
                        </p>
                      </div>
                    </div>
                    <div className="ml-6">
                      <Switch
                        checked={isActive}
                        onChange={() => handleToggleAddon(addon)}
                        disabled={toggleAddonMutation.isLoading}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Active Add-ons Summary */}
      {activeAddons?.length > 0 && (
        <Card className="p-6 bg-primary-50 dark:bg-primary-900/20">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Add-ons Cost
          </h3>
          <div className="space-y-2">
            {activeAddons.map((addon) => (
              <div key={addon.id} className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {addon.name}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ₹{addon.price}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300 dark:border-gray-600">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-gray-900 dark:text-white">
                ₹{activeAddons.reduce((sum, a) => sum + a.price, 0)}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
