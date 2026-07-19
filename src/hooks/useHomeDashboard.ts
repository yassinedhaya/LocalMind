import { useCallback, useEffect, useState } from 'react';
import { dashboardCache, DashboardData } from '../services/cacheRepository';
import { TaskStorage } from '../services/TaskStorage';
import { NoteStorage } from '../services/NoteStorage';
import { TableStorage } from '../services/TableStorage';
import { TimerStorage } from '../services/TimerStorage';

export function useHomeDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await dashboardCache.refresh();
    setData(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    // Always reload fresh from storage on mount: the dashboard is remounted
    // each time the user navigates back to it, so a stale cache must not
    // hide newly added tables/notes/tasks/timer sessions.
    dashboardCache.refresh().then((d) => {
      if (active) {
        setData(d);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Subscribe to storage mutations by reloading after each save.
  const reload = useCallback(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh, reload };
}

export async function dashboardInvalidateAndReload(): Promise<void> {
  await dashboardCache.refresh();
}

// Re-export storage for convenience in the dashboard screen.
export { TaskStorage, NoteStorage, TableStorage, TimerStorage };
