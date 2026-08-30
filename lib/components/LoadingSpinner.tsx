// lib/components/LoadingSpinner.tsx - Reusable loading spinner component

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

/**
 * LoadingSpinner - Generic loading indicator for async operations
 * Shows animated spinner with optional text
 */
export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className="flex flex-col items-center gap-3">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
        {text && <p className={`text-gray-600 ${textSizeClasses[size]}`}>{text}</p>}
      </div>
    </div>
  );
}
