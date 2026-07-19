export type OutputFormat = 'text' | 'json' | 'steps' | 'code';

export type MlKitStatus = 'AVAILABLE' | 'DOWNLOADABLE' | 'UNAVAILABLE';

export interface AgentToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: AgentToolParameter[];
}

export interface AgentConfig {
  role: string;
  goal: string;
  constraints: string[];
  outputFormat: OutputFormat;
  tools?: AgentTool[];
}

export interface AgentResponse {
  content: string;
  toolCalls: AgentToolCall[];
  raw: string;
}

export interface AgentToolCall {
  tool: string;
  parameters: Record<string, unknown>;
}

export interface DeviceProfile {
  ramGB: number;
  storageGB: number;
  apiLevel: number;
  availableModels: string[];
}

export interface GemmaModuleNative {
  checkCompatibility(): Promise<DeviceProfile>;
  checkModelExists(modelId: string): Promise<'DOWNLOADED' | 'NOT_FOUND'>;
  downloadModelFile(modelId: string): Promise<'DOWNLOADED'>;
  pickFile(mimeType: string): Promise<{ uri: string; path: string; base64: string } | null>;
  pickImportFile(mimeType: string): Promise<{ uri: string; path: string } | null>;
  importModelFromFile(modelId: string, fileUri: string): Promise<'IMPORTED'>;
  startSTT(language: string): Promise<'STARTED'>;
  stopSTT(): Promise<'STOPPED'>;
  speakText(text: string): Promise<'SPOKEN'>;
  stopSpeakingText(): Promise<'STOPPED'>;
  isSttAvailable(): Promise<boolean>;
  isTtsAvailable(): Promise<boolean>;
  extractPdfText(path: string): Promise<{ text: string; pages: number }>;
  cancelDownload(modelId: string): Promise<'CANCELLED'>;
  initEngine(modelId: string): Promise<'INITIALIZED'>;
  generate(prompt: string): Promise<string>;
  closeEngine(): Promise<'CLOSED'>;
  requestNotificationPermission(): Promise<'GRANTED' | 'REQUESTED'>;
}
