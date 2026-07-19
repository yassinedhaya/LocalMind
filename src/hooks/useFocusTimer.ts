import { useCallback } from 'react';
import { useTimer } from './useTimer';
import {
  TimerConfig,
  TimerPhase,
  TimerState,
  formatTime,
} from '../types/timerTypes';

export interface FocusCoachContext {
  phase: TimerPhase;
  completedFocusSessions: number;
  totalFocusTime: number;
  remainingSeconds: number;
}

export interface UseFocusTimerReturn extends TimerState {
  config: TimerConfig;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipPhase: () => void;
  updateConfig: (config: Partial<TimerConfig>) => Promise<void>;
  formatTime: (seconds: number) => string;
  buildCoachContext: () => FocusCoachContext;
}

export function useFocusTimer(): UseFocusTimerReturn {
  const timer = useTimer();

  const buildCoachContext = useCallback((): FocusCoachContext => {
    return {
      phase: timer.phase,
      completedFocusSessions: timer.completedFocusSessions,
      totalFocusTime: timer.totalFocusTime,
      remainingSeconds: timer.remainingSeconds,
    };
  }, [timer.phase, timer.completedFocusSessions, timer.totalFocusTime, timer.remainingSeconds]);

  return {
    ...timer,
    buildCoachContext,
  };
}

export { formatTime };
