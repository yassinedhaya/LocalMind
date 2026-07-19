import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { useGemmaChat } from '../hooks/useGemmaChat';
import { FOCUS_AGENT_CONFIG } from '../agents/focusAgent';
import { FocusTimer } from '../components/focus/FocusTimer';
import { FocusCheckin } from '../components/focus/FocusCheckin';
import { TimerStorage } from '../services/TimerStorage';
import {
  TimerSession,
  formatDuration,
  getPhaseLabel,
  getPhaseColor,
} from '../types/timerTypes';

interface FocusScreenProps {
  onBack: () => void;
}

export function FocusScreen({ onBack }: FocusScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    phase,
    remainingSeconds,
    isRunning,
    completedFocusSessions,
    totalFocusTime,
    config,
    start,
    pause,
    reset,
    skipPhase,
    updateConfig,
    formatTime,
    buildCoachContext,
  } = useFocusTimer();

  const {
    messages,
    streamingText,
    loading,
    send,
    clear,
  } = useGemmaChat(FOCUS_AGENT_CONFIG);

  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalFocusTime: 0,
    todaySessions: 0,
    todayFocusTime: 0,
    currentStreak: 0,
  });

  const coachMessage = messages.length > 0 ? messages[messages.length - 1].text : '';

  useEffect(() => {
    TimerStorage.getSessions().then(setSessions);
    TimerStorage.getStats().then(setStats);
  }, []);

  const handleSettingsSave = useCallback(
    (newConfig: Partial<typeof config>) => {
      updateConfig(newConfig);
      setShowSettings(false);
    },
    [updateConfig, config]
  );

  const buildCoachPrompt = useCallback(
    (kind: 'checkin' | 'distraction', distraction?: string): string => {
      const ctx = buildCoachContext();
      const base = [
        `Context: user is in a ${ctx.phase} phase of a focus session.`,
        `Completed focus sessions today: ${ctx.completedFocusSessions}.`,
        `Total focus time today: ${formatDuration(ctx.totalFocusTime)}.`,
        `Time left in current phase: ${formatTime(ctx.remainingSeconds)}.`,
      ];
      if (kind === 'checkin') {
        return [...base, 'Give a short, encouraging check-in message for right now.'].join('\n');
      }
      return [
        ...base,
        `The user is distracted by: ${distraction}.`,
        'Give one short, concrete tip to refocus. Keep it under 2 sentences.',
      ].join('\n');
    },
    [buildCoachContext, formatTime]
  );

  const handleCheckIn = useCallback(() => {
    send(buildCoachPrompt('checkin'));
  }, [send, buildCoachPrompt]);

  const handleDistraction = useCallback(
    (label: string) => {
      send(buildCoachPrompt('distraction', label));
    },
    [send, buildCoachPrompt]
  );

  const phaseColor = getPhaseColor(phase);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Go back">
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Focus + Coach</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          style={styles.settingsButton}
          accessibilityLabel="Settings"
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FocusTimer
          phase={phase}
          remainingSeconds={remainingSeconds}
          isRunning={isRunning}
          config={config}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onSkip={skipPhase}
          onOpenSettings={() => setShowSettings(true)}
        />

        <FocusCheckin
          message={coachMessage || streamingText}
          loading={loading}
          onCheckIn={handleCheckIn}
          onDistraction={handleDistraction}
        />

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Sessions" value={completedFocusSessions} color="#FF6B5E" />
            <StatCard label="Focus Time" value={formatDuration(totalFocusTime)} color="#059669" />
            <StatCard label="Streak" value={stats.currentStreak} color="#D97706" />
            <StatCard label="Phase" value={getPhaseLabel(phase)} color={phaseColor} />
          </View>
        </View>

        {sessions.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <FlatList
              data={sessions.slice(0, 20)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <SessionItem session={item} />}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>

      {showSettings && (
        <SettingsModal
          visible={showSettings}
          config={config}
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
          bottomInset={insets.bottom}
        />
      )}
    </View>
  );
}

