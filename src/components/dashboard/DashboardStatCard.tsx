import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export function DashboardStatCard({ label, value, icon, color }: DashboardStatCardProps) {
  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    color: '#8888A0',
    marginTop: 2,
  },
});
