/**
 * PageContainer Component
 * Provides consistent width constraints and spacing for different page types
 */

import { ReactNode } from 'react';

type ContainerWidth = 'narrow' | 'standard' | 'wide' | 'full';

interface PageContainerProps {
  children: ReactNode;
  width?: ContainerWidth;
  className?: string;
}

const widthClasses: Record<ContainerWidth, string> = {
  narrow: 'max-w-2xl',    // 672px - Simple forms
  standard: 'max-w-4xl',  // 896px - Standard forms  
  wide: 'max-w-6xl',      // 1152px - Complex forms
  full: 'max-w-7xl',      // 1280px - Tables, dashboards
};

export function PageContainer({ 
  children, 
  width = 'full',
  className = '' 
}: PageContainerProps) {
  return (
    <div className={`mx-auto ${widthClasses[width]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * FormCard Component
 * Consistent card styling for forms
 */
interface FormCardProps {
  children: ReactNode;
  className?: string;
}

export function FormCard({ children, className = '' }: FormCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * PageHeader Component
 * Consistent page header styling
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-gray-600 mt-1">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
