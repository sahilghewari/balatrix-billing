/**
 * Billing Invoices Page
 * View and manage all invoices
 */

import { InvoiceTable } from '../../../components/tables/InvoiceTable';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Download, FileText } from 'lucide-react';

export const Invoices = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Invoices
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and download your billing invoices
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      <InvoiceTable />
    </div>
  );
};

export default Invoices;
