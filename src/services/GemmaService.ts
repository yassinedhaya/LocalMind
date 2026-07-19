import type { AgentConfig, AgentResponse, DeviceProfile } from '../agents/agentTypes';
import type { GemmaModelSpec } from '../models/modelCatalog';
import { GEMMA_MODEL_CATALOG } from '../models/modelCatalog';
import * as GemmaBridge from '../native/GemmaBridge';
import { buildPrompt } from '../agents/promptBuilder';

export interface ServiceResult<T> {
  success: true;
  data: T;
}

export interface ServiceError {
  success: false;
  error: string;
  errorCode: string;
}

export type ServiceResponse<T> = ServiceResult<T> | ServiceError;

export interface CompatibilityResult {
  profile: DeviceProfile;
  compatibleModels: GemmaModelSpec[];
}

async function getDeviceProfile(): Promise<ServiceResponse<CompatibilityResult>> {
  try {
    const profile = await GemmaBridge.checkCompatibility();

    console.log('Device profile:', JSON.stringify(profile));

    const compatibleModels = GEMMA_MODEL_CATALOG.filter(
      (model) =>
        model.minAndroidApi <= profile.apiLevel &&
        model.minRamGB <= profile.ramGB &&
        model.minStorageGB <= profile.storageGB
    );

    console.log('Compatible models:', compatibleModels.length);

    return { success: true, data: { profile, compatibleModels } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
      errorCode: 'COMPATIBILITY_CHECK_FAILED',
    };
  }
}

function selectBestModel(compatibleModels: GemmaModelSpec[]): GemmaModelSpec | null {
  if (compatibleModels.length === 0) {
    return null;
  }
  return compatibleModels[0];
}

async function checkModelExists(
  modelId: string
): Promise<ServiceResponse<'DOWNLOADED' | 'NOT_FOUND'>> {
  try {
    const status = await GemmaBridge.checkModelExists(modelId);
    return { success: true, data: status };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message, errorCode: 'MODEL_CHECK_FAILED' };
  }
}

async function checkModelStatus(): Promise<ServiceResponse<'AVAILABLE' | 'DOWNLOADABLE' | 'UNAVAILABLE'>> {
  return { success: true, data: 'AVAILABLE' };
}

async function cancelDownload(
  modelId: string
): Promise<void> {
  await GemmaBridge.cancelDownload(modelId);
}

async function downloadModelFile(
  modelId: string
): Promise<ServiceResponse<void>> {
  try {
    await GemmaBridge.downloadModelFile(modelId);
    return { success: true, data: undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message, errorCode: 'DOWNLOAD_FAILED' };
  }
}

async function importModelFromFile(
  modelId: string,
  fileUri: string
): Promise<ServiceResponse<void>> {
  try {
    await GemmaBridge.importModelFromFile(modelId, fileUri);
    return { success: true, data: undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message, errorCode: 'IMPORT_FAILED' };
  }
}

async function initEngine(
  modelId: string
): Promise<ServiceResponse<void>> {
  try {
    await GemmaBridge.initEngine(modelId);
    return { success: true, data: undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message, errorCode: 'ENGINE_INIT_FAILED' };
  }
}

async function runAgent(
  agentConfig: AgentConfig,
  userInput: string,
  context?: string
): Promise<ServiceResponse<AgentResponse>> {
  const prompt = buildPrompt(agentConfig, userInput, context);

  try {
    const raw = await GemmaBridge.generate(prompt);
    const toolCalls = extractToolCalls(raw);
    const content = toolCalls.length > 0 ? raw : raw;

    return {
      success: true,
      data: { content, toolCalls, raw },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message, errorCode: 'INFERENCE_FAILED' };
  }
}

async function generateRaw(text: string): Promise<ServiceResponse<string>> {
  try {
    const raw = await GemmaBridge.generate(text);
    return { success: true, data: raw };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message, errorCode: 'INFERENCE_FAILED' };
  }
}

async function closeEngine(): Promise<void> {
  try {
    await GemmaBridge.closeEngine();
  } catch {
    // ignore close errors
  }
}

function extractToolCalls(raw: string): Array<{ tool: string; parameters: Record<string, unknown> }> {
  const toolCalls: Array<{ tool: string; parameters: Record<string, unknown> }> = [];
  const regex = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.tool && parsed.parameters) {
        toolCalls.push({ tool: parsed.tool, parameters: parsed.parameters });
      }
    } catch {
      continue;
    }
  }
  return toolCalls;
}

export const GemmaService = {
  getDeviceProfile,
  selectBestModel,
  checkModelExists,
  checkModelStatus,
  downloadModelFile,
  importModelFromFile,
  cancelDownload,
  initEngine,
  runAgent,
  generateRaw,
  closeEngine,
};
