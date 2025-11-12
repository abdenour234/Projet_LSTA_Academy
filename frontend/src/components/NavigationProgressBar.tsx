/**
 * Navigation Progress Bar
 * Shows a top loading bar during navigation transitions
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * NavigationProgressBar - Top loading bar for route transitions
 * 
 * Automatically shows during navigation events
 * Provides visual feedback during page loads
 */
export const NavigationProgressBar: React.FC = () => {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start loading on location change
    setIsNavigating(true);
    setProgress(30);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 150);

    // Complete after a short delay
    const completeTimeout = setTimeout(() => {
      setProgress(100);
      
      // Hide after completion
      setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
    };
  }, [location.pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-200">
      <div
        className="h-full bg-blue-600 transition-all duration-200 ease-out shadow-lg"
        style={{ 
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
};

export default NavigationProgressBar;
