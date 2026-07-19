import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface QuickAction {
  key: string;
  label: string;
  icon: string;
  color: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (key: string) => void;
}

export function QuickActions({ actions, onAction }: QuickActionsProps) {
  return (
    <View style={styles.grid}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.key}
          style={[styles.tile, { borderColor: a.color }]}
          onPress={() => onAction(a.key)}
          accessibilityLabel={a.label}
          accessibilityRole="button"
        >
          <Text style={styles.icon}>{a.icon}</Text>
          <Text style={[styles.label, { color: a.color }]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  tile: {
    width: '47%',
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
