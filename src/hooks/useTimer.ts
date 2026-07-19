import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, DeviceEventEmitter, NativeModules } from 'react-native';

const TimerTicker = NativeModules.TimerTicker;
import { TimerConfig, TimerPhase, TimerState, DEFAULT_TIMER_CONFIG, getNextPhase, getPhaseDuration, formatDuration, formatTime } from '../types/timerTypes';
import { TimerStorage } from '../services/TimerStorage';

export interface UseTimerReturn extends TimerState {
  config: TimerConfig;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipPhase: () => void;
  updateConfig: (config: Partial<TimerConfig>) => Promise<void>;
  formatTime: (seconds: number) => string;
}

export function useTimer(): UseTimerReturn {
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_TIMER_CONFIG);
  const [state, setState] = useState<TimerState>({
    phase: 'focus',
    remainingSeconds: DEFAULT_TIMER_CONFIG.focusDuration,
    isRunning: false,
    completedFocusSessions: 0,
    totalFocusTime: 0,
  });

  // Wall-clock anchors. We compute the live remaining time from these
  // instead of trusting setInterval to decrement every second, because
  // interval callbacks can be throttled/paused in some Hermes builds.
  const phaseEndRef = useRef<number>(Date.now() + DEFAULT_TIMER_CONFIG.focusDuration * 1000);
  const tickRef = useRef<boolean>(false);
  const tickListenersRef = useRef<any>(null);

  // Recompute remaining seconds from the wall clock.
  const recompute = useCallback(() => {
    setState(prev => {
      if (!prev.isRunning) return prev;
      const remainingMs = phaseEndRef.current - Date.now();
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
      if (remaining <= 0) {
        return handlePhaseComplete(prev);
      }
      if (remaining === prev.remainingSeconds) return prev;
      return { ...prev, remainingSeconds: remaining };
    });
  }, []);

  const handlePhaseComplete = useCallback((prev: TimerState): TimerState => {
    const wasFocus = prev.phase === 'focus';
    const newCompletedFocusSessions = wasFocus ? prev.completedFocusSessions + 1 : prev.completedFocusSessions;
    const newTotalFocusTime = wasFocus ? prev.totalFocusTime + getPhaseDuration(prev.phase, config) : prev.totalFocusTime;
    const nextPhase = getNextPhase(prev.phase, prev.completedFocusSessions, config);
    const nextDuration = getPhaseDuration(nextPhase, config);

    TimerStorage.addSession({
      phase: prev.phase,
      plannedDuration: getPhaseDuration(prev.phase, config),
      actualDuration: getPhaseDuration(prev.phase, config),
      wasCompleted: true,
      completedAt: Date.now(),
    });

    // Schedule the next phase to end based on the wall clock.
    phaseEndRef.current = Date.now() + nextDuration * 1000;

    return {
      phase: nextPhase,
      remainingSeconds: nextDuration,
      isRunning: true,
      completedFocusSessions: newCompletedFocusSessions,
      totalFocusTime: newTotalFocusTime,
    };
  }, [config]);

  const startTick = useCallback(() => {
    if (tickRef.current) return;
    tickRef.current = true;
    const onTick = () => recompute();
    let subscription: any = null;
    try {
      subscription = DeviceEventEmitter.addListener('timerTick', onTick);
    } catch (e) {
      console.log('[TIMER] addListener failed: ' + e);
    }
    tickListenersRef.current = subscription;
    try {
      TimerTicker?.start?.();
    } catch (e) {
      console.log('[TIMER] start failed: ' + e);
    }
  }, [recompute]);

  const stopTick = useCallback(() => {
    if (!tickRef.current) return;
    tickRef.current = false;
    if (tickListenersRef.current) {
      try {
        tickListenersRef.current.remove();
      } catch (e) {
        console.log('[TIMER] remove failed: ' + e);
      }
      tickListenersRef.current = null;
    }
    try {
      TimerTicker?.stop?.();
    } catch (e) {
      console.log('[TIMER] stop failed: ' + e);
    }
  }, []);

  const start = useCallback(() => {
    setState(prev => {
      if (prev.isRunning) return prev;
      const remainingMs = Math.max(0, prev.remainingSeconds) * 1000;
      phaseEndRef.current = Date.now() + remainingMs;
      startTick();
      return { ...prev, isRunning: true };
    });
  }, [startTick]);

  const pause = useCallback(() => {
    setState(prev => {
      if (!prev.isRunning) return prev;
      // Freeze the remaining time from the wall clock.
      const remainingMs = Math.max(0, phaseEndRef.current - Date.now());
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
      stopTick();
      return { ...prev, isRunning: false, remainingSeconds: remaining };
    });
  }, [stopTick]);

  const reset = useCallback(() => {
    stopTick();
    const duration = getPhaseDuration(state.phase, config);
    setState(prev => ({
      ...prev,
      remainingSeconds: duration,
      isRunning: false,
    }));
  }, [state.phase, config, stopTick]);

  const skipPhase = useCallback(() => {
    stopTick();
    const wasFocus = state.phase === 'focus';
    const nextPhase = getNextPhase(state.phase, state.completedFocusSessions, config);
    const nextDuration = getPhaseDuration(nextPhase, config);

    if (wasFocus && state.remainingSeconds < getPhaseDuration('focus', config)) {
      const sessionDuration = getPhaseDuration('focus', config) - state.remainingSeconds;
      TimerStorage.addSession({
        phase: 'focus',
        plannedDuration: getPhaseDuration('focus', config),
        actualDuration: sessionDuration,
        wasCompleted: false,
        completedAt: Date.now(),
      });
    }

    setState(prev => ({
      ...prev,
      phase: nextPhase,
      remainingSeconds: nextDuration,
      isRunning: false,
      completedFocusSessions: wasFocus ? prev.completedFocusSessions + 1 : prev.completedFocusSessions,
      totalFocusTime: wasFocus ? prev.totalFocusTime + getPhaseDuration('focus', config) : prev.totalFocusTime,
    }));
  }, [state, config, stopTick]);

  const updateConfig = useCallback(async (partialConfig: Partial<TimerConfig>) => {
    const newConfig = { ...config, ...partialConfig };
    await TimerStorage.setConfig(newConfig);
    setConfig(newConfig);
    setState(prev => {
      if (prev.isRunning) return prev;
      const duration = getPhaseDuration(prev.phase, newConfig);
      return { ...prev, remainingSeconds: duration };
    });
  }, [config]);

  // Load persisted config + sessions on mount.
  useEffect(() => {
    TimerStorage.getConfig().then(c => {
      setConfig(c);
      setState(prev => {
        if (prev.isRunning) return prev;
        return { ...prev, remainingSeconds: getPhaseDuration(prev.phase, c) };
      });
    });
    TimerStorage.getSessions().then(sessions => {
      const focusSessions = sessions.filter(s => s.wasCompleted && s.phase === 'focus');
      const completedFocusSessions = focusSessions.length;
      const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.actualDuration, 0);
      const currentPhase = completedFocusSessions > 0 && completedFocusSessions % config.longBreakInterval === 0 ? 'longBreak' : 'focus';
      setState(prev => ({
        ...prev,
        phase: currentPhase,
        remainingSeconds: getPhaseDuration(currentPhase, config),
        completedFocusSessions,
        totalFocusTime,
      }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle app background/foreground so the timer keeps accurate time.
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && state.isRunning) {
        recompute();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [state.isRunning, recompute]);

  return {
    ...state,
    config,
    start,
    pause,
    reset,
    skipPhase,
    updateConfig,
    formatTime,
  };
}
