import React, { useState } from 'react';

// Card Components
export const Card = ({ className, children, ...props }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div className={`p-6 border-b border-slate-100 dark:border-slate-800/40 ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={`text-lg font-semibold text-slate-900 dark:text-slate-100 ${className || ''}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }) => (
  <p className={`text-sm text-slate-500 dark:text-slate-400 mt-1 ${className || ''}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={`p-6 ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => (
  <div className={`p-6 border-t border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/50 ${className || ''}`} {...props}>
    {children}
  </div>
);

// Button Component
export const Button = ({ variant = 'default', size = 'default', className, children, ...props }) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  const variants = {
    default: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-600',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-50',
    outline: 'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-500 dark:hover:bg-rose-600',
  };
  const sizes = {
    default: 'px-4 py-2 text-sm h-10',
    sm: 'px-3 py-1.5 text-xs h-8',
    lg: 'px-6 py-3 text-base h-12',
    icon: 'p-2 w-10 h-10',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className || ''}`} {...props}>
      {children}
    </button>
  );
};

// Input Component
export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow ${className || ''}`}
    {...props}
  />
));

// Label Component
export const Label = ({ className, children, ...props }) => (
  <label className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 ${className || ''}`} {...props}>
    {children}
  </label>
);

// Select Component
export const Select = React.forwardRef(({ className, options = [], ...props }, ref) => (
  <select
    ref={ref}
    className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow ${className || ''}`}
    {...props}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
));

// Progress Component
export const Progress = ({ value = 0, className, ...props }) => (
  <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden ${className || ''}`} {...props}>
    <div
      className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300 rounded-full"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// Badge Component
export const Badge = ({ variant = 'default', className, children, ...props }) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';
  const variants = {
    default: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800/30',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/30',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/50',
  };
  return (
    <span className={`${base} ${variants[variant]} ${className || ''}`} {...props}>
      {children}
    </span>
  );
};

// Tabs Components
export const Tabs = ({ defaultValue, children, className, ...props }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <div className={`space-y-4 ${className || ''}`} {...props}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        return React.cloneElement(child, { activeTab, setActiveTab });
      })}
    </div>
  );
};

export const TabsList = ({ activeTab, setActiveTab, children, className, ...props }) => (
  <div className={`flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg ${className || ''}`} {...props}>
    {React.Children.map(children, (child) => {
      if (!child) return null;
      return React.cloneElement(child, { activeTab, setActiveTab });
    })}
  </div>
);

export const TabsTrigger = ({ value, activeTab, setActiveTab, children, className, ...props }) => {
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab && setActiveTab(value)}
      type="button"
      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
        isActive
          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-white'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      } ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, activeTab, children, className, ...props }) => {
  if (activeTab !== value) return null;
  return (
    <div className={`transition-opacity duration-200 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

// Dialog Component
export const Dialog = ({ isOpen, onClose, title, description, children, footer, className }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all">
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${className || ''}`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-start">
          <div>
            {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
            {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-500 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
