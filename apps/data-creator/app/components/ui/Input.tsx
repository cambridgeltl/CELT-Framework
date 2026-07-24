'use client';

import React, { forwardRef, useId, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

interface InputFieldProps extends BaseInputProps, InputHTMLAttributes<HTMLInputElement> {
  multiline?: false;
  rows?: never;
}

interface TextAreaProps extends BaseInputProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  multiline: true;
  rows?: number;
}

type InputProps = InputFieldProps | TextAreaProps;

const baseInputStyles = `
  w-full px-4 py-2.5
  bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg
  text-[var(--color-text)] placeholder-[var(--color-text-muted)]
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const errorInputStyles = 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]';

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (props, ref) => {
    const {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      multiline,
      className = '',
      id,
      ...restProps
    } = props;

    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = !!error;
    const widthStyle = fullWidth ? 'w-full' : '';

    const inputClassName = `
      ${baseInputStyles}
      ${hasError ? errorInputStyles : ''}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon ? 'pr-10' : ''}
      ${className}
    `;

    return (
      <div className={`${widthStyle} space-y-1`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {leftIcon}
            </div>
          )}

          {multiline ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={inputId}
              className={inputClassName}
              rows={(props as TextAreaProps).rows || 3}
              aria-invalid={hasError}
              aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
              {...(restProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={inputId}
              className={inputClassName}
              aria-invalid={hasError}
              aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
              {...(restProps as InputHTMLAttributes<HTMLInputElement>)}
            />
          )}

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-[var(--color-danger)] font-medium"
            role="alert"
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="text-sm text-[var(--color-text-muted)]"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
