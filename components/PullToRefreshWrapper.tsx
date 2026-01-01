import React from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PullToRefreshWrapper: React.FC<PullToRefreshWrapperProps> = ({
  onRefresh,
  children,
  className = '',
}) => {
  const { containerRef, pullDistance, isRefreshing, progress, handlers } =
    usePullToRefresh({
      onRefresh,
      threshold: 80,
    });

  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Pull Indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center z-30 pointer-events-none transition-opacity duration-200"
        style={{
          transform: `translateY(${Math.max(pullDistance - 50, -50)}px)`,
          opacity: showIndicator ? 1 : 0,
        }}
      >
        <div
          className={`w-10 h-10 rounded-full bg-oaxaca-pink flex items-center justify-center shadow-lg ${
            isRefreshing ? 'animate-pulse' : ''
          }`}
        >
          {isRefreshing ? (
            <Loader2 className="text-white animate-spin" size={20} />
          ) : (
            <ArrowDown
              className="text-white transition-transform duration-200"
              size={20}
              style={{ transform: `rotate(${progress * 180}deg)` }}
            />
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={containerRef}
        onTouchStart={handlers.onTouchStart}
        onTouchMove={handlers.onTouchMove}
        onTouchEnd={handlers.onTouchEnd}
        className="h-full overflow-y-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefreshWrapper;
