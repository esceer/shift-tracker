import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toISODate } from '@/domain/dates';
import type { ISODate } from '@/domain/types';

/** Today's date; updates at midnight and when the app comes back to the foreground. */
export function useToday(): ISODate {
  const [today, setToday] = useState(() => toISODate(new Date()));

  useEffect(() => {
    const update = () => setToday(toISODate(new Date()));
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(update, midnight.getTime() - now.getTime() + 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') update();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [today]);

  return today;
}
