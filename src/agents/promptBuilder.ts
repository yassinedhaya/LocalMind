import type { AgentConfig } from './agentTypes';

function buildOutputFormatInstruction(format: AgentConfig['outputFormat']): string {
  switch (format) {
    case 'json':
      return 'Respond ONLY with valid JSON. No markdown, no explanation.';
    case 'code':
      return 'Respond ONLY with code inside a single markdown code block. No explanation.';
    case 'steps':
      return 'Respond with a numbered list of steps. Be clear and concise for each step.';
    case 'text':
    default:
      return 'Respond in clear, well-structured text.';
  }
}

function buildToolsBlock(config: AgentConfig): string {
  if (!config.tools || config.tools.length === 0) {
    return '';
  }

  const toolEntries = config.tools
    .map(
      (tool) => `### ${tool.name}
Description: ${tool.description}
Parameters: ${JSON.stringify(tool.parameters, null, 2)}
To call a tool respond with:
<tool_call>{"tool": "${tool.name}", "parameters": {...}}</tool_call>`
    )
    .join('\n\n');

  return `\n## Available Tools\n${toolEntries}`;
}

function buildConstraintsBlock(constraints: string[]): string {
  if (constraints.length === 0) {
    return '';
  }
  return constraints.map((c) => `- ${c}`).join('\n');
}

export function buildPrompt(
  config: AgentConfig,
  userInput: string,
  context?: string
): string {
  const parts: string[] = [];

  parts.push('<system>');
  parts.push(`You are a ${config.role}.`);
  parts.push(`Goal: ${config.goal}`);
  parts.push('');

  const constraintsText = buildConstraintsBlock(config.constraints);
  if (constraintsText) {
    parts.push('## Constraints');
    parts.push(constraintsText);
  }

  const toolsText = buildToolsBlock(config);
  if (toolsText) {
    parts.push(toolsText);
  }

  parts.push('');
  parts.push('## Output Format');
  parts.push(buildOutputFormatInstruction(config.outputFormat));
  parts.push('</system>');
  parts.push('');

  if (context) {
    parts.push('## Context');
  parts.push(context);
    parts.push('');
  }

  parts.push('## User Request');
  parts.push(userInput);
  parts.push('');
  parts.push('## Response');

  return parts.join('\n');
}
