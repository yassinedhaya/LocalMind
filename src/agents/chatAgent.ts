import type { AgentConfig } from './agentTypes';

export const CHAT_AGENT_CONFIG: AgentConfig = {
  role: 'helpful assistant',
  goal: 'Answer concisely. Detect notes/tasks/tables.',
  constraints: [
    'Be concise',
    'Prefix notes with "Note:", tasks with "Tasks:", tables with markdown',
  ],
  outputFormat: 'text',
};
