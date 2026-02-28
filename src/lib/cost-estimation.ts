const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number; cacheReadPer1M: number; cacheWritePer1M: number }> = {
  "claude-opus-4-6": { inputPer1M: 15, outputPer1M: 75, cacheReadPer1M: 1.50, cacheWritePer1M: 18.75 },
  "claude-sonnet-4-6": { inputPer1M: 3, outputPer1M: 15, cacheReadPer1M: 0.30, cacheWritePer1M: 3.75 },
  "claude-sonnet-4-20250514": { inputPer1M: 3, outputPer1M: 15, cacheReadPer1M: 0.30, cacheWritePer1M: 3.75 },
  "claude-3-5-sonnet-20241022": { inputPer1M: 3, outputPer1M: 15, cacheReadPer1M: 0.30, cacheWritePer1M: 3.75 },
  "claude-3-5-haiku-20241022": { inputPer1M: 0.80, outputPer1M: 4, cacheReadPer1M: 0.08, cacheWritePer1M: 1 },
  "claude-haiku-4-5-20251001": { inputPer1M: 0.80, outputPer1M: 4, cacheReadPer1M: 0.08, cacheWritePer1M: 1 },
};

const DEFAULT_PRICING = { inputPer1M: 3, outputPer1M: 15, cacheReadPer1M: 0.30, cacheWritePer1M: 3.75 };

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  totalCost: number;
}

function getPricing(model: string) {
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];
  // Fuzzy match by prefix
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key.split("-").slice(0, 3).join("-"))) return pricing;
  }
  return DEFAULT_PRICING;
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheCreateTokens: number
): CostBreakdown {
  const pricing = getPricing(model);
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * pricing.cacheReadPer1M;
  const cacheWriteCost = (cacheCreateTokens / 1_000_000) * pricing.cacheWritePer1M;

  return {
    inputCost,
    outputCost,
    cacheReadCost,
    cacheWriteCost,
    totalCost: inputCost + outputCost + cacheReadCost + cacheWriteCost,
  };
}

export function formatCost(dollars: number): string {
  if (dollars < 0.01) return "<$0.01";
  return `$${dollars.toFixed(2)}`;
}
