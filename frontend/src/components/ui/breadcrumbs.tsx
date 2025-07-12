import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Home className="h-4 w-4" />
      <span className="text-gray-400">/</span>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href && !item.active ? (
            <button 
              className="hover:text-primary-600 transition-colors"
              onClick={() => {/* Handle navigation */}}
            >
              {item.label}
            </button>
          ) : (
            <span className={item.active ? 'font-medium text-gray-900' : 'text-gray-600'}>
              {item.label}
            </span>
          )}
          
          {index < items.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;