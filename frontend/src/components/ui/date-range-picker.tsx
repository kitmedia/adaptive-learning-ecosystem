import React, { useState } from 'react';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar rango de fechas',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>(
    value || { from: null, to: null }
  );

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDisplayValue = () => {
    if (selectedRange.from && selectedRange.to) {
      return `${formatDate(selectedRange.from)} - ${formatDate(selectedRange.to)}`;
    }
    if (selectedRange.from) {
      return formatDate(selectedRange.from);
    }
    return placeholder;
  };

  const handleFromDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value) : null;
    const newRange = { ...selectedRange, from: date };
    setSelectedRange(newRange);
    onChange?.(newRange);
  };

  const handleToDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value) : null;
    const newRange = { ...selectedRange, to: date };
    setSelectedRange(newRange);
    onChange?.(newRange);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedRange.from ? 'text-gray-900' : 'text-gray-500'}>
          {getDisplayValue()}
        </span>
        <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-4 shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha desde
              </label>
              <input
                type="date"
                value={selectedRange.from ? selectedRange.from.toISOString().split('T')[0] : ''}
                onChange={handleFromDateChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha hasta
              </label>
              <input
                type="date"
                value={selectedRange.to ? selectedRange.to.toISOString().split('T')[0] : ''}
                onChange={handleToDateChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                Aplicar
              </button>
              <button
                onClick={() => {
                  const emptyRange = { from: null, to: null };
                  setSelectedRange(emptyRange);
                  onChange?.(emptyRange);
                  setIsOpen(false);
                }}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};