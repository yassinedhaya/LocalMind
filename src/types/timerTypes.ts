export interface TimerConfig {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerState {
  phase: TimerPhase;
  remainingSeconds: number;
  isRunning: boolean;
  completedFocusSessions: number;
  totalFocusTime: number;
}

export interface TimerSession {
  id: string;
  phase: TimerPhase;
  plannedDuration: number;
  actualDuration: number;
  wasCompleted: boolean;
  completedAt: number;
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
};

export function getNextPhase(currentPhase: TimerPhase, completedFocusSessions: number, config: TimerConfig): TimerPhase {
  if (currentPhase === 'focus') {
    const nextFocusCount = completedFocusSessions + 1;
    return nextFocusCount % config.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
  }
  return 'focus';
}

export function getPhaseDuration(phase: TimerPhase, config: TimerConfig): number {
  switch (phase) {
    case 'focus':
      return config.focusDuration;
    case 'shortBreak':
      return config.shortBreakDuration;
    case 'longBreak':
      return config.longBreakDuration;
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function getPhaseLabel(phase: TimerPhase): string {
  switch (phase) {
    case 'focus':
      return 'Focus';
    case 'shortBreak':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
  }
}

export function getPhaseColor(phase: TimerPhase): string {
  switch (phase) {
    case 'focus':
      return '#7C3AED';
    case 'shortBreak':
      return '#059669';
    case 'longBreak':
      return '#0891B2';
  }
}