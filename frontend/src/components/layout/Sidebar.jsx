/**
 * Sidebar Navigation Component
 * Side navigation menu with collapsible support
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  BarChart3,
  Phone,
  Settings,
  FileText,
  Package,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@utils/helpers';
import { ROUTES } from '@utils/constants';
import { useAuth } from '@hooks/useAuth';

const navigationItems = [
  {
    name: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    name: 'Subscriptions',
    href: ROUTES.SUBSCRIPTIONS,
    icon: Package,
  },
  {
    name: 'Billing',
    href: ROUTES.BILLING,
    icon: CreditCard,
  },
  {
    name: 'Usage',
    href: ROUTES.USAGE,
    icon: Phone,
  },
  {
    name: 'Analytics',
    href: ROUTES.ANALYTICS,
    icon: BarChart3,
  },
  {
    name: 'Invoices',
    href: ROUTES.INVOICES,
    icon: FileText,
  },
  {
    name: 'Account',
    href: ROUTES.ACCOUNT,
    icon: Settings,
  },
  {
    name: 'Support',
    href: ROUTES.SUPPORT,
    icon: HelpCircle,
  },
];

const adminNavigationItems = [
  {
    name: 'Admin',
    href: ROUTES.ADMIN,
    icon: Users,
  },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const allNavigationItems = isAdmin
    ? [...navigationItems, ...adminNavigationItems]
    : navigationItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="text-xl font-bold text-primary-600">
            Balatrix Billing
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {allNavigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 mr-3',
                    active ? 'text-primary-600' : 'text-gray-400'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="p-4 bg-primary-50 rounded-lg">
            <h3 className="text-sm font-semibold text-primary-900">
              Need Help?
            </h3>
            <p className="mt-1 text-xs text-primary-700">
              Check our documentation or contact support
            </p>
            <Link
              to={ROUTES.SUPPORT}
              className="mt-3 inline-block text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Get Support →
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
