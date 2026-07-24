'use client';

import React, { HTMLAttributes, forwardRef } from 'react';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside' | 'top';
  animated?: boolean;
  striped?: boolean;
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const variantStyles = {
  default: 'bg-[var(--color-primary)]',
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger)]',
  gradient: 'bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-info)] to-[var(--color-success)]',
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      size = 'md',
      variant = 'default',
      showLabel = false,
      labelPosition = 'outside',
      animated = false,
      striped = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const roundedPercentage = Math.round(percentage);

    const stripedStyle = striped
      ? 'bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)]'
      : '';

    const animatedStyle = animated ? 'animate-[progress-stripes_1s_linear_infinite]' : '';

    const label = `${roundedPercentage}%`;

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {showLabel && labelPosition === 'top' && (
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-[var(--color-text)]">Progress</span>
            <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div
            className={`
              flex-1 bg-[var(--color-border)] rounded-full overflow-hidden
              ${sizeStyles[size]}
            `}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={`${roundedPercentage}% complete`}
          >
            <div
              className={`
                h-full rounded-full transition-all duration-500 ease-out
                ${variantStyles[variant]}
                ${stripedStyle}
                ${animatedStyle}
              `}
              style={{ width: `${percentage}%` }}
            >
              {showLabel && labelPosition === 'inside' && size === 'lg' && (
                <span className="flex items-center justify-center h-full text-xs font-medium text-white">
                  {label}
                </span>
              )}
            </div>
          </div>

          {showLabel && labelPosition === 'outside' && (
            <span className="flex-shrink-0 text-sm font-medium text-[var(--color-text)] min-w-[3rem] text-right">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export default Progress;
