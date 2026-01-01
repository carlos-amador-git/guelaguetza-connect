import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Badge, getCategoryName } from '../../services/gamification';

interface BadgeCardProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  size = 'md',
  showDetails = false,
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  const isUnlocked = badge.isUnlocked;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${
        onClick ? 'hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95' : ''
      }`}
    >
      {/* Badge icon */}
      <div
        className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center relative ${
          isUnlocked
            ? 'bg-gradient-to-br from-oaxaca-yellow/20 to-oaxaca-pink/20 dark:from-oaxaca-yellow/10 dark:to-oaxaca-pink/10'
            : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`${iconSizes[size]} ${
            isUnlocked ? '' : 'grayscale opacity-30'
          }`}
        >
          {badge.icon}
        </span>

        {/* Lock overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock size={size === 'sm' ? 16 : 20} className="text-gray-400" />
          </div>
        )}

        {/* New badge sparkle */}
        {isUnlocked && badge.unlockedAt && isRecent(badge.unlockedAt) && (
          <div className="absolute -top-1 -right-1">
            <Sparkles size={16} className="text-oaxaca-yellow fill-oaxaca-yellow animate-pulse" />
          </div>
        )}
      </div>

      {/* Badge name */}
      <p
        className={`text-xs font-medium text-center leading-tight ${
          isUnlocked
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {badge.name}
      </p>

      {/* Details */}
      {showDetails && (
        <div className="text-center">
          <p className="text-xs text-gray-400">{badge.description}</p>
          {isUnlocked && badge.unlockedAt && (
            <p className="text-xs text-oaxaca-pink mt-1">
              {formatDate(badge.unlockedAt)}
            </p>
          )}
          {badge.xpReward > 0 && (
            <p className="text-xs text-oaxaca-yellow mt-1">
              +{badge.xpReward} XP
            </p>
          )}
        </div>
      )}
    </button>
  );
};

// Check if badge was unlocked in the last 24 hours
function isRecent(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff < 24 * 60 * 60 * 1000;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default BadgeCard;
