/**
 * Add-ons Page
 * Browse and manage subscription add-ons
 */

import { AddonManager } from '../../../components/features/subscription/AddonManager';

export const Addons = () => {
  return (
    <div className="space-y-6">
      <AddonManager />
    </div>
  );
};

export default Addons;
