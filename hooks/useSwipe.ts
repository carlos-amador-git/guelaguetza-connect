import { useState, useCallback, useRef } from 'react';

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for a swipe (default: 50px)
  preventScroll?: boolean;
}

interface UseSwipeReturn {
  handlers: SwipeHandlers;
  deltaX: number;
  deltaY: number;
  isSwiping: boolean;
}

const useSwipe = (options: UseSwipeOptions = {}): UseSwipeReturn => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventScroll = false,
  } = options;

  const [state, setState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false,
  });

  const swipeRef = useRef<SwipeState>(state);
  swipeRef.current = state;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: true,
    });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeRef.current.isSwiping) return;

    const touch = e.touches[0];
    setState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));

    if (preventScroll) {
      e.preventDefault();
    }
  }, [preventScroll]);

  const onTouchEnd = useCallback(() => {
    const { startX, startY, currentX, currentY, isSwiping } = swipeRef.current;

    if (!isSwiping) return;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if it's a horizontal or vertical swipe
    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    setState(prev => ({
      ...prev,
      isSwiping: false,
    }));
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  const deltaX = state.currentX - state.startX;
  const deltaY = state.currentY - state.startY;

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    deltaX,
    deltaY,
    isSwiping: state.isSwiping,
  };
};

export default useSwipe;
