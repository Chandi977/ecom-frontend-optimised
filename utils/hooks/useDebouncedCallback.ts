import { useEffect, useMemo, useRef } from "react";

// Lightweight debounce hook for inputs/search
export const useDebouncedCallback = (callback, delay = 300) => {
  const timerRef = useRef<any>(null);

  const debounced = useMemo(
    () =>
      (...args) => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          callback(...args);
        }, delay);
      },
    [callback, delay],
  );

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return debounced;
};
