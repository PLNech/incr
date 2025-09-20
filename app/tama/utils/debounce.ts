import { useCallback, useRef } from 'react';

export const useDebounce = (callback: (...args: any[]) => void, delay: number = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  return useCallback((...args: any[]) => {
    // Prevent multiple calls while one is processing
    if (isProcessingRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set processing flag
    isProcessingRef.current = true;

    // Execute immediately and set timeout for reset
    callback(...args);

    timeoutRef.current = setTimeout(() => {
      isProcessingRef.current = false;
    }, delay);

  }, [callback, delay]);
};

export const useButtonDebounce = (callback: (...args: any[]) => void, delay: number = 500) => {
  return useDebounce(callback, delay);
};