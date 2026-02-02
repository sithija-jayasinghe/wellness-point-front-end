import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';

const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-lg border border-red-100">
      <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-red-900 mb-2">Something went wrong</h3>
      <p className="text-sm text-red-700 mb-6">{message || 'An error occurred while fetching data.'}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="bg-white hover:bg-red-50 border-red-200 text-red-700">
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
