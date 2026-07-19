import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  TimerPhase,
  TimerConfig,
  getPhaseDuration,
  getPhaseLabel,
  getPhaseColor,
  formatTime,
} from '../../types/timerTypes';

interface FocusTimerProps {
  phase: TimerPhase;
  remainingSeconds: number;
  isRunning: boolean;
  config: TimerConfig;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onOpenSettings: () => void;
}

export const FocusTimer = memo(function FocusTimer({
  phase,
  remainingSeconds,
  isRunning,
  config,
  onStart,
  onPause,
  onReset,
  onSkip,
  onOpenSettings,
}: FocusTimerProps) {
  const phaseColor = getPhaseColor(phase);
  const total = getPhaseDuration(phase, config);
  const progress = total > 0 ? 1 - remainingSeconds / total : 0;
  const rotation = Math.min(360, Math.max(0, progress * 360));

  return (
    <View style={styles.container}>
      <View style={styles.phaseRow}>
        <Text style={[styles.phaseLabel, { color: phaseColor }]}>{getPhaseLabel(phase)}</Text>
        <TouchableOpacity onPress={onOpenSettings} accessibilityLabel="Timer settings" accessibilityRole="button">
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ringWrap}>
        <View
          style={[
            styles.ringTrack,
            {
              borderTopColor: phaseColor,
              transform: [{ rotate: `${rotation - 90}deg` }],
            },
          ]}
        >
          <View style={[styles.ringInner, { transform: [{ rotate: `${90 - rotation}deg` }] }]}>
            <Text style={[styles.timeText, { color: phaseColor }]}>{formatTime(remainingSeconds)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onReset} style={styles.controlBtn} accessibilityLabel="Reset timer" accessibilityRole="button">
          <Text style={styles.controlIcon}>↻</Text>
          <Text style={styles.controlLabel}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={isRunning ? onPause : onStart}
          style={[styles.controlBtn, styles.mainBtn, { backgroundColor: phaseColor }]}
          accessibilityLabel={isRunning ? 'Pause' : 'Start'}
          accessibilityRole="button"
        >
          <Text style={styles.mainIcon}>{isRunning ? '⏸' : '▶'}</Text>
          <Text style={styles.mainLabel}>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip} style={styles.controlBtn} accessibilityLabel="Skip phase" accessibilityRole="button">
          <Text style={styles.controlIcon}>⏭</Text>
          <Text style={styles.controlLabel}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  settingsIcon: {
    fontSize: 22,
  },
  ringWrap: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringTrack: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 10,
    borderColor: '#1E1E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#14141F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 56,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    includeFontPadding: false,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 28,
  },
  controlBtn: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1E1E2E',
    minWidth: 64,
  },
  mainBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  controlIcon: {
    fontSize: 18,
    color: '#FF8A7E',
  },
  controlLabel: {
    fontSize: 12,
    color: '#FF8A7E',
    fontWeight: '500',
  },
  mainIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  mainLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
