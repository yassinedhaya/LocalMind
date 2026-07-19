import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { DeviceProfile, GemmaModuleNative } from '../agents/agentTypes';

const { GemmaModule } = NativeModules;

const eventEmitter = Platform.OS === 'android' && GemmaModule
  ? new NativeEventEmitter(GemmaModule as never)
  : null;

type TokenListener = (token: string) => void;
type CompleteListener = (fullText: string) => void;

let currentTokenListener: TokenListener | null = null;
let currentCompleteListener: CompleteListener | null = null;
let tokenSub: ReturnType<NativeEventEmitter['addListener']> | null = null;
let completeSub: ReturnType<NativeEventEmitter['addListener']> | null = null;

function getNativeModule(): GemmaModuleNative {
  if (Platform.OS !== 'android') {
    throw new Error(
      'Gemma on-device AI is only supported on Android. ' +
      `Current platform: ${Platform.OS}`
    );
  }

  if (!GemmaModule) {
    throw new Error(
      'GemmaModule native module is not registered. ' +
      'Ensure GemmaPackage is added to getPackages() in MainApplication.kt.'
    );
  }

  return GemmaModule as GemmaModuleNative;
}

export function onGenerateToken(listener: TokenListener): void {
  currentTokenListener = listener;
}

export function onGenerateComplete(listener: CompleteListener): void {
  currentCompleteListener = listener;
}

export function removeGenerateListeners(): void {
  currentTokenListener = null;
  currentCompleteListener = null;
}

function setupEventListeners(): void {
  if (!eventEmitter) return;
  tokenSub?.remove();
  completeSub?.remove();
  tokenSub = eventEmitter.addListener('onGenerateToken', (token: string) => {
    currentTokenListener?.(token);
  });
  completeSub = eventEmitter.addListener('onGenerateComplete', (fullText: string) => {
    currentCompleteListener?.(fullText);
  });
}

setupEventListeners();

export async function checkCompatibility(): Promise<DeviceProfile> {
  try {
    const native = getNativeModule();
    const result = await native.checkCompatibility();
    return result;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`COMPATIBILITY_CHECK_FAILED: ${message}`);
  }
}

export async function checkModelExists(
  modelId: string
): Promise<'DOWNLOADED' | 'NOT_FOUND'> {
  return getNativeModule().checkModelExists(modelId);
}

export async function downloadModelFile(
  modelId: string
): Promise<void> {
  await getNativeModule().downloadModelFile(modelId);
}

export async function initEngine(
  modelId: string
): Promise<void> {
  await getNativeModule().initEngine(modelId);
}

export async function pickFile(
  mimeType: string
): Promise<{ uri: string; path: string; base64: string } | null> {
  return getNativeModule().pickFile(mimeType);
}

export async function pickImportFile(
  mimeType: string
): Promise<{ uri: string; path: string } | null> {
  return getNativeModule().pickImportFile(mimeType);
}

export async function importModelFromFile(
  modelId: string,
  fileUri: string
): Promise<void> {
  await getNativeModule().importModelFromFile(modelId, fileUri);
}

export async function startSTT(language: string): Promise<'STARTED'> {
  return getNativeModule().startSTT(language);
}

export async function stopSTT(): Promise<'STOPPED'> {
  return getNativeModule().stopSTT();
}

export async function speakText(text: string): Promise<'SPOKEN'> {
  return getNativeModule().speakText(text);
}

export async function stopSpeakingText(): Promise<'STOPPED'> {
  return getNativeModule().stopSpeakingText();
}

export async function isSttAvailable(): Promise<boolean> {
  return getNativeModule().isSttAvailable();
}

export async function isTtsAvailable(): Promise<boolean> {
  return getNativeModule().isTtsAvailable();
}

export async function extractPdfText(
  path: string
): Promise<{ text: string; pages: number }> {
  return getNativeModule().extractPdfText(path);
}

export async function generate(
  prompt: string
): Promise<string> {
  try {
    const result = await getNativeModule().generate(prompt);
    return result;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`INFERENCE_FAILED: ${message}`);
  }
}

export async function cancelDownload(modelId: string): Promise<void> {
  await getNativeModule().cancelDownload(modelId);
}

export async function closeEngine(): Promise<void> {
  await getNativeModule().closeEngine();
}

export async function requestNotificationPermission(): Promise<'GRANTED' | 'REQUESTED'> {
  return getNativeModule().requestNotificationPermission();
}
