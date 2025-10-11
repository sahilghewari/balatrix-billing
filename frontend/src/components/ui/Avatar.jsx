/**
 * Avatar Component
 * User avatar component with initials fallback
 */

import React from 'react';
import { cn } from '@utils/helpers';
import { getInitials } from '@utils/helpers';

const avatarSizes = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-24 w-24 text-2xl',
};

export const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  className = '',
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);

  const sizeClass = avatarSizes[size] || avatarSizes.md;
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

  const initials = name ? getInitials(name) : '?';

  const handleImageError = () => {
    setImageError(true);
  };

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        onError={handleImageError}
        className={cn(
          'object-cover',
          sizeClass,
          shapeClass,
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center bg-primary-100 text-primary-700 font-medium',
        sizeClass,
        shapeClass,
        className
      )}
      {...props}
    >
      {initials}
    </div>
  );
};

Avatar.displayName = 'Avatar';

export default Avatar;
