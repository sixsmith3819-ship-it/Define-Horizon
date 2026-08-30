// lib/components/ErrorAlert.tsx - Error alert component

'use client';

import { useState } from 'react';

export interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  dismissible?: boolean;
}

/**
 * ErrorAlert - Displays error messages with optional retry and dismiss actions
 */
export function ErrorAlert({ message, onRetry, dismissible = true }: ErrorAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            <span className="text-red-600 font-bold">✕</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 ml-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
            >
              Retry
            </button>
          )}
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
