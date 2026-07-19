import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

interface NonRecommendedWarningProps {
  visible: boolean;
  stage: 1 | 2;
  modelName: string;
  recommendedName: string | null;
  ramGB: number | null;
  onContinue: () => void;
  onCancel: () => void;
}

export function NonRecommendedWarning({
  visible,
  stage,
  modelName,
  recommendedName,
  ramGB,
  onContinue,
  onCancel,
}: NonRecommendedWarningProps) {
  const isFinal = stage === 2;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.icon}>{isFinal ? '\u26A0\uFE0F' : '\u26A0'}</Text>
          <Text style={styles.title}>
            {isFinal ? 'Final Warning' : 'Model Compatibility Notice'}
          </Text>

          {isFinal ? (
            <Text style={styles.body}>
              This model ({modelName}) has not been tested with your device configuration
              {ramGB != null ? ` (${ramGB} GB RAM)` : ''}.
              {'\n\n'}
              It may cause performance issues, crashes, or unexpected behavior.
              {'\n\n'}
              By continuing, you acknowledge that you are proceeding at your own risk.
            </Text>
          ) : (
            <Text style={styles.body}>
              The recommended model for your device
              {recommendedName ? ` is ${recommendedName}` : ''}.
              {'\n\n'}
              {modelName} may not perform optimally
              {ramGB != null ? ` with ${ramGB} GB RAM` : ''} and could cause slowdowns.
            </Text>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>
                {isFinal ? 'Go Back' : 'Choose Recommended'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.continueButton, isFinal && styles.continueButtonDanger]}
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueText}>
                {isFinal ? 'Install Anyway' : 'Continue Anyway'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  icon: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#A0A0B8',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2D2D44',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#A0A0B8',
    fontSize: 15,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#FF6B5E',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonDanger: {
    backgroundColor: '#DC2626',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
