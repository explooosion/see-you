import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export function useLocalStorage<T>(key: string, fallbackValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Initializing state with fallbackValue. This will be updated
  // to the actual value from localStorage when in a browser environment.
  const [value, setValue] = useState<T>(fallbackValue);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Retrieve stored value from localStorage if it exists
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored) as T);
      }
    }
  }, [key]);

  useEffect(() => {
    // Only set the localStorage item if we're in a browser
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}
