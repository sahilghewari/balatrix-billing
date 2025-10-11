/**
 * Payment Methods Page
 * Manage saved payment methods
 */

import { PaymentMethods as PaymentMethodsComponent } from '../../../components/features/billing/PaymentMethods';

export const Methods = () => {
  return (
    <div className="space-y-6">
      <PaymentMethodsComponent />
    </div>
  );
};

export default Methods;
