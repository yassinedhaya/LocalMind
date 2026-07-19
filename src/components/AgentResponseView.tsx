import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import type { AgentResponse } from '../agents/agentTypes';

interface AgentResponseViewProps {
  response: AgentResponse | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  NO_MODEL: 'No model selected. Please select a model first.',
  MODEL_NOT_DOWNLOADED:
    'Model not downloaded yet. Open Google AI Edge Gallery to download it.',
  AICORE_UNAVAILABLE:
    'AI Core is not set up on this device. Please install AICore from the Play Store.',
  LOW_STORAGE:
    'Not enough storage. Free up space to use this model.',
  INFERENCE_FAILED:
    'Something went wrong during inference. Try again or switch to a lighter model.',
  COMPATIBILITY_CHECK_FAILED:
    'Failed to check device compatibility. Please restart the app.',
};

export function AgentResponseView({
  response,
  loading,
  error,
  errorCode,
}: AgentResponseViewProps) {
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#FF6B5E" />
        <Text style={styles.generatingText}>Generating response...</Text>
      </View>
    );
  }

  if (error) {
    const displayMessage = errorCode
      ? ERROR_MESSAGES[errorCode] ?? error
      : error;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{displayMessage}</Text>
        {errorCode === 'LOW_STORAGE' && (
          <Text style={styles.errorHint}>
            Go to Settings {'>'} Storage to manage your device storage.
          </Text>
        )}
        {errorCode === 'AICORE_UNAVAILABLE' && (
          <Text style={styles.errorHint}>
            Open the Play Store and search for "AI Core" by Google to install it.
          </Text>
        )}
        {errorCode === 'MODEL_NOT_DOWNLOADED' && (
          <Text style={styles.errorHint}>
            Open the Google AI Edge Gallery app to download the model.
          </Text>
        )}
      </View>
    );
  }

  if (!response) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.placeholderText}>
          Type a message to start a conversation with the on-device AI.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.responseText}>{response.content}</Text>
      {response.toolCalls.length > 0 && (
        <View style={styles.toolCallsSection}>
          <Text style={styles.toolCallsTitle}>Tool Calls</Text>
          {response.toolCalls.map((call, index) => (
            <View key={index} style={styles.toolCallItem}>
              <Text style={styles.toolCallName}>
                {(call as { tool: string }).tool ?? 'unknown'}
              </Text>
              <Text style={styles.toolCallParams}>
                {JSON.stringify((call as { parameters: Record<string, unknown> }).parameters, null, 2)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  generatingText: {
    fontSize: 15,
    color: '#A0A0B8',
    marginTop: 12,
  },
  placeholderText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  responseText: {
    fontSize: 16,
    color: '#E0E0F0',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#FCA5A5',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  errorHint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  toolCallsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2D2D44',
  },
  toolCallsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8A7E',
    marginBottom: 8,
  },
  toolCallItem: {
    backgroundColor: '#2D2D44',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  toolCallName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  toolCallParams: {
    fontSize: 12,
    color: '#A0A0B8',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) ?? 'monospace',
  },
});
