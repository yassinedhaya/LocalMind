import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DeviceProfile } from '../agents/agentTypes';

interface DeviceProfileBadgeProps {
  profile: DeviceProfile | null;
  loading: boolean;
}

export function DeviceProfileBadge({
  profile,
  loading,
}: DeviceProfileBadgeProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Detecting device...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Device info unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Device</Text>
        <Text style={styles.value}>
          RAM {profile.ramGB}GB | {profile.storageGB}GB free | API {profile.apiLevel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2D2D44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
  },
  value: {
    fontSize: 12,
    color: '#A0A0B8',
    fontFamily: 'monospace',
  },
});
