'use client';

import React, { HTMLAttributes, forwardRef } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const variantStyles = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-lg',
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      animation = 'pulse',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const animationStyle = animation === 'pulse'
      ? 'animate-pulse'
      : animation === 'wave'
        ? 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]'
        : '';

    const defaultHeight = variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '100px';

    return (
      <div
        ref={ref}
        className={`
          bg-[var(--color-border)]
          ${variantStyles[variant]}
          ${animationStyle}
          ${className}
        `}
        style={{
          width: width || (variant === 'circular' ? '40px' : '100%'),
          height: height || defaultHeight,
          ...style,
        }}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = ''
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 bg-[var(--color-bg-secondary)] rounded-xl shadow-sm ${className}`}>
    <Skeleton variant="rounded" height="150px" className="mb-4" />
    <Skeleton variant="text" width="60%" className="mb-2" />
    <SkeletonText lines={2} />
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = ''
}) => (
  <Skeleton
    variant="circular"
    width={size}
    height={size}
    className={className}
  />
);

export const SkeletonButton: React.FC<{ width?: string | number; className?: string }> = ({
  width = '100px',
  className = ''
}) => (
  <Skeleton
    variant="rounded"
    width={width}
    height="40px"
    className={className}
  />
);

export default Skeleton;
