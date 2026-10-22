import { useState, useEffect } from 'react';

/**
 * Debounce a value — only updates after `delay` ms of no changes.
 * Used to avoid filtering/searching on every keystroke.
 */
export function useDebounce(value, delay = 150) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
