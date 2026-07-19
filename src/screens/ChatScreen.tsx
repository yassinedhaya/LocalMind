import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGemmaChat } from '../hooks/useGemmaChat';
import { ChatBubble } from '../components/core/ChatBubble';
import { ChatInput } from '../components/core/ChatInput';
import { SaveOutputBar } from '../components/core/SaveOutputBar';
import { TaskStorage } from '../services/TaskStorage';
import { NoteStorage } from '../services/NoteStorage';
import { TableStorage } from '../services/TableStorage';
import { parseMarkdownTable } from '../services/TableParser';
import type { ChatMessage } from '../components/core/ChatBubble';
import type { DetectedOutput } from '../types/outputTypes';

interface ChatScreenProps {
  onBack: () => void;
}

export function ChatScreen({ onBack }: ChatScreenProps) {
  const {
    messages,
    streamingText,
    loading,
    detectedOutput,
    send,
    clear,
    dismissOutput,
    setDetectedOutput,
  } = useGemmaChat();

  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const handleSend = useCallback(async (text: string) => {
    await send(text);
  }, [send]);

  const handleSave = useCallback(
    async (detected: DetectedOutput) => {
      try {
        if (detected.type === 'task') {
          await TaskStorage.create({
            title: detected.title,
            description: detected.content,
            priority: 'medium',
            status: 'pending',
            tags: [],
          });
          Alert.alert('Task Saved', `"${detected.title}" added to tasks.`);
        } else if (detected.type === 'table') {
          const parsed = parseMarkdownTable(detected.content);
          if (parsed && parsed.columns.length > 0) {
            await TableStorage.create({
              title: detected.title,
              columns: parsed.columns,
              rows: parsed.rows,
              tags: [],
            });
            Alert.alert('Table Saved', `"${detected.title}" added to tables.`);
          } else {
            Alert.alert('Save Failed', 'Could not parse table format.');
          }
        } else if (detected.type === 'note') {
          await NoteStorage.create({
            title: detected.title,
            content: detected.content,
            tags: [],
          });
          Alert.alert('Note Saved', `"${detected.title}" added to notes.`);
        } else {
          await NoteStorage.create({
            title: detected.title,
            content: detected.content,
            tags: [],
          });
          Alert.alert('Saved', `"${detected.title}" saved.`);
        }
      } catch {
        Alert.alert('Save Failed', 'Could not save. Try again.');
      }
      setDetectedOutput(null);
    },
    [setDetectedOutput]
  );

  const handleClear = useCallback(() => {
    Alert.alert('Clear Chat', 'Delete all messages?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);
  }, [clear]);

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => (
      <ChatBubble
        message={item}
        loading={loading}
        streamingText={streamingText}
        isLast={index === messages.length - 1 && item.role === 'assistant'}
      />
    ),
    [loading, streamingText, messages]
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <View style={[styles.statusBarBg, { height: insets.top }]} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backIcon}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.modelName}>AI Chat</Text>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Ready</Text>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              accessibilityLabel="Clear conversation"
              accessibilityRole="button"
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          extraData={{ loading, streamingText, messagesLength: messages.length }}
          windowSize={7}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Ask anything</Text>
              <Text style={styles.emptySubtitle}>
                The on-device AI is ready. Try asking a question, requesting a
                summary, or listing tasks.
              </Text>
            </View>
          }
        />

        {detectedOutput && (
          <SaveOutputBar
            detected={detectedOutput}
            onSave={handleSave}
            onDismiss={dismissOutput}
          />
        )}

        <ChatInput
          onSend={handleSend}
          disabled={loading}
          placeholder={loading ? 'Generating...' : 'Ask anything...'}
          bottomInset={insets.bottom}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  statusBarBg: {
    backgroundColor: '#0F0F1A',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  backIcon: {
    fontSize: 16,
    color: '#FF6B5E',
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 13,
    color: '#6B7280',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
