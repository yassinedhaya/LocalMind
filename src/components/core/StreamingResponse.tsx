import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreamingResponseProps {
  fullText: string;
  speed?: number;
  onComplete?: () => void;
}

export function StreamingResponse({
  fullText,
  speed = 15,
  onComplete,
}: StreamingResponseProps) {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText('');

    intervalRef.current = setInterval(() => {
      if (indexRef.current < fullText.length) {
        const chunk = fullText.slice(0, indexRef.current + 2);
        indexRef.current += 2;
        setDisplayedText(chunk);
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setDisplayedText(fullText);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fullText, speed]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {displayedText}
        {displayedText.length < fullText.length && (
          <Text style={styles.cursor}>|</Text>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 16,
    color: '#E0E0F0',
    lineHeight: 22,
  },
  cursor: {
    color: '#FF8A7E',
    opacity: 0.7,
  },
});
