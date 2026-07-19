import React, { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useMarkdown } from 'react-native-marked';
import type { MarkedStyles } from 'react-native-marked';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface ChatBubbleProps {
  message: ChatMessage;
  loading?: boolean;
  streamingText?: string;
  isLast?: boolean;
}

const markdownStyles: MarkedStyles = {
  text: { color: '#E0E0F0', fontSize: 16, lineHeight: 22 },
  strong: { color: '#FF8A7E', fontWeight: '700' },
  em: { color: '#DDD6FE', fontStyle: 'italic' },
  h1: { color: '#F0F0FF', fontSize: 22, fontWeight: '700', marginVertical: 6 },
  h2: { color: '#F0F0FF', fontSize: 19, fontWeight: '700', marginVertical: 5 },
  h3: { color: '#F0F0FF', fontSize: 17, fontWeight: '600', marginVertical: 4 },
  codespan: { backgroundColor: '#1E1E2E', color: '#FF8A7E', fontFamily: 'monospace', fontSize: 14, paddingHorizontal: 4 },
  code: { backgroundColor: '#1E1E2E', padding: 10, borderRadius: 8, marginVertical: 6 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: '#FF6B5E', paddingLeft: 10, marginVertical: 6 },
  link: { color: '#FF8A7E', textDecorationLine: 'underline' },
  paragraph: { marginVertical: 3 },
  list: { marginVertical: 4 },
  li: { marginVertical: 2 },
};

function MarkdownText({ text }: { text: string }) {
  const elements = useMarkdown(text, { styles: markdownStyles });
  return <>{elements}</>;
}

export const ChatBubble = memo(function ChatBubble({ message, loading, streamingText, isLast }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const showSpinner = message.text.length === 0 && loading && !isUser && !streamingText;
  const displayText = isLast && loading && streamingText ? streamingText : message.text;

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {showSpinner ? (
          <ActivityIndicator size="small" color="#FF8A7E" />
        ) : isUser ? (
          <Text style={[styles.text, styles.userText]}>{displayText}</Text>
        ) : (
          <View style={styles.markdownContainer}>
            <MarkdownText text={displayText} />
            {isLast && loading && streamingText && <Text style={styles.cursor}>|</Text>}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    flexDirection: 'row',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#FF6B5E',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#2D2D44',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  markdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  cursor: {
    color: '#FF8A7E',
    opacity: 0.8,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 22,
  },
});
