/**
 * Notification Preferences Page
 * Manage notification settings
 */

import { Card } from '../../../components/ui/Card';
import { Switch } from '../../../components/ui/Switch';
import { Button } from '../../../components/ui/Button';
import { Bell, Mail, Smartphone, DollarSign, Phone, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export const Notifications = () => {
  const [emailNotifications, setEmailNotifications] = useState({
    invoices: true,
    payments: true,
    usage: true,
    marketing: false,
  });

  const [smsNotifications, setSmsNotifications] = useState({
    lowBalance: true,
    usageAlerts: true,
    paymentConfirmation: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Notification Preferences
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Choose how you want to receive notifications
        </p>
      </div>

      {/* Email Notifications */}
      <Card className="p-6">
        <div className="flex items-start space-x-3 mb-6">
          <Mail className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email Notifications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Receive updates via email
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Invoice Notifications
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when new invoices are generated
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications.invoices}
              onChange={(checked) =>
                setEmailNotifications({ ...emailNotifications, invoices: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Payment Confirmations
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive confirmation when payments are processed
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications.payments}
              onChange={(checked) =>
                setEmailNotifications({ ...emailNotifications, payments: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Usage Reports
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Weekly usage summary and analytics
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications.usage}
              onChange={(checked) =>
                setEmailNotifications({ ...emailNotifications, usage: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-start space-x-3">
              <Bell className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Marketing & Updates
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Product updates, tips, and promotional offers
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications.marketing}
              onChange={(checked) =>
                setEmailNotifications({ ...emailNotifications, marketing: checked })
              }
            />
          </div>
        </div>
      </Card>

      {/* SMS Notifications */}
      <Card className="p-6">
        <div className="flex items-start space-x-3 mb-6">
          <Smartphone className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              SMS Notifications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Receive urgent alerts via SMS
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Low Balance Alerts
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alert when balance falls below threshold
                </p>
              </div>
            </div>
            <Switch
              checked={smsNotifications.lowBalance}
              onChange={(checked) =>
                setSmsNotifications({ ...smsNotifications, lowBalance: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Usage Limit Alerts
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alert when approaching usage limits
                </p>
              </div>
            </div>
            <Switch
              checked={smsNotifications.usageAlerts}
              onChange={(checked) =>
                setSmsNotifications({ ...smsNotifications, usageAlerts: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-start space-x-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Payment Confirmations
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SMS confirmation for successful payments
                </p>
              </div>
            </div>
            <Switch
              checked={smsNotifications.paymentConfirmation}
              onChange={(checked) =>
                setSmsNotifications({
                  ...smsNotifications,
                  paymentConfirmation: checked,
                })
              }
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button>Save Preferences</Button>
      </div>
    </div>
  );
};

export default Notifications;
