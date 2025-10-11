/**
 * Alert Component
 * Alert/notification component for displaying messages
 */

import React from 'react';
import { cn } from '@utils/helpers';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const alertVariants = {
  success: {
    container: 'bg-success-50 border-success-200 text-success-800',
    icon: CheckCircle,
    iconColor: 'text-success-500',
  },
  error: {
    container: 'bg-error-50 border-error-200 text-error-800',
    icon: XCircle,
    iconColor: 'text-error-500',
  },
  warning: {
    container: 'bg-warning-50 border-warning-200 text-warning-800',
    icon: AlertCircle,
    iconColor: 'text-warning-500',
  },
  info: {
    container: 'bg-info-50 border-info-200 text-info-800',
    icon: Info,
    iconColor: 'text-info-500',
  },
};

export const Alert = ({
  variant = 'info',
  title,
  children,
  icon: CustomIcon,
  closable = false,
  onClose,
  className = '',
  ...props
}) => {
  const [visible, setVisible] = React.useState(true);

  const variantConfig = alertVariants[variant] || alertVariants.info;
  const Icon = CustomIcon || variantConfig.icon;

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-lg border',
        variantConfig.container,
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex items-start">
        {Icon && (
          <Icon
            className={cn(
              'h-5 w-5 mr-3 flex-shrink-0 mt-0.5',
              variantConfig.iconColor
            )}
          />
        )}
        
        <div className="flex-1">
          {title && (
            <h3 className="font-semibold mb-1">
              {title}
            </h3>
          )}
          {children && (
            <div className="text-sm">
              {children}
            </div>
          )}
        </div>
        
        {closable && (
          <button
            onClick={handleClose}
            className={cn(
              'ml-3 flex-shrink-0 hover:opacity-70 transition-opacity',
              variantConfig.iconColor
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

Alert.displayName = 'Alert';

export default Alert;
