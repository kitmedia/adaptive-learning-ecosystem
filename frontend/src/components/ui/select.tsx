import React, { useState, useRef, useEffect } from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ children, value, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const selectRef = useRef<HTMLDivElement>(null);

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    setIsOpen(false);
    onValueChange?.(newValue);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            // @ts-ignore
            isOpen,
            setIsOpen,
            selectedValue,
            onValueChange: handleValueChange
          });
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps & any> = ({ 
  children, 
  className = '', 
  isOpen, 
  setIsOpen 
}) => {
  return (
    <button
      className={`
        flex h-10 w-full items-center justify-between rounded-md border border-gray-300 
        bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
      onClick={() => setIsOpen?.(!isOpen)}
    >
      {children}
      <svg
        className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

export const SelectContent: React.FC<SelectContentProps & any> = ({ 
  children, 
  className = '', 
  isOpen 
}) => {
  if (!isOpen) return null;

  return (
    <div className={`
      absolute top-full z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg
      ${className}
    `}>
      <div className="max-h-60 overflow-auto p-1">
        {children}
      </div>
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps & any> = ({ 
  value, 
  children, 
  className = '', 
  onValueChange,
  selectedValue 
}) => {
  const isSelected = selectedValue === value;

  return (
    <div
      className={`
        relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 
        text-sm outline-none hover:bg-gray-100 focus:bg-gray-100
        ${isSelected ? 'bg-gray-100' : ''}
        ${className}
      `}
      onClick={() => onValueChange?.(value)}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
      {children}
    </div>
  );
};

export const SelectValue: React.FC<SelectValueProps & any> = ({ 
  placeholder = '', 
  className = '', 
  selectedValue 
}) => {
  return (
    <span className={className}>
      {selectedValue || placeholder}
    </span>
  );
};