// lib/components/Toast.tsx - Toast notification system

'use client';

import { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

let toastId = 0;

/**
 * useToast - Hook for managing toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration = 3000
  ) => {
    const id = `toast-${++toastId}`;
    const newToast: ToastMessage = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

/**
 * ToastContainer - Displays toast notifications
 */
export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) {
  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`border rounded-lg p-4 ${bgColors[toast.type]} max-w-sm animate-in slide-in-from-right pointer-events-auto`}
        >
          <div className="flex items-start gap-3">
            <span className={`text-lg font-bold flex-shrink-0 ${textColors[toast.type]}`}>
              {icons[toast.type]}
            </span>
            <div className="flex-1">
              <p className={`text-sm font-medium ${textColors[toast.type]}`}>{toast.message}</p>
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className={`text-lg hover:opacity-70 transition-opacity flex-shrink-0 ${textColors[toast.type]}`}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
