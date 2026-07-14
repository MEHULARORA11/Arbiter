export async function* makeLineIterator(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      yield line;
    }
  }
  if (buffer) {
    yield buffer;
  }
}

import { MODEL_PRICING } from '@/config/modelPricing';

export function calculateRunCost(
  provider: string,
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  options?: {
    cachedTokens?: number;
    cacheWriteTokens?: number;
    cacheReadTokens?: number;
    isBatch?: boolean;
  }
): number {
  const normalizedProvider = provider.toLowerCase();
  
  // Find model pricing in config
  let model = MODEL_PRICING.find(
    (m) => m.modelId === modelId && m.provider === normalizedProvider
  );

  // DeepSeek alias migrations helper
  if (!model && normalizedProvider === 'deepseek') {
    if (modelId === 'deepseek-chat' || modelId === 'deepseek-reasoner') {
      model = MODEL_PRICING.find(m => m.modelId === 'deepseek-v4-flash');
    }
  }

  if (!model) {
    // fallback rates if model not found
    console.warn(`[cost] Unknown model, using fallback pricing: ${provider} (${modelId})`);
    const fallbackRates = { input: 1.0, output: 3.0 }; // rates per 1M tokens
    return ((inputTokens * fallbackRates.input) + (outputTokens * fallbackRates.output)) / 1000000;
  }

  let inputCost = 0;
  let outputCost = 0;

  const isBatch = options?.isBatch ?? false;
  const discountMultiplier = isBatch ? (1 - model.batchDiscountPct / 100) : 1;

  if (model.provider === 'claude') {
    // Claude caching: cache read, cache write, and standard input
    const cacheReadTokens = options?.cacheReadTokens ?? options?.cachedTokens ?? 0;
    const cacheWriteTokens = options?.cacheWriteTokens ?? 0;
    const standardInputTokens = Math.max(0, inputTokens - cacheReadTokens - cacheWriteTokens);

    const standardPrice = model.inputPricePer1M;
    const cacheReadPrice = model.cacheReadPricePer1M ?? standardPrice;
    const cacheWritePrice = model.cacheWritePricePer1M ?? standardPrice;

    inputCost = (
      (standardInputTokens * standardPrice) +
      (cacheReadTokens * cacheReadPrice) +
      (cacheWriteTokens * cacheWritePrice)
    ) / 1000000;
  } else if (model.provider === 'openai') {
    // OpenAI caching: cached input vs standard input
    const cachedTokens = options?.cachedTokens ?? 0;
    const standardInputTokens = Math.max(0, inputTokens - cachedTokens);

    const standardPrice = model.inputPricePer1M;
    const cachedPrice = model.cachedInputPricePer1M ?? standardPrice;

    inputCost = (
      (standardInputTokens * standardPrice) +
      (cachedTokens * cachedPrice)
    ) / 1000000;
  } else if (model.provider === 'deepseek') {
    // DeepSeek caching: cached input vs standard input
    const cachedTokens = options?.cachedTokens ?? 0;
    const standardInputTokens = Math.max(0, inputTokens - cachedTokens);

    const standardPrice = model.inputPricePer1M;
    const cachedPrice = model.cachedInputPricePer1M ?? standardPrice;

    inputCost = (
      (standardInputTokens * standardPrice) +
      (cachedTokens * cachedPrice)
    ) / 1000000;
  } else if (model.provider === 'gemini') {
    // Gemini tiered pricing
    let standardPrice = model.inputPricePer1M;
    let outPrice = model.outputPricePer1M;

    if (model.modelId === 'gemini-3.1-pro-preview') {
      if (inputTokens <= 200000) {
        standardPrice = 2.00;
        outPrice = 12.00;
      } else {
        standardPrice = 4.00;
        outPrice = 18.00;
      }
    } else if (model.modelId === 'gemini-2.5-pro') {
      if (inputTokens <= 200000) {
        standardPrice = 1.25;
        outPrice = 10.00;
      } else {
        standardPrice = 2.50;
        outPrice = 15.00;
      }
    }

    inputCost = (inputTokens * standardPrice) / 1000000;
    outputCost = (outputTokens * outPrice) / 1000000;
  } else {
    // Mistral and others
    inputCost = (inputTokens * model.inputPricePer1M) / 1000000;
  }

  // If outputCost wasn't calculated by provider specific logic (like Gemini tiered)
  if (outputCost === 0) {
    outputCost = (outputTokens * model.outputPricePer1M) / 1000000;
  }

  return (inputCost + outputCost) * discountMultiplier;
}
