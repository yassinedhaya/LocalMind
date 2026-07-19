import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import {
  startSTT,
  stopSTT,
  speakText,
  stopSpeakingText,
  isSttAvailable,
  isTtsAvailable,
} from '../native/GemmaBridge';

const { GemmaModule } = NativeModules;

const eventEmitter =
  Platform.OS === 'android' && GemmaModule
    ? new NativeEventEmitter(GemmaModule as never)
    : null;

export type VoiceAvailability = {
  stt: boolean;
  tts: boolean;
};

/**
 * Whether on-device speech-to-text and text-to-speech are supported.
 * On Android these use the built-in SpeechRecognizer and TextToSpeech engines.
 */
export async function getVoiceAvailability(): Promise<VoiceAvailability> {
  if (Platform.OS !== 'android' || !GemmaModule) {
    return { stt: false, tts: false };
  }
  try {
    const [stt, tts] = await Promise.all([isSttAvailable(), isTtsAvailable()]);
    return { stt: !!stt, tts: !!tts };
  } catch {
    return { stt: false, tts: false };
  }
}

export const VoiceService = {
  isSttAvailable(): boolean {
    return Platform.OS === 'android' && !!GemmaModule;
  },

  isTtsAvailable(): boolean {
    return Platform.OS === 'android' && !!GemmaModule;
  },

  addListener(event: string, cb: (payload: any) => void): () => void {
    if (!eventEmitter) return () => {};
    const sub = eventEmitter.addListener(event, cb);
    return () => sub.remove();
  },

  _listeners: [] as Array<() => void>,

  _clearListeners(): void {
    this._listeners.forEach((off) => off());
    this._listeners = [];
  },

  async startListening(
    onPartial: (text: string) => void,
    onFinal: (text: string) => void,
    onError: (e: string) => void
  ): Promise<void> {
    this._clearListeners();
    const offs = [
      this.addListener('onSTTPartial', (e: any) => onPartial(e?.text ?? '')),
      this.addListener('onSTTFinal', (e: any) => {
        this._clearListeners();
        onFinal(e?.text ?? '');
      }),
      this.addListener('onSTTError', (e: any) => {
        this._clearListeners();
        onError(e?.message ?? 'Speech error');
      }),
    ];
    this._listeners = offs;
    try {
      await startSTT('en-US');
    } catch (e) {
      this._clearListeners();
      onError(e instanceof Error ? e.message : 'Failed to start listening');
    }
  },

  async stopListening(): Promise<void> {
    this._clearListeners();
    try {
      await stopSTT();
    } catch {
      // ignore
    }
  },

  speak(text: string): void {
    speakText(text).catch(() => {});
  },

  stopSpeaking(): void {
    stopSpeakingText().catch(() => {});
  },
};
