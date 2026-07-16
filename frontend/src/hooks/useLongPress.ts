import { useState, useRef, useCallback } from 'react';

const LONG_PRESS_DURATION = 500; // 500ms pour considérer comme long press

type UseLongPressResult = {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onClickCapture: (e: React.MouseEvent) => void;
  isLongPressed: boolean;
};

export const useLongPress = (
  onLongPress: () => void,
  onShortPress?: () => void
): UseLongPressResult => {
  const [isLongPressed, setIsLongPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pressStartRef = useRef(0);
  const shouldBlockClickRef = useRef(false);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Don't trigger if it's not left mouse button
    if (e instanceof MouseEvent && e.button !== 0) return;
    
    console.log("[LongPress] Press started");
    longPressTriggeredRef.current = false;
    shouldBlockClickRef.current = false;
    setIsLongPressed(false);
    pressStartRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      console.log("[LongPress] Long press triggered (500ms elapsed)");
      longPressTriggeredRef.current = true;
      shouldBlockClickRef.current = true;
      setIsLongPressed(true);
      onLongPress();
    }, LONG_PRESS_DURATION);
  }, [onLongPress]);

  const handleEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const pressDuration = Date.now() - pressStartRef.current;
    const wasLongPress = longPressTriggeredRef.current;
    
    console.log("[LongPress] Press ended", { 
      duration: pressDuration,
      wasLongPress
    });

    // If it was a SHORT press (< 500ms), execute short press action
    if (!wasLongPress && pressDuration < LONG_PRESS_DURATION) {
      console.log("[LongPress] Short press detected, calling onShortPress");
      shouldBlockClickRef.current = false; // Allow click to bubble
      if (onShortPress) {
        onShortPress();
      }
    } else if (wasLongPress) {
      // Long press was triggered, block any subsequent clicks
      shouldBlockClickRef.current = true;
    }

    setIsLongPressed(false);
  }, [onShortPress]);

  const handleCancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    longPressTriggeredRef.current = false;
    shouldBlockClickRef.current = false;
    setIsLongPressed(false);
  }, []);

  // Block click if long press was triggered - use capture phase to intercept early
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (shouldBlockClickRef.current) {
      console.log("[LongPress] Blocking click because long press was triggered");
      e.preventDefault();
      e.stopPropagation();
      shouldBlockClickRef.current = false; // Reset for next press
    }
  }, []);

  return {
    onMouseDown: handleStart,
    onMouseUp: handleEnd,
    onMouseLeave: handleCancel,
    onTouchStart: handleStart,
    onTouchEnd: handleEnd,
    onClickCapture: handleClickCapture,
    isLongPressed,
  };
};
