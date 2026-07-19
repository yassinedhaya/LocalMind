import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { DetectedOutput } from '../../types/outputTypes';

interface SaveOutputBarProps {
  detected: DetectedOutput;
  onSave: (detected: DetectedOutput) => void;
  onDismiss: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  note: 'Save as Note',
  task: 'Save as Task',
  table: 'Save as Table',
};

const TYPE_COLORS: Record<string, string> = {
  note: '#3B82F6',
  task: '#10B981',
  table: '#F59E0B',
};

export function SaveOutputBar({ detected, onSave, onDismiss }: SaveOutputBarProps) {
  const label = TYPE_LABELS[detected.type] ?? 'Save';
  const color = TYPE_COLORS[detected.type] ?? '#FF6B5E';

  if (detected.confidence < 0.4) return null;

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={[styles.badge, { backgroundColor: color }]}>
          {detected.type.toUpperCase()}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {detected.title}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: color }]}
          onPress={() => onSave(detected)}
          accessibilityLabel={label}
          accessibilityRole="button"
        >
          <Text style={styles.saveText}>{label}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
        >
          <Text style={styles.dismissText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderTopWidth: 1,
    borderTopColor: '#2D2D44',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  title: {
    flex: 1,
    fontSize: 13,
    color: '#A0A0B8',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2D2D44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
});
