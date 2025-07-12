import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  subtitle?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: {
      background: 'bg-primary-50',
      icon: 'text-primary-600',
      iconBg: 'bg-primary-100',
      text: 'text-primary-600',
      accent: 'bg-primary-500'
    },
    green: {
      background: 'bg-secondary-50',
      icon: 'text-secondary-600',
      iconBg: 'bg-secondary-100',
      text: 'text-secondary-600',
      accent: 'bg-secondary-500'
    },
    orange: {
      background: 'bg-accent-50',
      icon: 'text-accent-600',
      iconBg: 'bg-accent-100',
      text: 'text-accent-600',
      accent: 'bg-accent-500'
    },
    purple: {
      background: 'bg-purple-50',
      icon: 'text-purple-600',
      iconBg: 'bg-purple-100',
      text: 'text-purple-600',
      accent: 'bg-purple-500'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className="card-professional p-6 hover:shadow-professional-lg transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold uppercase tracking-wide ${colors.text} mb-1`}>
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mb-3">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                trend.direction === 'up' 
                  ? 'bg-secondary-100 text-secondary-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {trend.direction === 'up' ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
          <div className={`w-12 h-1 ${colors.accent} rounded-full mt-3`}></div>
        </div>
        <div className={`p-4 ${colors.iconBg} rounded-2xl ml-4`}>
          <Icon className={`h-8 w-8 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;