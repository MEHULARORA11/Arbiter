export interface ModelPricing {
  provider: 'openai' | 'claude' | 'gemini' | 'deepseek' | 'mistral';
  modelId: string;
  displayName: string;
  contextWindow: string;
  inputPricePer1M: number;
  cachedInputPricePer1M?: number;
  cacheWritePricePer1M?: number;
  cacheReadPricePer1M?: number;
  outputPricePer1M: number;
  batchDiscountPct: number;
  notes?: string;
  sourceUrl: string;
  lastVerifiedDate: string;
}

export const MODEL_PRICING: ModelPricing[] = [
  // Google Gemini
  {
    provider: 'gemini',
    modelId: 'gemini-3.5-flash',
    displayName: 'Gemini 3.5 Flash',
    contextWindow: '1M/64K',
    inputPricePer1M: 1.50,
    outputPricePer1M: 9.00,
    batchDiscountPct: 50,
    notes: 'free tier rate-limited',
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'gemini',
    modelId: 'gemini-3.1-pro-preview',
    displayName: 'Gemini 3.1 Pro Preview',
    contextWindow: '1M/2M',
    inputPricePer1M: 2.00, // ≤200K is 2.00, >200K is 4.00
    outputPricePer1M: 12.00, // ≤200K is 12.00, >200K is 18.00
    batchDiscountPct: 50,
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'gemini',
    modelId: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash Preview',
    contextWindow: '—',
    inputPricePer1M: 0.50,
    outputPricePer1M: 3.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'gemini',
    modelId: 'gemini-3.1-flash-lite',
    displayName: 'Gemini 3.1 Flash Lite',
    contextWindow: '—',
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.50,
    batchDiscountPct: 50,
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'gemini',
    modelId: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    contextWindow: '1M–2M',
    inputPricePer1M: 1.25, // ≤200K is 1.25, >200K is 2.50
    outputPricePer1M: 10.00, // ≤200K is 10.00, >200K is 15.00
    batchDiscountPct: 50,
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'gemini',
    modelId: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    contextWindow: '1M',
    inputPricePer1M: 0.30,
    outputPricePer1M: 2.50,
    batchDiscountPct: 50,
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'gemini',
    modelId: 'gemini-2.5-flash-lite',
    displayName: 'Gemini 2.5 Flash Lite',
    contextWindow: '—',
    inputPricePer1M: 0.10,
    outputPricePer1M: 0.40,
    batchDiscountPct: 50,
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'gemini',
    modelId: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash (Deprecated)',
    contextWindow: '—',
    inputPricePer1M: 0.10,
    outputPricePer1M: 0.40,
    batchDiscountPct: 50,
    notes: 'deprecated/shut down 2026-06-01 — remove from any live routing',
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'gemini',
    modelId: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    contextWindow: '2M',
    inputPricePer1M: 1.25, // ≤128k
    outputPricePer1M: 3.75,
    batchDiscountPct: 50,
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'gemini',
    modelId: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    contextWindow: '1M',
    inputPricePer1M: 0.075, // ≤128k
    outputPricePer1M: 0.30,
    batchDiscountPct: 50,
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },

  // OpenAI
  {
    provider: 'openai',
    modelId: 'gpt-5.6-sol',
    displayName: 'GPT-5.6 Sol',
    contextWindow: '1M',
    inputPricePer1M: 5.00,
    cachedInputPricePer1M: 0.50,
    outputPricePer1M: 30.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.6-terra',
    displayName: 'GPT-5.6 Terra',
    contextWindow: '1M',
    inputPricePer1M: 2.50,
    cachedInputPricePer1M: 0.25,
    outputPricePer1M: 15.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.6-luna',
    displayName: 'GPT-5.6 Luna',
    contextWindow: '1M',
    inputPricePer1M: 1.00,
    cachedInputPricePer1M: 0.10,
    outputPricePer1M: 6.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.5',
    displayName: 'GPT-5.5',
    contextWindow: '1M',
    inputPricePer1M: 5.00,
    cachedInputPricePer1M: 0.50,
    outputPricePer1M: 30.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.5-pro',
    displayName: 'GPT-5.5 Pro',
    contextWindow: '1M',
    inputPricePer1M: 30.00,
    outputPricePer1M: 180.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.4',
    displayName: 'GPT-5.4',
    contextWindow: '1M',
    inputPricePer1M: 2.50,
    cachedInputPricePer1M: 0.25,
    outputPricePer1M: 15.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.4-mini',
    displayName: 'GPT-5.4 Mini',
    contextWindow: '1M',
    inputPricePer1M: 0.75,
    cachedInputPricePer1M: 0.075,
    outputPricePer1M: 4.50,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.4-nano',
    displayName: 'GPT-5.4 Nano',
    contextWindow: '1M',
    inputPricePer1M: 0.20,
    cachedInputPricePer1M: 0.02,
    outputPricePer1M: 1.25,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.4-pro',
    displayName: 'GPT-5.4 Pro',
    contextWindow: '1M',
    inputPricePer1M: 30.00,
    outputPricePer1M: 180.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-5.3-codex',
    displayName: 'GPT-5.3 Codex',
    contextWindow: '—',
    inputPricePer1M: 1.75,
    cachedInputPricePer1M: 0.175,
    outputPricePer1M: 14.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    contextWindow: '128K',
    inputPricePer1M: 2.50,
    cachedInputPricePer1M: 1.25,
    outputPricePer1M: 10.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    contextWindow: '128K',
    inputPricePer1M: 0.15,
    cachedInputPricePer1M: 0.075,
    outputPricePer1M: 0.60,
    batchDiscountPct: 50,
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    lastVerifiedDate: '2026-07-13'
  },

  // Anthropic Claude
  {
    provider: 'claude',
    modelId: 'claude-fable-5',
    displayName: 'Claude Fable 5',
    contextWindow: '1M',
    inputPricePer1M: 10.00,
    cacheWritePricePer1M: 12.50,
    cacheReadPricePer1M: 1.00,
    outputPricePer1M: 50.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'claude',
    modelId: 'claude-mythos-5',
    displayName: 'Claude Mythos 5 (Limited)',
    contextWindow: '1M',
    inputPricePer1M: 10.00,
    cacheWritePricePer1M: 12.50,
    cacheReadPricePer1M: 1.00,
    outputPricePer1M: 50.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'claude',
    modelId: 'claude-opus-4-8',
    displayName: 'Claude Opus 4.8',
    contextWindow: '1M',
    inputPricePer1M: 5.00,
    cacheWritePricePer1M: 6.25,
    cacheReadPricePer1M: 0.50,
    outputPricePer1M: 25.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'claude',
    modelId: 'claude-sonnet-5',
    displayName: 'Claude Sonnet 5',
    contextWindow: '1M',
    inputPricePer1M: 2.00,
    cacheWritePricePer1M: 2.50,
    cacheReadPricePer1M: 0.20,
    outputPricePer1M: 10.00,
    batchDiscountPct: 50,
    notes: 'intro price thru 2026-08-31; $3.00/$3.75/$0.30/$15.00 after',
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'claude',
    modelId: 'claude-haiku-4-5-20251001',
    displayName: 'Claude Haiku 4.5',
    contextWindow: '200K',
    inputPricePer1M: 1.00,
    cacheWritePricePer1M: 1.25,
    cacheReadPricePer1M: 0.10,
    outputPricePer1M: 5.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'claude',
    modelId: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    contextWindow: '200K',
    inputPricePer1M: 3.00,
    cacheWritePricePer1M: 3.75,
    cacheReadPricePer1M: 0.30,
    outputPricePer1M: 15.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'claude',
    modelId: 'claude-3-5-haiku-20241022',
    displayName: 'Claude 3.5 Haiku',
    contextWindow: '200K',
    inputPricePer1M: 0.80,
    cacheWritePricePer1M: 1.00,
    cacheReadPricePer1M: 0.08,
    outputPricePer1M: 4.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://platform.claude.com/docs/en/about-claude/pricing',
    lastVerifiedDate: '2026-07-13'
  },

  // DeepSeek
  {
    provider: 'deepseek',
    modelId: 'deepseek-v4-flash',
    displayName: 'DeepSeek V4 Flash',
    contextWindow: '1M',
    inputPricePer1M: 0.14, // cache miss rate
    cachedInputPricePer1M: 0.0028, // cache hit rate
    outputPricePer1M: 0.28,
    batchDiscountPct: 0,
    notes: 'migrated legacy deepseek-chat/reasoner aliases to this model',
    sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'deepseek',
    modelId: 'deepseek-v4-pro',
    displayName: 'DeepSeek V4 Pro',
    contextWindow: '1M',
    inputPricePer1M: 0.435, // cache miss rate
    cachedInputPricePer1M: 0.003625, // cache hit rate
    outputPricePer1M: 0.87,
    batchDiscountPct: 0,
    sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    displayName: 'DeepSeek Chat (Legacy)',
    contextWindow: '64K',
    inputPricePer1M: 0.14,
    cachedInputPricePer1M: 0.0028,
    outputPricePer1M: 0.28,
    batchDiscountPct: 0,
    notes: 'deprecated, maps to deepseek-v4-flash without thinking',
    sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'deepseek',
    modelId: 'deepseek-reasoner',
    displayName: 'DeepSeek Reasoner (Legacy)',
    contextWindow: '64K',
    inputPricePer1M: 0.435,
    cachedInputPricePer1M: 0.003625,
    outputPricePer1M: 0.87,
    batchDiscountPct: 0,
    notes: 'deprecated, maps to deepseek-v4-pro / thinking flash',
    sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    lastVerifiedDate: '2026-07-13'
  },

  // Mistral
  {
    provider: 'mistral',
    modelId: 'mistral-large-latest',
    displayName: 'Mistral Large 3',
    contextWindow: '128K',
    inputPricePer1M: 0.50,
    outputPricePer1M: 1.50,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'mistral',
    modelId: 'mistral-medium-3-5',
    displayName: 'Mistral Medium 3.5',
    contextWindow: '256K',
    inputPricePer1M: 1.50,
    outputPricePer1M: 7.50,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'mistral',
    modelId: 'mistral-small-latest',
    displayName: 'Mistral Small 4',
    contextWindow: '32K',
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.60,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'mistral',
    modelId: 'magistral-medium-latest',
    displayName: 'Magistral Medium',
    contextWindow: '256K',
    inputPricePer1M: 2.00,
    outputPricePer1M: 5.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'mistral',
    modelId: 'magistral-small-latest',
    displayName: 'Magistral Small',
    contextWindow: '256K',
    inputPricePer1M: 0.50,
    outputPricePer1M: 1.50,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'mistral',
    modelId: 'devstral-2512',
    displayName: 'Devstral 2',
    contextWindow: '128K',
    inputPricePer1M: 0.40,
    outputPricePer1M: 2.00,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'mistral',
    modelId: 'devstral-small-latest',
    displayName: 'Devstral Small 2',
    contextWindow: '128K',
    inputPricePer1M: 0.10,
    outputPricePer1M: 0.30,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'mistral',
    modelId: 'codestral-latest',
    displayName: 'Codestral',
    contextWindow: '32K',
    inputPricePer1M: 0.30,
    outputPricePer1M: 0.90,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'mistral',
    modelId: 'ministral-14b-latest',
    displayName: 'Ministral 3 14B',
    contextWindow: '256K',
    inputPricePer1M: 0.20,
    outputPricePer1M: 0.20,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'mistral',
    modelId: 'ministral-8b-latest',
    displayName: 'Ministral 3 8B',
    contextWindow: '256K',
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.15,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  },
  {
    provider: 'mistral',
    modelId: 'ministral-3b-latest',
    displayName: 'Ministral 3 3B',
    contextWindow: '256K',
    inputPricePer1M: 0.10,
    outputPricePer1M: 0.10,
    batchDiscountPct: 50,
    sourceUrl: 'https://mistral.ai/pricing/api',
    lastVerifiedDate: '2026-07-13'
  }
];
