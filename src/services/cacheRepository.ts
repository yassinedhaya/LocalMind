import { NoteStorage } from './NoteStorage';
import { TaskStorage } from './TaskStorage';
import { TableStorage } from './TableStorage';
import { TimerStorage } from './TimerStorage';
import type { Note } from '../types/noteTypes';
import type { Task } from '../types/taskTypes';
import type { TableData } from '../types/tableTypes';

export interface DashboardData {
  notes: Note[];
  tasks: Task[];
  tables: TableData[];
  timerStats: {
    totalSessions: number;
    totalFocusTime: number;
    todaySessions: number;
    todayFocusTime: number;
    currentStreak: number;
  };
  loadedAt: number;
}

export interface DashboardCache {
  get(): Promise<DashboardData>;
  refresh(): Promise<DashboardData>;
  invalidate(): void;
}

let cached: DashboardData | null = null;

async function loadAll(): Promise<DashboardData> {
  const [notes, tasks, tables, timerStats] = await Promise.all([
    NoteStorage.getAll(),
    TaskStorage.getAll(),
    TableStorage.getAll(),
    TimerStorage.getStats(),
  ]);
  return {
    notes,
    tasks,
    tables,
    timerStats,
    loadedAt: Date.now(),
  };
}

export const dashboardCache: DashboardCache = {
  get(): Promise<DashboardData> {
    if (cached) return Promise.resolve(cached);
    return this.refresh();
  },
  async refresh(): Promise<DashboardData> {
    cached = await loadAll();
    return cached;
  },
  invalidate(): void {
    cached = null;
  },
};

/** Call this after any mutation to notes/tasks/tables/timer so the
 *  dashboard reloads fresh data the next time it is shown. */
export function invalidateDashboard(): void {
  dashboardCache.invalidate();
}
