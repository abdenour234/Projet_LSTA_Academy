/**
 * Loading Spinner Component
 * Provides consistent loading states across the application
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /**
   * Size variant of the spinner
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Optional loading text to display
   */
  text?: string;
  
  /**
   * Whether to show full screen loading overlay
   */
  fullScreen?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

/**
 * LoadingSpinner - Reusable loading indicator
 * 
 * @example
 * // Simple spinner
 * <LoadingSpinner />
 * 
 * // With text
 * <LoadingSpinner size="lg" text="Chargement des données..." />
 * 
 * // Full screen overlay
 * <LoadingSpinner fullScreen text="Chargement..." />
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className,
}) => {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 
        className={cn(
          'animate-spin text-primary',
          sizeClasses[size]
        )} 
      />
      {text && (
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * PageLoadingSpinner - Full page loading state
 * Used by PrivateRoute and page-level components
 */
export const PageLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Chargement...' }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-slate-600 font-medium animate-pulse">
          {text}
        </p>
      </div>
    </div>
  );
};

/**
 * InlineLoadingSpinner - Small inline loading indicator
 * Used within buttons or small UI elements
 */
export const InlineLoadingSpinner: React.FC<{ text?: string; className?: string }> = ({ 
  text, 
  className 
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
