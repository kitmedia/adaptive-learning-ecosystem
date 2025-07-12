import React from 'react';

interface AlertProps {
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  children: React.ReactNode;
  className?: string;
}

interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const alertVariants = {
  default: 'bg-blue-50 border-blue-200 text-blue-900',
  destructive: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  success: 'bg-green-50 border-green-200 text-green-900'
};

export const Alert: React.FC<AlertProps> = ({ 
  variant = 'default', 
  children, 
  className = '' 
}) => {
  return (
    <div className={`
      relative w-full rounded-lg border p-4
      ${alertVariants[variant]}
      ${className}
    `}>
      {children}
    </div>
  );
};

export const AlertTitle: React.FC<AlertTitleProps> = ({ children, className = '' }) => {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className = '' }) => {
  return (
    <div className={`text-sm opacity-90 ${className}`}>
      {children}
    </div>
  );
};