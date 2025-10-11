/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

import React, { Component } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@components/ui';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-error-100 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-error-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <p className="text-sm font-mono text-error-600">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                fullWidth
              >
                Reload Page
              </Button>
              
              <Button
                onClick={this.handleReset}
                variant="outline"
                fullWidth
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
