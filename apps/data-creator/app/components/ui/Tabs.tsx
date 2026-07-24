'use client';

import React, { useState, createContext, useContext, HTMLAttributes, forwardRef } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  variant: 'default' | 'pills' | 'underline';
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'pills' | 'underline';
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value, onValueChange, className = '', children, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    // variant will be set by TabsList via context
    const [variant, setVariant] = useState<'default' | 'pills' | 'underline'>('default');

    const activeTab = value ?? internalValue;

    const setActiveTab = (newValue: string) => {
      if (!value) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab, variant }}>
        <div ref={ref} className={`w-full ${className}`} {...props}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement<TabsListProps>(child) && child.props.variant) {
              // Pass variant into context for triggers
              return React.cloneElement(child, {
                ...child.props,
                // @ts-expect-error internal prop
                _setVariant: setVariant,
              });
            }
            return child;
          })}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

const listVariantStyles = {
  default: 'bg-[var(--color-bg)] p-1 rounded-lg',
  pills: 'gap-1.5 p-1 rounded-xl bg-[var(--color-bg-secondary)]',
  underline: 'border-b border-[var(--color-border)] gap-4',
};

const triggerVariantStyles = {
  default: {
    base: 'rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
    inactive: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
    active: 'bg-[var(--color-bg-secondary)] text-[var(--color-primary)] shadow-sm',
  },
  pills: {
    base: 'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-250 tracking-wide',
    inactive: 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-overlay)]',
    active: 'bg-[var(--color-bg)] text-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-border)]',
  },
  underline: {
    base: 'px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-all duration-200',
    inactive: 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]',
    active: 'border-[var(--color-primary)] text-[var(--color-primary)]',
  },
};

export const TabsList = forwardRef<HTMLDivElement, TabsListProps & { _setVariant?: (v: 'default' | 'pills' | 'underline') => void }>(
  ({ variant = 'default', _setVariant, className = '', children, ...props }, ref) => {
    // Update parent context variant on mount
    React.useEffect(() => {
      _setVariant?.(variant);
    }, [variant, _setVariant]);

    return (
      <div
        ref={ref}
        role="tablist"
        className={`flex items-center ${listVariantStyles[variant]} ${className}`}
        data-variant={variant}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, disabled = false, icon, className = '', children, ...props }, ref) => {
    const { activeTab, setActiveTab, variant } = useTabsContext();
    const isActive = activeTab === value;

    const styles = triggerVariantStyles[variant] || triggerVariantStyles.default;

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        aria-controls={`panel-${value}`}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={() => !disabled && setActiveTab(value)}
        className={`
          ${styles.base}
          ${isActive ? styles.active : styles.inactive}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          inline-flex items-center gap-2
          ${className}
        `}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className = '', children, ...props }, ref) => {
    const { activeTab } = useTabsContext();

    if (activeTab !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`panel-${value}`}
        tabIndex={0}
        className={`mt-4 focus:outline-none animate-fadeIn ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = 'TabsContent';

export default Tabs;
