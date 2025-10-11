/**
 * Call History Page
 * Detailed call records
 */

import { CDRTable } from '../../../components/tables/CDRTable';

export const CallHistory = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Call History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Detailed call detail records (CDR)
        </p>
      </div>

      <CDRTable />
    </div>
  );
};

export default CallHistory;
