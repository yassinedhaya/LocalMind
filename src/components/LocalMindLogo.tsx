import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LocalMindLogoProps {
  size?: number;
}

/**
 * Pure-View rendering of the LocalMind mark: a coral rounded square with a
 * white chat bubble and three coral "mind" dots. Mirrors the adaptive icon.
 */
export function LocalMindLogo({ size = 96 }: LocalMindLogoProps) {
  const dot = size * 0.11;
  return (
    <View
      style={[
        styles.square,
        {
          width: size,
          height: size,
          borderRadius: size * 0.26,
          backgroundColor: '#FF6B5E',
        },
      ]}
    >
      <View style={[styles.bubble, { width: size * 0.62, height: size * 0.5 }]}>
        <View style={[styles.dot, { width: dot, height: dot, backgroundColor: '#FF6B5E' }]} />
        <View style={styles.row}>
          <View style={[styles.dotSm, { width: dot * 0.7, height: dot * 0.7, backgroundColor: '#FF6B5E' }]} />
          <View style={[styles.dotSm, { width: dot * 0.7, height: dot * 0.7, backgroundColor: '#FF6B5E' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 999,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  dotSm: {
    borderRadius: 999,
  },
});
