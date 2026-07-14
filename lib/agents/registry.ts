import { AgentAdapter } from './types';
import { openAiAdapter } from './openai';
import { claudeAdapter } from './claude';
import { geminiAdapter } from './gemini';
import { deepseekAdapter } from './deepseek';
import { mistralAdapter } from './mistral';

export const AGENT_REGISTRY: Record<string, AgentAdapter> = {
  openai: openAiAdapter,
  claude: claudeAdapter,
  gemini: geminiAdapter,
  deepseek: deepseekAdapter,
  mistral: mistralAdapter
};

export function getAgentAdapter(provider: string): AgentAdapter {
  const adapter = AGENT_REGISTRY[provider.toLowerCase()];
  if (!adapter) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return adapter;
}
