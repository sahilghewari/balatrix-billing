import { Phone, CreditCard, FileText, HelpCircle, ArrowUp } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Phone,
      label: 'Make Test Call',
      description: 'Test your setup',
      action: () => navigate('/usage/test-call'),
      color: 'primary',
    },
    {
      icon: CreditCard,
      label: 'Add Funds',
      description: 'Top up your balance',
      action: () => navigate('/billing/add-funds'),
      color: 'success',
    },
    {
      icon: FileText,
      label: 'Download Invoice',
      description: 'Latest billing invoice',
      action: () => navigate('/billing/invoices'),
      color: 'info',
    },
    {
      icon: HelpCircle,
      label: 'Contact Support',
      description: 'Get help instantly',
      action: () => navigate('/support/contact'),
      color: 'warning',
    },
    {
      icon: ArrowUp,
      label: 'Upgrade Plan',
      description: 'More features & limits',
      action: () => navigate('/subscription/upgrade'),
      color: 'primary',
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 text-center group"
            >
              <div className={`p-3 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/20 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-400`} />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-3">
                {action.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
