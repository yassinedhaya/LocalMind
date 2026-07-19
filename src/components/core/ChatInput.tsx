import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
} from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
  bottomInset?: number;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Ask anything...',
  bottomInset = 0,
}: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || disabled) return;
    onSend(trimmed);
    setText('');
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, { paddingBottom: 8 + bottomInset }]}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        multiline
        maxLength={4000}
        editable={!disabled}
        returnKeyType="default"
        blurOnSubmit
        accessibilityLabel="Message input"
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          (text.trim().length === 0 || disabled) && styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={text.trim().length === 0 || disabled}
        accessibilityLabel="Send message"
        accessibilityRole="button"
      >
        <Text style={styles.sendIcon}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1E1E2E',
    borderTopWidth: 1,
    borderTopColor: '#2D2D44',
  },
  input: {
    flex: 1,
    backgroundColor: '#2D2D44',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 120,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#FF6B5E',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#3B3B5C',
    opacity: 0.5,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
