import { useRef } from "react";

export default function useDebounce<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  const timer = useRef<number | undefined>(undefined);

  return (...args: Parameters<T>) => {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
    // @ts-ignore
    timer.current = window.setTimeout(() => fn(...args), wait);
  };
}
