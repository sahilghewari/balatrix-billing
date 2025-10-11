/**
 * Tabs Component
 * Tab navigation component
 */

import React, { useState } from 'react';
import { cn } from '@utils/helpers';

export const Tabs = ({
  tabs = [],
  defaultValue,
  value: controlledValue,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);
  
  const isControlled = controlledValue !== undefined;
  const currentTab = isControlled ? controlledValue : activeTab;

  const handleTabChange = (value) => {
    if (!isControlled) {
      setActiveTab(value);
    }
    if (onChange) {
      onChange(value);
    }
  };

  const currentTabContent = tabs.find(tab => tab.value === currentTab)?.content;

  const variantStyles = {
    underline: {
      container: 'border-b border-gray-200',
      button: 'px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors duration-200',
      active: 'border-primary-600 text-primary-600',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg',
      button: 'px-4 py-2 rounded-md font-medium text-sm transition-all duration-200',
      active: 'bg-white text-primary-600 shadow-sm',
      inactive: 'text-gray-600 hover:text-gray-900',
    },
  };

  const styles = variantStyles[variant] || variantStyles.underline;

  return (
    <div className={cn('w-full', className)}>
      {/* Tab List */}
      <div className={cn('flex space-x-1', styles.container)} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={currentTab === tab.value}
            aria-controls={`tabpanel-${tab.value}`}
            onClick={() => handleTabChange(tab.value)}
            disabled={tab.disabled}
            className={cn(
              styles.button,
              currentTab === tab.value ? styles.active : styles.inactive,
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
            {tab.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panel */}
      <div
        role="tabpanel"
        id={`tabpanel-${currentTab}`}
        aria-labelledby={`tab-${currentTab}`}
        className="mt-4"
      >
        {currentTabContent}
      </div>
    </div>
  );
};

Tabs.displayName = 'Tabs';

export default Tabs;
