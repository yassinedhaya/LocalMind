import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalMindLogo } from '../components/LocalMindLogo';
import { StitchColors } from '../theme/stitchTheme';

interface SplashScreenProps {
  onEnter: () => void;
}

export function SplashScreen({ onEnter }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={StitchColors.bg} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.logoWrap}>
          <LocalMindLogo size={120} />
        </View>
        <Text style={styles.title}>LocalMind</Text>
        <Text style={styles.tagline}>Your AI, on your device.</Text>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.enterButton}
          onPress={onEnter}
          accessibilityLabel="Get started"
          accessibilityRole="button"
        >
          <Text style={styles.enterText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={styles.privacy}>Private · Offline · No account needed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: StitchColors.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    marginBottom: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: StitchColors.text,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: StitchColors.textSecondary,
    marginTop: 8,
  },
  spacer: {
    height: 56,
  },
  enterButton: {
    backgroundColor: StitchColors.accent,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
  },
  enterText: {
    color: StitchColors.onAccent,
    fontSize: 17,
    fontWeight: '800',
  },
  privacy: {
    fontSize: 12,
    color: StitchColors.textMuted,
    marginTop: 16,
  },
});
