import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  children: React.ReactNode;
  className?: string;
}

const badgeVariants = {
  default: 'bg-blue-600 text-white',
  secondary: 'bg-gray-100 text-gray-900',
  destructive: 'bg-red-600 text-white',
  outline: 'border border-gray-300 text-gray-700',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-600 text-white'
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className = '',
  children
}) => {
  return (
    <div
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${badgeVariants[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};