import { useRef, useEffect, useCallback } from "react";

export default function useDebounce<T extends (...args: unknown[]) => unknown>(fn: T, wait = 300) {
  const fnRef = useRef(fn);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Keep fnRef up to date
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => fnRef.current(...args), wait);
  }, [wait]);
}
