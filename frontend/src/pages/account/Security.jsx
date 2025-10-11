/**
 * Security Settings Page
 * Password, 2FA, and security settings
 */

import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Switch } from '../../../components/ui/Switch';
import { Shield, Lock, Smartphone, Key } from 'lucide-react';
import { useState } from 'react';

export const Security = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Security Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account security and authentication
        </p>
      </div>

      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-start space-x-3 mb-6">
          <Lock className="w-6 h-6 text-primary-600" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Change Password
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Update your password regularly to keep your account secure
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <Input type="password" placeholder="Enter current password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <Input type="password" placeholder="Enter new password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <Input type="password" placeholder="Confirm new password" />
          </div>
          <Button>Update Password</Button>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-3">
            <Smartphone className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onChange={setTwoFactorEnabled}
          />
        </div>

        {twoFactorEnabled && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Two-factor authentication is enabled. You'll need to enter a code from your authenticator app when signing in.
            </p>
          </div>
        )}
      </Card>

      {/* API Keys */}
      <Card className="p-6">
        <div className="flex items-start space-x-3 mb-6">
          <Key className="w-6 h-6 text-primary-600" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              API Keys
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your API keys for programmatic access
            </p>
          </div>
          <Button variant="outline" size="sm">
            Generate New Key
          </Button>
        </div>

        <div className="text-center py-8 text-gray-500">
          No API keys generated yet
        </div>
      </Card>

      {/* Active Sessions */}
      <Card className="p-6">
        <div className="flex items-start space-x-3 mb-6">
          <Shield className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Active Sessions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage devices where you're currently logged in
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Current Session
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Windows • Chrome • India
                </p>
              </div>
              <Button variant="ghost" size="sm" disabled>
                Active Now
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Security;
