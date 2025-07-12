/**
 * Performance Monitor Component
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Real-time performance dashboard for development
 */

import React, { useState, useEffect } from 'react';
import { Activity, Zap, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { usePerformance } from '../hooks/usePerformance';

interface PerformanceMonitorProps {
  enabled?: boolean;
  showInProduction?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  showInProduction = false,
  position = 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { 
    metrics, 
    performanceScore, 
    isGood, 
    hasViolations,
    budget 
  } = usePerformance();

  // Only show in development unless explicitly enabled for production
  const shouldShow = enabled && (import.meta.env.DEV || showInProduction);

  useEffect(() => {
    if (shouldShow) {
      // Show after initial load
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  if (!shouldShow || !isVisible) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return CheckCircle;
    if (score >= 70) return AlertTriangle;
    return AlertTriangle;
  };

  const formatTime = (time: number | null) => {
    if (time === null) return 'N/A';
    return time < 1000 ? `${Math.round(time)}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  const formatBytes = (bytes: number | null) => {
    if (bytes === null) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const ScoreIcon = getScoreIcon(performanceScore);

  return (
    <div className={`fixed ${positionClasses[position]} z-50 font-mono text-xs`}>
      {/* Collapsed View */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          className={`
            cursor-pointer bg-black bg-opacity-80 text-white rounded-lg p-3 
            backdrop-blur-sm border border-gray-600 hover:bg-opacity-90 transition-all
            flex items-center gap-2 shadow-lg
          `}
        >
          <ScoreIcon className={`h-4 w-4 ${getScoreColor(performanceScore)}`} />
          <span className={getScoreColor(performanceScore)}>
            {Math.round(performanceScore)}
          </span>
          {hasViolations && (
            <AlertTriangle className="h-3 w-3 text-red-400" />
          )}
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-black bg-opacity-90 text-white rounded-lg p-4 backdrop-blur-sm border border-gray-600 shadow-xl min-w-[300px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="font-semibold text-white">Performance</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          {/* Performance Score */}
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ScoreIcon className={`h-5 w-5 ${getScoreColor(performanceScore)}`} />
              <span className="font-semibold">Score</span>
              <span className={`font-bold ${getScoreColor(performanceScore)}`}>
                {Math.round(performanceScore)}/100
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  performanceScore >= 90 
                    ? 'bg-green-500' 
                    : performanceScore >= 70 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${performanceScore}%` }}
              />
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="space-y-2 mb-4">
            <h4 className="font-semibold text-gray-300 text-xs uppercase tracking-wide">
              Core Web Vitals
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Zap className="h-3 w-3 text-blue-400" />
                  <span className="text-gray-300">FCP</span>
                </div>
                <div className="font-bold">
                  {formatTime(metrics.fcp)}
                </div>
                <div className="text-gray-500 text-xs">
                  &lt; {formatTime(budget.fcp)}
                </div>
              </div>

              <div className="bg-gray-800 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3 text-green-400" />
                  <span className="text-gray-300">LCP</span>
                </div>
                <div className="font-bold">
                  {formatTime(metrics.lcp)}
                </div>
                <div className="text-gray-500 text-xs">
                  &lt; {formatTime(budget.lcp)}
                </div>
              </div>

              <div className="bg-gray-800 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-purple-400" />
                  <span className="text-gray-300">FID</span>
                </div>
                <div className="font-bold">
                  {formatTime(metrics.fid)}
                </div>
                <div className="text-gray-500 text-xs">
                  &lt; {formatTime(budget.fid)}
                </div>
              </div>

              <div className="bg-gray-800 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="h-3 w-3 text-orange-400" />
                  <span className="text-gray-300">CLS</span>
                </div>
                <div className="font-bold">
                  {metrics.cls?.toFixed(3) || 'N/A'}
                </div>
                <div className="text-gray-500 text-xs">
                  &lt; {budget.cls}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="space-y-2 mb-4">
            <h4 className="font-semibold text-gray-300 text-xs uppercase tracking-wide">
              Additional Metrics
            </h4>
            
            <div className="bg-gray-800 rounded p-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Load Time</span>
                <span className="font-bold">{formatTime(metrics.loadTime)}</span>
              </div>
            </div>

            <div className="bg-gray-800 rounded p-2">
              <div className="flex justify-between">
                <span className="text-gray-300">DOM Ready</span>
                <span className="font-bold">{formatTime(metrics.domReady)}</span>
              </div>
            </div>

            <div className="bg-gray-800 rounded p-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Memory Usage</span>
                <span className="font-bold">{formatBytes(metrics.memoryUsage)}</span>
              </div>
            </div>

            {metrics.connectionType && (
              <div className="bg-gray-800 rounded p-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Connection</span>
                  <span className="font-bold uppercase">{metrics.connectionType}</span>
                </div>
              </div>
            )}
          </div>

          {/* Budget Violations */}
          {hasViolations && (
            <div className="space-y-2">
              <h4 className="font-semibold text-red-400 text-xs uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Budget Violations
              </h4>
              <div className="space-y-1">
                {metrics.budgetViolations.map((violation, index) => (
                  <div key={index} className="bg-red-900 bg-opacity-30 border border-red-700 rounded p-2">
                    <span className="text-red-300 text-xs">{violation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Performance Monitor</span>
              <span>v2.0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;