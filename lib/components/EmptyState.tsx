// lib/components/EmptyState.tsx - Empty state component

export interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState - Displays helpful message when no data is available
 */
export function EmptyState({ title, message, icon = '📭', action }: EmptyStateProps) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm mt-2">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