const StatCard = React.memo(function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

const SessionItem = React.memo(function SessionItem({ session }: { session: TimerSession }) {
  const date = new Date(session.completedAt);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const wasFocus = session.phase === 'focus';
  const color = wasFocus ? '#FF6B5E' : session.phase === 'shortBreak' ? '#059669' : '#0891B2';

  return (
    <View style={styles.sessionItem}>
      <View style={[styles.sessionColor, { backgroundColor: color }]} />
      <View style={styles.sessionInfo}>
        <View style={styles.sessionTop}>
          <Text style={[styles.sessionPhase, { color }]}>{getPhaseLabel(session.phase)}</Text>
          <Text style={styles.sessionTime}>{timeStr}</Text>
        </View>
        <View style={styles.sessionBottom}>
          <Text style={styles.sessionDate}>{dateStr}</Text>
          <Text
            style={[styles.sessionDuration, { color: session.wasCompleted ? '#059669' : '#EF4444' }]}
          >
            {session.wasCompleted ? '✓ Completed' : '✕ Stopped'}
            {'  •  '}
            {formatDuration(session.actualDuration)}
          </Text>
        </View>
      </View>
    </View>
  );
});

const SettingsModal = ({
  visible,
  config,
  onClose,
  onSave,
  bottomInset,
}: {
  visible: boolean;
  config: any;
  onClose: () => void;
  onSave: (newConfig: Partial<any>) => void;
  bottomInset: number;
}) => {
  if (!visible) return null;
  const [editingConfig, setEditingConfig] = React.useState<Partial<any>>({});
  const currentConfig = { ...config, ...editingConfig };

  const cycleValue = (current: number, options: number[]) => {
    const idx = options.indexOf(current);
    return options[(idx + 1) % options.length];
  };

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.modalContent, { paddingBottom: Math.max(bottomInset, 24) }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Timer Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose} accessibilityRole="button">
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsList}>
          <SettingRow
            label="Focus Duration"
            value={`${Math.floor(currentConfig.focusDuration / 60)} min`}
            onPress={() =>
              setEditingConfig({
                ...editingConfig,
                focusDuration: cycleValue(
                  currentConfig.focusDuration,
                  [15, 25, 30, 45, 50, 60].map((m) => m * 60)
                ),
              })
            }
          />
          <SettingRow
            label="Short Break"
            value={`${Math.floor(currentConfig.shortBreakDuration / 60)} min`}
            onPress={() =>
              setEditingConfig({
                ...editingConfig,
                shortBreakDuration: cycleValue(
                  currentConfig.shortBreakDuration,
                  [3, 5, 10].map((m) => m * 60)
                ),
              })
            }
          />
          <SettingRow
            label="Long Break"
            value={`${Math.floor(currentConfig.longBreakDuration / 60)} min`}
            onPress={() =>
              setEditingConfig({
                ...editingConfig,
                longBreakDuration: cycleValue(
                  currentConfig.longBreakDuration,
                  [10, 15, 20, 30].map((m) => m * 60)
                ),
              })
            }
          />
          <SettingRow
            label="Long Break Every"
            value={`${currentConfig.longBreakInterval} sessions`}
            onPress={() =>
              setEditingConfig({
                ...editingConfig,
                longBreakInterval: cycleValue(currentConfig.longBreakInterval, [3, 4, 6, 8]),
              })
            }
          />
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onClose} style={styles.modalCancel} accessibilityRole="button">
            <Text style={styles.modalActionText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSave(editingConfig)}
            style={styles.modalSave}
            accessibilityRole="button"
          >
            <Text style={styles.modalActionText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const SettingRow = ({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.settingRow} activeOpacity={0.8} accessibilityRole="button">
    <Text style={styles.settingLabel}>{label}</Text>
    <Text style={styles.settingValue}>{value}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#FF8A7E',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 22,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsSection: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E1E2E',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#8888A0',
    marginTop: 4,
  },
  historySection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sessionItem: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  sessionColor: {
    width: 4,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionPhase: {
    fontSize: 15,
    fontWeight: '600',
  },
  sessionTime: {
    fontSize: 13,
    color: '#8888A0',
  },
  sessionBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: '#666680',
  },
  sessionDuration: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 48,
    paddingTop: 48,
    zIndex: 100,
  },
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  modalClose: {
    padding: 4,
  },
  modalCloseText: {
    color: '#8888A0',
    fontSize: 20,
  },
  settingsList: {
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3A',
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  settingValue: {
    color: '#FF8A7E',
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancel: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A3A',
  },
  modalSave: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B5E',
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
