import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerConfig, TimerSession, DEFAULT_TIMER_CONFIG } from '../types/timerTypes';

const SESSIONS_KEY = 'timer_sessions';
const CONFIG_KEY = 'timer_config';

export const TimerStorage = {
  async getConfig(): Promise<TimerConfig> {
    try {
      const stored = await AsyncStorage.getItem(CONFIG_KEY);
      if (stored) {
        return { ...DEFAULT_TIMER_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load timer config:', e);
    }
    return DEFAULT_TIMER_CONFIG;
  },

  async setConfig(config: Partial<TimerConfig>): Promise<void> {
    try {
      const current = await this.getConfig();
      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify({ ...current, ...config }));
    } catch (e) {
      console.warn('Failed to save timer config:', e);
    }
  },

  async getSessions(): Promise<TimerSession[]> {
    try {
      const stored = await AsyncStorage.getItem(SESSIONS_KEY);
      if (stored) {
        const sessions = JSON.parse(stored);
        return sessions.sort((a: TimerSession, b: TimerSession) => b.completedAt - a.completedAt);
      }
    } catch (e) {
      console.warn('Failed to load timer sessions:', e);
    }
    return [];
  },

  async addSession(session: Omit<TimerSession, 'id'>): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const newSession: TimerSession = {
        ...session,
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
      const updated = [newSession, ...sessions].slice(0, 500);
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save timer session:', e);
    }
  },

  async clearSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSIONS_KEY);
    } catch (e) {
      console.warn('Failed to clear timer sessions:', e);
    }
  },

  async getStats(): Promise<{
    totalSessions: number;
    totalFocusTime: number;
    todaySessions: number;
    todayFocusTime: number;
    currentStreak: number;
  }> {
    const sessions = await this.getSessions();
    const now = Date.now();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);

    const totalSessions = sessions.filter(s => s.wasCompleted && s.phase === 'focus').length;
    const totalFocusTime = sessions
      .filter(s => s.wasCompleted && s.phase === 'focus')
      .reduce((sum, s) => sum + s.actualDuration, 0);

    const todaySessions = sessions.filter(s => s.wasCompleted && s.phase === 'focus' && s.completedAt >= todayStart).length;
    const todayFocusTime = sessions
      .filter(s => s.wasCompleted && s.phase === 'focus' && s.completedAt >= todayStart)
      .reduce((sum, s) => sum + s.actualDuration, 0);

    let currentStreak = 0;
    let checkDate = new Date(now);
    checkDate.setHours(0, 0, 0, 0);
    while (true) {
      const dayStart = checkDate.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const daySessions = sessions.filter(
        s => s.wasCompleted && s.phase === 'focus' && s.completedAt >= dayStart && s.completedAt < dayEnd
      );
      if (daySessions.length > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { totalSessions, totalFocusTime, todaySessions, todayFocusTime, currentStreak };
  },
};