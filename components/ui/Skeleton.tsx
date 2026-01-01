import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'shimmer' | 'pulse' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const animationClasses = {
    shimmer: 'animate-shimmer',
    pulse: 'animate-pulse',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1rem' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Skeleton for story cards in grid
export const SkeletonStoryCard: React.FC = () => (
  <div className="flex flex-col items-center gap-2">
    <Skeleton variant="circular" width={64} height={64} />
    <Skeleton variant="text" width={60} height={12} />
  </div>
);

// Skeleton for full story view
export const SkeletonStoryFull: React.FC = () => (
  <div className="h-full w-full flex flex-col">
    {/* Header */}
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width={120} height={14} className="mb-1" />
        <Skeleton variant="text" width={80} height={10} />
      </div>
    </div>
    {/* Content area */}
    <div className="flex-1 bg-gray-300 dark:bg-gray-800 animate-pulse" />
    {/* Actions */}
    <div className="absolute bottom-20 left-4 right-4 z-10">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
    </div>
  </div>
);

// Skeleton for event cards
export const SkeletonEventCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-gray-200 dark:border-gray-700">
    <div className="flex items-start gap-3">
      <Skeleton variant="rounded" width={42} height={42} />
      <div className="flex-1">
        <Skeleton variant="text" width="70%" height={16} className="mb-2" />
        <div className="flex items-center gap-3">
          <Skeleton variant="text" width={60} height={12} />
          <Skeleton variant="text" width={80} height={12} />
        </div>
      </div>
    </div>
  </div>
);

// Skeleton for avatar
export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Skeleton variant="circular" width={size} height={size} />
);

export default Skeleton;
