/**
 * Error Boundary Component
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Production-ready error handling with reporting and recovery
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}`;
    
    this.setState({
      errorInfo
    });

    // Log error details
    console.error('🚨 Error Boundary caught an error:', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Send error to monitoring service
    this.reportError(error, errorInfo, errorId);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    try {
      // Send to Google Analytics if available
      if ('gtag' in window) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          error_id: errorId
        });
      }

      // Send to custom error reporting endpoint
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            errorId,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userId: localStorage.getItem('userId') || 'anonymous'
          })
        }).catch(err => {
          console.error('Failed to report error:', err);
        });
      }

      // Store error locally for debugging
      const errorLog = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      };

      const existingErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingErrors.push(errorLog);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(existingErrors));
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const errorText = JSON.stringify(errorDetails, null, 2);
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorText).then(() => {
        alert('Detalles del error copiados al portapapeles');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Detalles del error copiados al portapapeles');
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Ups! Algo salió mal
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              La aplicación ha encontrado un error inesperado. Nuestro equipo ha sido notificado automáticamente.
            </p>

            {/* Error ID */}
            {this.state.errorId && (
              <div className="bg-gray-100 rounded p-3 mb-6">
                <p className="text-sm text-gray-600">
                  ID del Error: <code className="font-mono">{this.state.errorId}</code>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar Página
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir al Inicio
                </button>
              </div>

              {import.meta.env.DEV && (
                <div className="space-y-3 pt-4 border-t">
                  <button
                    onClick={this.handleReset}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Intentar Recuperar (Dev)
                  </button>

                  <button
                    onClick={this.copyErrorDetails}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Copiar Detalles del Error
                  </button>

                  {/* Error Details for Development */}
                  <details className="text-left">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Ver detalles técnicos
                    </summary>
                    <div className="mt-3 bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                      <div>
                        <strong>Error:</strong> {this.state.error?.message}
                      </div>
                      {this.state.error?.stack && (
                        <div className="mt-2">
                          <strong>Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap text-xs">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div className="mt-2">
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap text-xs">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* Contact Support */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-500">
                Si el problema persiste, contacta a soporte técnico en{' '}
                <a 
                  href="mailto:support@ebrovalley.digital"
                  className="text-blue-600 hover:text-blue-700"
                >
                  support@ebrovalley.digital
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;