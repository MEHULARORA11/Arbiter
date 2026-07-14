export const API_KEY_PATTERNS: Record<string, RegExp> = {
  openai: /^sk(?:-proj|-svcacct|-admin)?-[A-Za-z0-9_-]{20,}$/,
  claude: /^sk-ant-api[0-9A-Za-z_-]{20,}$/,
  gemini: /^(AIza[A-Za-z0-9_-]{20,}|AQ[A-Za-z0-9._-]{20,})$/,
  deepseek: /^sk-[A-Za-z0-9_-]{20,}$/,
  mistral: /^[A-Za-z0-9._-]{20,}$/
};

export const checkKeyValidity = (
  provider: string,
  key: string
): "empty" | "valid" | "invalid" => {
  if (!key?.trim()) return "empty";

  const val = key.trim();
  const regex = API_KEY_PATTERNS[provider.toLowerCase()];

  if (!regex) return "invalid";

  return regex.test(val) ? "valid" : "invalid";
};
