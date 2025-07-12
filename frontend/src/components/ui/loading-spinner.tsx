import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <div
          className={`
            animate-spin rounded-full border-2 border-gray-300 border-t-blue-600
            ${spinnerSizes[size]}
          `}
        />
        {text && (
          <p className="text-sm text-gray-600">{text}</p>
        )}
      </div>
    </div>
  );
};

export const PageLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Cargando...' }) => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

export const ButtonLoadingSpinner: React.FC = () => {
  return (
    <LoadingSpinner size="sm" className="mr-2" />
  );
};