import React, { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { followUser, unfollowUser } from '../../services/social';
import { useAuth } from '../../contexts/AuthContext';
import haptics from '../../services/haptics';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline';
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing: initialIsFollowing,
  onFollowChange,
  size = 'md',
  variant = 'primary',
}) => {
  const { token, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const handleClick = async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    setIsLoading(true);
    haptics.tap();

    try {
      if (isFollowing) {
        await unfollowUser(userId, token);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followUser(userId, token);
        setIsFollowing(true);
        onFollowChange?.(true);
        haptics.success();
      }
    } catch (error) {
      console.error('Follow error:', error);
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const baseClasses = `
    font-medium rounded-full flex items-center justify-center gap-1.5
    transition-all duration-200 active:scale-95 disabled:opacity-50
  `;

  const variantClasses = isFollowing
    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 border border-gray-200 dark:border-gray-600'
    : variant === 'primary'
    ? 'bg-oaxaca-pink text-white hover:bg-oaxaca-pink/90'
    : 'border-2 border-oaxaca-pink text-oaxaca-pink hover:bg-oaxaca-pink hover:text-white';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses}`}
    >
      {isLoading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus size={size === 'sm' ? 14 : 16} />
          <span>Siguiendo</span>
        </>
      ) : (
        <>
          <UserPlus size={size === 'sm' ? 14 : 16} />
          <span>Seguir</span>
        </>
      )}
    </button>
  );
};

export default FollowButton;
