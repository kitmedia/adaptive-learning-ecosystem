import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Buscar cursos, lecciones...", 
  onSearch,
  onClear,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused 
          ? 'ring-2 ring-primary-500 ring-opacity-50' 
          : 'border border-gray-300'
      } rounded-lg bg-white shadow-sm`}>
        <Search className="h-5 w-5 text-gray-400 ml-3" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 py-3 px-3 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 mr-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
      
      {/* Search suggestions dropdown (placeholder) */}
      {isFocused && query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
              <div className="font-medium text-gray-900">Introducción a la IA</div>
              <div className="text-sm text-gray-500">Curso • 12 lecciones</div>
            </div>
            <div className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
              <div className="font-medium text-gray-900">Machine Learning Básico</div>
              <div className="text-sm text-gray-500">Lección • Curso de IA</div>
            </div>
            <div className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
              <div className="font-medium text-gray-900">Desarrollo Web Moderno</div>
              <div className="text-sm text-gray-500">Curso • 16 lecciones</div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default SearchBar;