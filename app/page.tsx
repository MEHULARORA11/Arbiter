"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { marked } from "marked";
import { checkKeyValidity } from "@/lib/validation/apiKeys";
import { authFetch } from "@/lib/client/authFetch";
import { calculateRunCost } from "@/lib/agents/utils";

// ==================== METADATA & CONSTANTS ====================

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  avatarColor: string;
  borderColor: string;
  textColor: string;
  accentBg: string;
  inputCostPer1K: number;  // Dummy rates
  outputCostPer1K: number; // Dummy rates
  strength: string;
  placeholderKey: string;
  rawResponseTemplate: string;
}

interface ModelOption {
  id: string;
  name: string;
  inputCostPer1K: number;
  outputCostPer1K: number;
  strength: string;
  rawResponseTemplate: string;
}

const PROVIDER_META: Record<string, {
  provider: string;
  avatarColor: string;
  borderColor: string;
  textColor: string;
  accentBg: string;
  placeholderKey: string;
}> = {
  openai: {
    provider: "OpenAI",
    avatarColor: "bg-model-openai",
    borderColor: "border-model-openai/30 hover:border-model-openai/60",
    textColor: "text-model-openai",
    accentBg: "bg-model-openai/10",
    placeholderKey: "sk-proj-..."
  },
  claude: {
    provider: "Anthropic",
    avatarColor: "bg-model-claude",
    borderColor: "border-model-claude/30 hover:border-model-claude/60",
    textColor: "text-model-claude",
    accentBg: "bg-model-claude/10",
    placeholderKey: "sk-ant-..."
  },
  gemini: {
    provider: "Google",
    avatarColor: "bg-model-gemini",
    borderColor: "border-model-gemini/30 hover:border-model-gemini/60",
    textColor: "text-model-gemini",
    accentBg: "bg-model-gemini/10",
    placeholderKey: "AIzaSy..."
  },
  deepseek: {
    provider: "DeepSeek",
    avatarColor: "bg-model-deepseek",
    borderColor: "border-model-deepseek/30 hover:border-model-deepseek/60",
    textColor: "text-model-deepseek",
    accentBg: "bg-model-deepseek/10",
    placeholderKey: "sk-ds-..."
  },
  mistral: {
    provider: "Mistral",
    avatarColor: "bg-model-mistral",
    borderColor: "border-model-mistral/30 hover:border-model-mistral/60",
    textColor: "text-model-mistral",
    accentBg: "bg-model-mistral/10",
    placeholderKey: "Mistral key..."
  }
};

const PROVIDER_MODELS: Record<string, ModelOption[]> = {
  openai: [
    {
      id: "gpt-5.4",
      name: "GPT-5.4",
      inputCostPer1K: 0.0025,
      outputCostPer1K: 0.0150,
      strength: "General purpose high intelligence model.",
      rawResponseTemplate: `### OpenAI GPT-5.4 Response
Here is the requested sorting analysis:
* **QuickSort**: Average $O(n \log n)$, Worst $O(n^2)$. Very fast in-place partitioning.
* **MergeSort**: Always $O(n \log n)$. Stable, preserves index sequences, but uses $O(n)$ extra memory.`
    },
    {
      id: "gpt-5.4-mini",
      name: "GPT-5.4 Mini",
      inputCostPer1K: 0.00075,
      outputCostPer1K: 0.0045,
      strength: "Super fast, lightweight tasks, extremely cost-efficient.",
      rawResponseTemplate: `### OpenAI GPT-5.4 Mini Response
Brief sorting recap:
* **QuickSort**: Fast, in-place, unstable. $O(n \log n)$ average.
* **MergeSort**: Stable, requires $O(n)$ space.`
    },
    {
      id: "gpt-5.6-sol",
      name: "GPT-5.6 Sol",
      inputCostPer1K: 0.0050,
      outputCostPer1K: 0.0300,
      strength: "State-of-the-art flagship model.",
      rawResponseTemplate: `### OpenAI GPT-5.6 Sol Response
Sorting analysis on flagship scale:
1. QuickSort partitions in place. This makes it cache-friendly since memory access is sequential.
2. MergeSort divides and conquers, but the merge step is stable.`
    },
    {
      id: "gpt-5.6-terra",
      name: "GPT-5.6 Terra",
      inputCostPer1K: 0.0025,
      outputCostPer1K: 0.0150,
      strength: "Balanced performance and efficiency.",
      rawResponseTemplate: `### OpenAI GPT-5.6 Terra Response
Terra balanced sorting analysis.`
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      inputCostPer1K: 0.0025,
      outputCostPer1K: 0.0100,
      strength: "Stable legacy flagship model.",
      rawResponseTemplate: `### OpenAI GPT-4o Response
GPT-4o sorting comparison:
- QuickSort: Fast partition-based sorting.
- MergeSort: Stable division-based sorting.`
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      inputCostPer1K: 0.00015,
      outputCostPer1K: 0.0006,
      strength: "Cost-efficient lightweight stable model.",
      rawResponseTemplate: `### OpenAI GPT-4o Mini Response
GPT-4o Mini fast sorting overview.`
    }
  ],
  claude: [
    {
      id: "claude-sonnet-5",
      name: "Claude Sonnet 5",
      inputCostPer1K: 0.0020,
      outputCostPer1K: 0.0100,
      strength: "Architectural reasoning, edge case handling, and complexity bounds.",
      rawResponseTemplate: `### Claude Sonnet 5 Response
Evaluating sorting architectures:
* **Memory Limits**: MergeSort auxiliary array space can cause OOM on heap limits. QuickSort uses stack memory $O(\log n)$.
* **Stability Requirement**: If sorting complex data elements, MergeSort's stable merge preserves historical orders.`
    },
    {
      id: "claude-haiku-4-5-20251001",
      name: "Claude Haiku 4.5",
      inputCostPer1K: 0.0010,
      outputCostPer1K: 0.0050,
      strength: "Rapid text generation, fast coding suggestions.",
      rawResponseTemplate: `### Claude Haiku 4.5 Response
Quick summary of QuickSort and MergeSort:
* **QuickSort**: $O(n \log n)$ average, $O(n^2)$ worst-case. Not stable.
* **MergeSort**: $O(n \log n)$ always. Stable.`
    },
    {
      id: "claude-opus-4-8",
      name: "Claude Opus 4.8",
      inputCostPer1K: 0.0050,
      outputCostPer1K: 0.0250,
      strength: "High-level planning, deep conceptual explanations.",
      rawResponseTemplate: `### Claude Opus 4.8 Response
A comprehensive analysis of divide-and-conquer sorting algorithms:
* In systems with virtual memory, the non-locality of MergeSort's merge phase can induce page faults.`
    },
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      inputCostPer1K: 0.0030,
      outputCostPer1K: 0.0150,
      strength: "Highly capable reasoning and software engineering model.",
      rawResponseTemplate: `### Claude 3.5 Sonnet Response
Evaluating sorting algorithms in Claude 3.5 Sonnet.`
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      inputCostPer1K: 0.0008,
      outputCostPer1K: 0.0040,
      strength: "Fast, balanced legacy model.",
      rawResponseTemplate: `### Claude 3.5 Haiku Response
Fast legacy sorting suggestions.`
    }
  ],
  gemini: [
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      inputCostPer1K: 0.0003,
      outputCostPer1K: 0.0025,
      strength: "Ultra-fast response with 1M context window.",
      rawResponseTemplate: `### Gemini 2.5 Flash Response
Here is a fast review:
* QuickSort: fast, in-place ($O(1)$ auxiliary space if tail-optimized).
* MergeSort: stable sorting ($O(n)$ space required).`
    },
    {
      id: "gemini-3.5-flash",
      name: "Gemini 3.5 Flash",
      inputCostPer1K: 0.0015,
      outputCostPer1K: 0.0090,
      strength: "Free tier rate-limited, high context flash model.",
      rawResponseTemplate: `### Gemini 3.5 Flash Response
Expository review:
* **MergeSort**: safe, but auxiliary space required is $O(n)$.
* **QuickSort**: very fast cache locality swap operations.`
    },
    {
      id: "gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro Preview",
      inputCostPer1K: 0.0020,
      outputCostPer1K: 0.0120,
      strength: "Advanced coding and multimodal reasoning model.",
      rawResponseTemplate: `### Gemini 3.1 Pro Response
Tiered pricing applied based on context window prompt size.`
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      inputCostPer1K: 0.00125,
      outputCostPer1K: 0.0100,
      strength: "Robust reasoning with 1M-2M context window.",
      rawResponseTemplate: `### Gemini 2.5 Pro Response
Think of sorting like sorting a library book shelf:
* **MergeSort**: You break the shelf into 2 halves, ask 2 assistants to sort them separately, and merge.
* **QuickSort**: You pick a random book (pivot), place all thinner books to the left and thicker to the right.`
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      inputCostPer1K: 0.00125,
      outputCostPer1K: 0.00375,
      strength: "Legacy reasoning model with large context.",
      rawResponseTemplate: `### Gemini 1.5 Pro Response
Legacy context-based sorting.`
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      inputCostPer1K: 0.000075,
      outputCostPer1K: 0.0003,
      strength: "Legacy high-speed model.",
      rawResponseTemplate: `### Gemini 1.5 Flash Response
Fast legacy review.`
    }
  ],
  deepseek: [
    {
      id: "deepseek-v4-flash",
      name: "DeepSeek V4 Flash",
      inputCostPer1K: 0.00014,
      outputCostPer1K: 0.00028,
      strength: "Extremely cost-effective reasoning and clean logic.",
      rawResponseTemplate: `### DeepSeek V4 Flash Response
Analyzing recursive optimizations:
* QuickSort is standard in libraries like C++ std::sort (IntroSort fallback) due to pointer cache benefits.`
    },
    {
      id: "deepseek-v4-pro",
      name: "DeepSeek V4 Pro",
      inputCostPer1K: 0.000435,
      outputCostPer1K: 0.00087,
      strength: "Deep reasoning, chain of thought, math and coding logic.",
      rawResponseTemplate: `### DeepSeek V4 Pro Response
<thought>
The user wants a comparison of QuickSort vs MergeSort.
I should break down:
1. Time complexity.
2. Cache performance.
</thought>
DeepSeek R1/Pro recommendations on sorting stability.`
    },
    {
      id: "deepseek-chat",
      name: "DeepSeek Chat (Legacy)",
      inputCostPer1K: 0.00014,
      outputCostPer1K: 0.00028,
      strength: "Cost-effective legacy model.",
      rawResponseTemplate: `### DeepSeek Chat Response
Legacy chat response.`
    },
    {
      id: "deepseek-reasoner",
      name: "DeepSeek Reasoner (Legacy)",
      inputCostPer1K: 0.000435,
      outputCostPer1K: 0.00087,
      strength: "Legacy reasoning model.",
      rawResponseTemplate: `### DeepSeek Reasoner Response
Legacy reasoner response.`
    }
  ],
  mistral: [
    {
      id: "mistral-large-latest",
      name: "Mistral Large 3",
      inputCostPer1K: 0.0005,
      outputCostPer1K: 0.0015,
      strength: "Systems design, localization, and low overhead.",
      rawResponseTemplate: `### Mistral Large 3 Response
Sorting complexity profile:
* MergeSort is stable, parallelizable on disk blocks.
* QuickSort swaps are blazing fast due to CPU cache alignments.`
    },
    {
      id: "mistral-small-latest",
      name: "Mistral Small 4",
      inputCostPer1K: 0.00015,
      outputCostPer1K: 0.0006,
      strength: "Fast lightweight tasks.",
      rawResponseTemplate: `### Mistral Small 4 Response
Quick sorting recap summary.`
    },
    {
      id: "codestral-latest",
      name: "Codestral",
      inputCostPer1K: 0.0003,
      outputCostPer1K: 0.0009,
      strength: "Code generation and completion.",
      rawResponseTemplate: `### Codestral Response
quicksort implementation in Python:
\`\`\`python
def quicksort(arr):
    # standard partition logic
    return sorted(arr)
\`\`\``
    }
  ]
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  // Stats tracked per chat per model (resets on chat switch)
  modelStats: Record<string, {
    latency: number;
    ttft?: number | null;
    inputTokens: number;
    cachedTokens?: number;
    outputTokens: number;
    cost: number;
    status: "idle" | "running" | "success" | "key_error" | "rate_limit" | "timeout" | "error";
    rawResponse: string;
  }>;
}

const generateMockTitle = (query: string): string => {
  const clean = query.trim().toLowerCase();
  if (clean.includes("sorting") || clean.includes("sort")) {
    if (clean.includes("quicksort") || clean.includes("quick sort")) return "QuickSort Deep Dive";
    if (clean.includes("mergesort") || clean.includes("merge sort")) return "MergeSort Analysis";
    return "Sorting Algorithms Compared";
  }
  if (clean.includes("binary search") || clean.includes("search")) return "Search Algorithms";
  if (clean.includes("complexity") || clean.includes("big o")) return "Time Complexity Analysis";
  if (clean.includes("code") || clean.includes("python") || clean.includes("javascript")) return "Code Review";
  
  const words = query.trim().split(/\s+/).filter(w => w.length > 3);
  if (words.length > 0) {
    return words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).replace(/[^a-zA-Z0-9]/g, "")).join(" ");
  }
  return "New Conversation";
};

async function consumeOrchestratorStream(
  response: Response,
  handlers: {
    onWorkerStart: (data: { provider: string; modelId: string }) => void;
    onWorkerDelta: (data: { provider: string; delta: string }) => void;
    onWorkerDone: (data: { provider: string; modelId: string; inputTokens: number; cachedInputTokens: number; outputTokens: number; latencyMs: number; ttftMs: number | null }) => void;
    onWorkerError: (data: { provider: string; modelId: string; errorType: string; message: string }) => void;
    onEvaluatorStart: (data: { provider: string; modelId: string }) => void;
    onEvaluatorDelta: (data: { delta: string }) => void;
    onEvaluatorDone: (data: { provider: string; modelId: string; inputTokens: number; cachedInputTokens: number; outputTokens: number; latencyMs: number; ttftMs: number | null }) => void;
    onFinalMessage: (data: { messageId: string; content: string; producedByModel: string; producedByRole: string }) => void;
    onUsageSummary: (data: { chat: { inputTokens: number; outputTokens: number; costUsd: string }; user: { inputTokens: number; outputTokens: number; costUsd: string } }) => void;
    onTitleUpdated?: (data: { chatId: string; title: string }) => void;
    onError: (message: string) => void;
  }
) {
  if (!response.body) {
    handlers.onError("Empty response body returned by stream server.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const eventStr of events) {
        if (!eventStr.trim()) continue;
        const lines = eventStr.split("\n");
        let event = "";
        let data: any = null;

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            event = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              data = JSON.parse(line.slice(6).trim());
            } catch (e) {}
          }
        }

        if (!event || !data) continue;

        if (event === "worker_start") {
          handlers.onWorkerStart(data);
        } else if (event === "worker_delta") {
          handlers.onWorkerDelta(data);
        } else if (event === "worker_done") {
          handlers.onWorkerDone(data);
        } else if (event === "worker_error") {
          handlers.onWorkerError(data);
        } else if (event === "evaluator_start") {
          handlers.onEvaluatorStart(data);
        } else if (event === "evaluator_delta") {
          handlers.onEvaluatorDelta(data);
        } else if (event === "evaluator_done") {
          handlers.onEvaluatorDone(data);
        } else if (event === "final_message") {
          handlers.onFinalMessage(data);
        } else if (event === "usage_summary") {
          handlers.onUsageSummary(data);
        } else if (event === "title_updated" && handlers.onTitleUpdated) {
          handlers.onTitleUpdated(data);
        } else if (event === "error") {
          handlers.onError(data.message);
        }
      }
    }
  } catch (err: any) {
    handlers.onError(err.message || "Error parsing orchestrator stream.");
  }
}

const formatErrorMessage = (error: unknown): string => {
  if (!error) return "An unknown error occurred.";
  if (typeof error === "string") return error;
  
  if (typeof error === "object" && error !== null) {
    const messages: string[] = [];
    const errObj = error as Record<string, unknown>;
    
    if (errObj._errors && Array.isArray(errObj._errors) && errObj._errors.length > 0) {
      messages.push(...(errObj._errors as string[]));
    }
    
    Object.keys(errObj).forEach((key) => {
      if (key === "_errors") return;
      const fieldError = errObj[key];
      if (fieldError && typeof fieldError === "object" && fieldError !== null) {
        const fErr = fieldError as Record<string, unknown>;
        if (Array.isArray(fErr._errors) && fErr._errors.length > 0) {
          messages.push(`${key}: ${fErr._errors.join(", ")}`);
        } else if (Array.isArray(fErr) && fErr.length > 0) {
          messages.push(`${key}: ${fErr.join(", ")}`);
        }
      }
    });

    if (messages.length > 0) {
      return messages.join("; ");
    }
    
    try {
      return JSON.stringify(error);
    } catch {
      return "An error occurred (failed to serialize details).";
    }
  }
  
  return String(error);
};

export default function App() {
  // ==================== CORE STATE ====================

  // Models list state loaded from backend
  const [providerModels, setProviderModels] = useState<Record<string, ModelOption[]>>(PROVIDER_MODELS);

  // Auth
  const [user, setUser] = useState<{ id: string; name: string | null; email: string; avatarUrl?: string | null; totalInputTokens?: number; totalOutputTokens?: number; totalCostUsd?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Layout View Controls
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [keysModalOpen, setKeysModalOpen] = useState(false);

  // Active Selected Chat
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [nextChatCounter, setNextChatCounter] = useState(1);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState("");

  // Server-side usage tracking
  const [chatUsage, setChatUsage] = useState<{ inputTokens: number; outputTokens: number; costUsd: string }>({
    inputTokens: 0,
    outputTokens: 0,
    costUsd: "0"
  });
  const [userUsage, setUserUsage] = useState<{ inputTokens: number; outputTokens: number; costUsd: string }>({
    inputTokens: 0,
    outputTokens: 0,
    costUsd: "0"
  });
  const [showImportBanner, setShowImportBanner] = useState(false);

  // BYOK Credentials (Keys)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: "",
    claude: "",
    gemini: "",
    deepseek: "",
    mistral: ""
  });

  // Credentials configured status from backend
  const [credentialsMeta, setCredentialsMeta] = useState<Record<string, { hasKey: boolean; last4: string }>>({});

  // Key validation states for settings UI
  const [keyValidationStates, setKeyValidationStates] = useState<Record<string, "empty" | "valid" | "invalid">>({
    openai: "empty",
    claude: "empty",
    gemini: "empty",
    deepseek: "empty",
    mistral: "empty"
  });

  // API Call Error Configuration Simulator (GUEST ONLY)
  // 'success' | 'key_error' | 'rate_limit' | 'timeout'
  const [apiErrorConfigs, setApiErrorConfigs] = useState<Record<string, "success" | "key_error" | "rate_limit" | "timeout">>({
    openai: "success",
    claude: "success",
    gemini: "success",
    deepseek: "success",
    mistral: "success"
  });

  // Selected Model version choices per provider/LLM type
  const [selectedModelIds, setSelectedModelIds] = useState<Record<string, string>>({
    openai: "gpt-5.4",
    claude: "claude-sonnet-5",
    gemini: "gemini-2.5-flash",
    deepseek: "deepseek-v4-flash",
    mistral: "mistral-large-latest"
  });

  // Helper to initialize clean stats
  const getCleanStats = () => {
    const initialStats: Record<string, any> = {};
    Object.keys(PROVIDER_META).forEach((k) => {
      initialStats[k] = {
        latency: 0,
        ttft: null,
        inputTokens: 0,
        cachedTokens: 0,
        outputTokens: 0,
        cost: 0,
        status: "idle",
        rawResponse: ""
      };
    });
    return initialStats;
  };

  // Dynamically build model templates based on user active version selection
  const MODEL_TEMPLATES = React.useMemo(() => {
    const templates: Record<string, ModelConfig> = {};
    Object.keys(PROVIDER_META).forEach((provider) => {
      const activeModelId = selectedModelIds[provider];
      const option = providerModels[provider].find((o) => o.id === activeModelId) || providerModels[provider][0];
      const providerMeta = PROVIDER_META[provider];
      
      templates[provider] = {
        id: provider,
        name: option.name,
        provider: providerMeta.provider,
        avatarColor: providerMeta.avatarColor,
        borderColor: providerMeta.borderColor,
        textColor: providerMeta.textColor,
        accentBg: providerMeta.accentBg,
        inputCostPer1K: option.inputCostPer1K,
        outputCostPer1K: option.outputCostPer1K,
        strength: option.strength,
        placeholderKey: providerMeta.placeholderKey,
        rawResponseTemplate: option.rawResponseTemplate
      };
    });
    return templates;
  }, [selectedModelIds, providerModels]);

  // Orchestrator Configuration Defaults
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(["openai", "mistral", "claude"]);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string | null>("claude");
  const maxWorkers = selectedEvaluator ? 5 : 1;
  const [autoTitleModel, setAutoTitleModel] = useState<string>("mistral");

  // Effect to trim selected workers if evaluator is disabled
  useEffect(() => {
    if (!selectedEvaluator && selectedWorkers.length > 1) {
      setSelectedWorkers(selectedWorkers.slice(0, 1));
    }
  }, [selectedEvaluator, selectedWorkers]);

  // UI state machine for orchestrator execution
  const [pipelineState, setPipelineState] = useState<"idle" | "running" | "completed">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeErrorMessage, setActiveErrorMessage] = useState<string | null>(null);

  // Inspector Card Focus
  const [selectedInspectorModel, setSelectedInspectorModel] = useState<string>("openai");

  // DOM Refs for Auto-Scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  // ==================== INITIALIZATION & PERSISTENCE ====================

  useEffect(() => {
    async function initAuthAndLoadData() {
      // Load models from backend
      try {
        const modelsRes = await fetch("/api/models");
        if (modelsRes.ok) {
          const list = await modelsRes.json();
          const grouped: Record<string, ModelOption[]> = {
            openai: [],
            claude: [],
            gemini: [],
            deepseek: [],
            mistral: []
          };
          list.forEach((m: any) => {
            const fallbackOption = PROVIDER_MODELS[m.provider]?.find((o: any) => o.id === m.modelId) || {
              strength: m.notes || "High performance model.",
              rawResponseTemplate: `### Response from ${m.displayName}`
            };
            grouped[m.provider].push({
              id: m.modelId,
              name: m.displayName,
              inputCostPer1K: m.inputPricePer1M / 1000,
              outputCostPer1K: m.outputPricePer1M / 1000,
              strength: fallbackOption.strength,
              rawResponseTemplate: fallbackOption.rawResponseTemplate
            });
          });
          setProviderModels(grouped);
        }
      } catch (e) {
        console.error("Failed to fetch models from backend:", e);
      }

      let activeUser = null;
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          activeUser = await res.json();
          setUser(activeUser);
          if (activeUser) {
            setUserUsage({
              inputTokens: activeUser.totalInputTokens || 0,
              outputTokens: activeUser.totalOutputTokens || 0,
              costUsd: activeUser.totalCostUsd || "0"
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth check failed", err);
        setUser(null);
      }

      const isGuest = !activeUser;

      // Load settings that remain local
      const storage = isGuest ? sessionStorage : localStorage;

      const savedModels = storage.getItem("orchestrator_selected_models");
      if (savedModels) {
        try {
          setSelectedModelIds(JSON.parse(savedModels));
        } catch (e) {
          console.error("Failed to parse saved models", e);
        }
      }

      const savedApiConfigs = storage.getItem("orchestrator_api_configs");
      if (savedApiConfigs) {
        try {
          setApiErrorConfigs(JSON.parse(savedApiConfigs));
        } catch (e) {
          console.error("Failed to parse error configs", e);
        }
      }

      if (isGuest) {
        // Load guest chats from sessionStorage
        const savedChats = sessionStorage.getItem("orchestrator_chats");
        if (savedChats) {
          try {
            const parsedChats = JSON.parse(savedChats);
            setChats(parsedChats);
            if (parsedChats.length > 0) {
              setActiveChatId(parsedChats[0].id);
            }
          } catch (e) {
            console.error("Failed to parse saved chats", e);
          }
        }
        // Load guest keys
        const savedKeys = sessionStorage.getItem("orchestrator_keys");
        if (savedKeys) {
          try {
            const parsed = JSON.parse(savedKeys);
            setApiKeys(parsed);
            const initialValidations: Record<string, "empty" | "valid" | "invalid"> = {};
            Object.keys(PROVIDER_META).forEach((k) => {
              initialValidations[k] = checkKeyValidity(k, parsed[k] || "");
            });
            setKeyValidationStates(initialValidations);
          } catch (e) {
            console.error("Failed to parse saved keys", e);
          }
        }
      } else {
        // Logged-in user: Load chats from server
        let dbChats: any[] = [];
        try {
          const chatsRes = await authFetch('/api/chats');
          if (chatsRes.ok) {
            dbChats = await chatsRes.json();
            setChats(dbChats.map((c: any) => ({
              id: c.id,
              title: c.title,
              messages: [],
              modelStats: getCleanStats()
            })));
            if (dbChats.length > 0) {
              setActiveChatId(dbChats[0].id);
            }
          }
        } catch (err) {
          console.error("Failed to load chats from server:", err);
        }

        // Load credentials metadata
        try {
          const credsRes = await authFetch('/api/credentials');
          if (credsRes.ok) {
            const data = await credsRes.json();
            const keysCopy = { ...apiKeys };
            const validationCopy = { ...keyValidationStates };
            const meta: Record<string, { hasKey: boolean; last4: string }> = {};

            data.forEach((c: any) => {
              meta[c.provider] = { hasKey: c.hasKey, last4: c.last4 };
              keysCopy[c.provider] = '••••••••••••••••';
              validationCopy[c.provider] = 'valid';
            });

            setCredentialsMeta(meta);
            setApiKeys(keysCopy);
            setKeyValidationStates(validationCopy);
          }
        } catch (err) {
          console.error("Failed to load credentials metadata:", err);
        }

        // Check if we can import guest chats
        const guestChatsStr = sessionStorage.getItem("orchestrator_chats");
        if (guestChatsStr && dbChats.length === 0) {
          try {
            const guestChats = JSON.parse(guestChatsStr);
            if (guestChats.length > 0) {
              setShowImportBanner(true);
            }
          } catch (e) {}
        }
      }

      const savedCounter = storage.getItem("orchestrator_chat_counter");
      if (savedCounter) {
        setNextChatCounter(parseInt(savedCounter, 10));
      }

      setAuthLoading(false);
    }

    initAuthAndLoadData();
  }, []); // Run once on mount

  // Sync state helpers
  const saveStateToStorage = (
    updatedChats: Chat[],
    updatedKeys: Record<string, string>,
    counter = nextChatCounter,
    updatedApiConfigs = apiErrorConfigs,
    updatedModels = selectedModelIds
  ) => {
    if (!user) {
      sessionStorage.setItem("orchestrator_chats", JSON.stringify(updatedChats));
      sessionStorage.setItem("orchestrator_keys", JSON.stringify(updatedKeys));
      sessionStorage.setItem("orchestrator_chat_counter", counter.toString());
      sessionStorage.setItem("orchestrator_api_configs", JSON.stringify(updatedApiConfigs));
      sessionStorage.setItem("orchestrator_selected_models", JSON.stringify(updatedModels));
    } else {
      localStorage.setItem("orchestrator_chat_counter", counter.toString());
      localStorage.setItem("orchestrator_api_configs", JSON.stringify(updatedApiConfigs));
      localStorage.setItem("orchestrator_selected_models", JSON.stringify(updatedModels));
    }
  };

  // Listen for auth failures
  useEffect(() => {
    const handleAuthFailed = () => {
      setUser(null);
      setChats([]);
      setActiveChatId(null);
      setNextChatCounter(1);
      setApiKeys({ openai: "", claude: "", gemini: "", deepseek: "", mistral: "" });
      setKeyValidationStates({ openai: "empty", claude: "empty", gemini: "empty", deepseek: "empty", mistral: "empty" });
      setApiErrorConfigs({ openai: "success", claude: "success", gemini: "success", deepseek: "success", mistral: "success" });
      setSelectedModelIds({ openai: "gpt-5.4", claude: "claude-sonnet-5", gemini: "gemini-2.5-flash", deepseek: "deepseek-v4-flash", mistral: "mistral-large-latest" });
    };
    window.addEventListener('auth-failed', handleAuthFailed);
    return () => window.removeEventListener('auth-failed', handleAuthFailed);
  }, []);

  // Lazy load chat details
  useEffect(() => {
    if (!activeChatId || !user) return;

    const loadActiveChatDetails = async () => {
      try {
        const res = await authFetch(`/api/chats/${activeChatId}`);
        if (res.ok) {
          const chatDetails = await res.json();
          setChats(prevChats => prevChats.map(c => {
            if (c.id === activeChatId) {
              const initialStats = getCleanStats();
              const userMessages = chatDetails.messages.filter((m: any) => m.role === 'user');
              if (userMessages.length > 0) {
                const lastUser = userMessages[userMessages.length - 1];
                if (lastUser.runs) {
                  lastUser.runs.forEach((run: any) => {
                    initialStats[run.provider] = {
                      latency: run.latencyMs / 1000,
                      inputTokens: run.inputTokens,
                      outputTokens: run.outputTokens,
                      cost: parseFloat(run.costUsd || '0'),
                      status: run.status,
                      rawResponse: run.rawResponse || run.errorMessage || ''
                    };
                  });
                }
              }

              return {
                ...c,
                title: chatDetails.title,
                messages: chatDetails.messages.map((m: any) => ({
                  role: m.role,
                  content: m.content
                })),
                modelStats: initialStats
              };
            }
            return c;
          }));

          setChatUsage({
            inputTokens: chatDetails.totalInputTokens || 0,
            outputTokens: chatDetails.totalOutputTokens || 0,
            costUsd: chatDetails.totalCostUsd || '0'
          });
        }
      } catch (err) {
        console.error('Failed to lazy load chat details:', err);
      }
    };

    loadActiveChatDetails();
  }, [activeChatId, user]);

  // Auto-scroll handler
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, pipelineState, activeChatId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputWrapperRef.current &&
        !inputWrapperRef.current.contains(e.target as Node)
      ) {
        inputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle worker selection limit according to choose number of workers
  const handleToggleWorker = (modelId: string) => {
    if (selectedWorkers.includes(modelId)) {
      if (selectedWorkers.length <= 1) return; // Minimum 1 worker must be active
      setSelectedWorkers(selectedWorkers.filter((id) => id !== modelId));
    } else {
      if (selectedWorkers.length >= maxWorkers) {
        // Remove the oldest selected worker to make room
        setSelectedWorkers([...selectedWorkers.slice(1), modelId]);
      } else {
        setSelectedWorkers([...selectedWorkers, modelId]);
      }
    }
  };

  // Real Google Login Redirect
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  // Real Sign Out calling Route Handler and resetting state
  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed", e);
    }

    setUser(null);

    // Reset core states to defaults (no chats, empty keys)
    setChats([]);
    setActiveChatId(null);
    setNextChatCounter(1);
    setCredentialsMeta({});
    setApiKeys({
      openai: "",
      claude: "",
      gemini: "",
      deepseek: "",
      mistral: ""
    });
    setKeyValidationStates({
      openai: "empty",
      claude: "empty",
      gemini: "empty",
      deepseek: "empty",
      mistral: "empty"
    });
    setApiErrorConfigs({
      openai: "success",
      claude: "success",
      gemini: "success",
      deepseek: "success",
      mistral: "success"
    });
    setSelectedModelIds({
      openai: "gpt-5.4",
      claude: "claude-sonnet-5",
      gemini: "gemini-2.5-flash",
      deepseek: "deepseek-v4-flash",
      mistral: "mistral-large-latest"
    });
    sessionStorage.clear();
  };

  // API Key Typing Validation (Local State Only)
  const handleKeyChange = (provider: string, value: string) => {
    const updated = { ...apiKeys, [provider]: value };
    setApiKeys(updated);

    const state = checkKeyValidity(provider, value);
    setKeyValidationStates((prev) => ({ ...prev, [provider]: state }));
  };

  const handleKeyBlur = async (provider: string, value: string) => {
    if (value === '••••••••••••••••' || value.trim() === '') return;
    const validity = checkKeyValidity(provider, value);
    setKeyValidationStates(prev => ({ ...prev, [provider]: validity }));
    if (validity !== 'valid') return;

    if (!user) {
      const updated = { ...apiKeys, [provider]: value };
      setApiKeys(updated);
      saveStateToStorage(chats, updated);
      return;
    }

    try {
      const res = await authFetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: value }),
      });
      if (res.ok) {
        const data = await res.json();
        setCredentialsMeta(prev => ({
          ...prev,
          [provider]: { hasKey: true, last4: data.last4 }
        }));
        setApiKeys(prev => ({ ...prev, [provider]: '••••••••••••••••' }));
      }
    } catch (e) {
      console.error('Failed to save key:', e);
    }
  };

  const handleKeyRevoke = async (provider: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: '' }));
    setKeyValidationStates(prev => ({ ...prev, [provider]: 'empty' }));
    setCredentialsMeta(prev => {
      const copy = { ...prev };
      delete copy[provider];
      return copy;
    });

    if (!user) {
      const updated = { ...apiKeys, [provider]: '' };
      saveStateToStorage(chats, updated);
      return;
    }

    try {
      await authFetch(`/api/credentials/${provider}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to delete key:', e);
    }
  };

  const handleImportGuestChats = async () => {
    const guestChatsStr = sessionStorage.getItem("orchestrator_chats");
    if (!guestChatsStr) return;

    try {
      const guestChats = JSON.parse(guestChatsStr);
      const res = await authFetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importChats: guestChats,
          selectedWorkers,
          selectedEvaluator,
          autoTitleModel,
        }),
      });

      if (res.ok) {
        const dbChats = await res.json();
        const mappedChats = dbChats.map((c: any) => ({
          id: c.id,
          title: c.title,
          messages: [],
          modelStats: getCleanStats()
        }));

        setChats(mappedChats);
        if (mappedChats.length > 0) {
          setActiveChatId(mappedChats[0].id);
        }
        setShowImportBanner(false);
        sessionStorage.removeItem("orchestrator_chats");
      }
    } catch (e) {
      console.error("Failed to import guest chats:", e);
    }
  };

  // ==================== SIDEBAR CHAT CREATION & EDITING ====================

  const handleNewChat = async () => {
    const title = `Chat ${nextChatCounter}`;
    const initialStats = getCleanStats();

    if (!user) {
      const newId = `chat_${Date.now()}`;
      const newChat: Chat = {
        id: newId,
        title,
        messages: [],
        modelStats: initialStats
      };

      const updatedChats = [newChat, ...chats];
      const newCounter = nextChatCounter + 1;
      
      setChats(updatedChats);
      setNextChatCounter(newCounter);
      setActiveChatId(newId);
      setPipelineState("idle");
      setActiveErrorMessage(null);

      saveStateToStorage(updatedChats, apiKeys, newCounter);
      setSidebarOpen(false);
      return;
    }

    try {
      const res = await authFetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          selectedWorkers,
          selectedEvaluator,
          autoTitleModel: `${autoTitleModel}:${selectedModelIds[autoTitleModel]}`
        })
      });

      if (res.ok) {
        const newChatData = await res.json();
        const newChat: Chat = {
          id: newChatData.id,
          title: newChatData.title,
          messages: [],
          modelStats: initialStats
        };

        setChats([newChat, ...chats]);
        setNextChatCounter(nextChatCounter + 1);
        setActiveChatId(newChat.id);
        setPipelineState("idle");
        setActiveErrorMessage(null);
        setSidebarOpen(false);
      }
    } catch (e) {
      console.error('Failed to create new chat on server:', e);
    }
  };

  const handleStartEditingTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingChatTitle(currentTitle);
  };

  const handleSaveChatTitle = async (chatId: string) => {
    if (!editingChatTitle.trim()) return;
    const updatedChats = chats.map((c) => (c.id === chatId ? { ...c, title: editingChatTitle } : c));
    setChats(updatedChats);
    setEditingChatId(null);

    if (!user) {
      saveStateToStorage(updatedChats, apiKeys);
      return;
    }

    try {
      await authFetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingChatTitle })
      });
    } catch (e) {
      console.error('Failed to rename chat:', e);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChats = chats.filter((c) => c.id !== chatId);
    setChats(updatedChats);
    if (activeChatId === chatId) {
      setActiveChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }

    if (!user) {
      saveStateToStorage(updatedChats, apiKeys);
      return;
    }

    try {
      await authFetch(`/api/chats/${chatId}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to delete chat:', e);
    }
  };

  // ==================== CORE ORCHESTRATION PIPELINE SIMULATOR ====================

  const handleGuestOrchestrate = async (queryText: string) => {
    let currentChatId = activeChatId;
    let updatedChats = [...chats];

    if (!currentChatId) {
      const newId = `chat_${Date.now()}`;
      const newChatTitle = `Chat ${nextChatCounter}`;
      const newChat: Chat = {
        id: newId,
        title: newChatTitle,
        messages: [],
        modelStats: getCleanStats()
      };
      updatedChats = [newChat];
      currentChatId = newId;
      setNextChatCounter(nextChatCounter + 1);
      setActiveChatId(newId);
    }

    const targetIndex = updatedChats.findIndex((c) => c.id === currentChatId);
    if (targetIndex === -1) return;

    const userMsg: Message = { role: "user", content: queryText };
    const initialStats = getCleanStats();
    
    selectedWorkers.forEach(w => {
      initialStats[w] = {
        ...initialStats[w],
        status: "running"
      };
    });

    updatedChats[targetIndex].messages = [...updatedChats[targetIndex].messages, userMsg];
    updatedChats[targetIndex].modelStats = initialStats;

    // Optimistic title: set smart generated mock title
    const isFirstMessage = updatedChats[targetIndex].messages.length === 1;
    if (isFirstMessage && updatedChats[targetIndex].title.startsWith('Chat ')) {
      updatedChats[targetIndex].title = generateMockTitle(queryText);
    }

    setChats(updatedChats);
    setSearchQuery("");
    setPipelineState("running");

    const streamingBuffers: Record<string, string> = {};
    selectedWorkers.forEach(w => {
      streamingBuffers[w] = "";
    });

    try {
      // Build history strictly scoped to this chat's messages
      const history = updatedChats[targetIndex].messages
        .slice(0, -1) // exclude current turn's user message
        .map(m => ({ role: m.role, content: m.content }));

      // Send keys only for selected workers and selected evaluator
      const filteredKeys: Record<string, string> = {};
      const requiredProviders = [...selectedWorkers];
      if (selectedEvaluator) requiredProviders.push(selectedEvaluator);
      requiredProviders.forEach(provider => {
        if (apiKeys[provider]) {
          filteredKeys[provider] = apiKeys[provider];
        }
      });

      const response = await fetch('/api/guest/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: queryText,
          history,
          selectedWorkers,
          selectedEvaluator,
          modelSelections: selectedModelIds,
          apiKeys: filteredKeys
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        setActiveErrorMessage(formatErrorMessage(errData.error));
        setPipelineState("idle");
        return;
      }

      let tempAssistantMsg: Message = { role: "assistant", content: "" };
      setChats(prevChats => prevChats.map(c => {
        if (c.id === currentChatId) {
          return {
            ...c,
            messages: [...c.messages, tempAssistantMsg]
          };
        }
        return c;
      }));

      await consumeOrchestratorStream(response, {
        onWorkerStart: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const stats = { ...c.modelStats };
              stats[data.provider] = {
                ...stats[data.provider],
                status: "running"
              };
              return { ...c, modelStats: stats };
            }
            return c;
          }));
        },
        onWorkerDelta: (data) => {
          streamingBuffers[data.provider] += data.delta;
          if (!selectedEvaluator) {
            setChats(prevChats => prevChats.map(c => {
              if (c.id === currentChatId) {
                const msgs = [...c.messages];
                if (msgs.length > 0) {
                  msgs[msgs.length - 1] = { role: "assistant", content: streamingBuffers[data.provider] };
                }
                const stats = { ...c.modelStats };
                stats[data.provider] = {
                  ...stats[data.provider],
                  rawResponse: streamingBuffers[data.provider]
                };
                return { ...c, messages: msgs, modelStats: stats };
              }
              return c;
            }));
          } else {
            setChats(prevChats => prevChats.map(c => {
              if (c.id === currentChatId) {
                const stats = { ...c.modelStats };
                stats[data.provider] = {
                  ...stats[data.provider],
                  rawResponse: streamingBuffers[data.provider]
                };
                return { ...c, modelStats: stats };
              }
              return c;
            }));
          }
        },
        onWorkerDone: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const stats = { ...c.modelStats };
              stats[data.provider] = {
                latency: data.latencyMs / 1000,
                ttft: data.ttftMs ? data.ttftMs / 1000 : null,
                inputTokens: data.inputTokens,
                cachedTokens: data.cachedInputTokens || 0,
                outputTokens: data.outputTokens,
                cost: parseFloat(calculateRunCost(data.provider, data.modelId, data.inputTokens, data.outputTokens, {
                  cachedTokens: data.cachedInputTokens,
                }).toFixed(6)),
                status: "success",
                rawResponse: streamingBuffers[data.provider]
              };
              return { ...c, modelStats: stats };
            }
            return c;
          }));
        },
        onWorkerError: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const stats = { ...c.modelStats };
              stats[data.provider] = {
                latency: 0.1,
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
                status: data.errorType as any,
                rawResponse: `API Call Error: [${data.errorType}] ${data.message}`
              };
              return { ...c, modelStats: stats };
            }
            return c;
          }));
        },
        onEvaluatorStart: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const stats = { ...c.modelStats };
              if (selectedEvaluator) {
                stats[selectedEvaluator] = {
                  ...stats[selectedEvaluator],
                  status: "running"
                };
              }
              return { ...c, modelStats: stats };
            }
            return c;
          }));
        },
        onEvaluatorDelta: (data) => {
          tempAssistantMsg.content += data.delta;
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const msgs = [...c.messages];
              if (msgs.length > 0) {
                msgs[msgs.length - 1] = { role: "assistant", content: tempAssistantMsg.content };
              }
              return { ...c, messages: msgs };
            }
            return c;
          }));
        },
        onEvaluatorDone: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const stats = { ...c.modelStats };
              if (selectedEvaluator) {
                stats[selectedEvaluator] = {
                  latency: data.latencyMs / 1000,
                  ttft: data.ttftMs ? data.ttftMs / 1000 : null,
                  inputTokens: data.inputTokens,
                  cachedTokens: data.cachedInputTokens || 0,
                  outputTokens: data.outputTokens,
                  cost: parseFloat(calculateRunCost(selectedEvaluator, data.modelId, data.inputTokens, data.outputTokens, {
                    cachedTokens: data.cachedInputTokens,
                  }).toFixed(6)),
                  status: "success",
                  rawResponse: tempAssistantMsg.content
                };
              }
              return { ...c, modelStats: stats };
            }
            return c;
          }));
        },
        onFinalMessage: (data) => {
          setChats(prevChats => {
            const updated = prevChats.map(c => {
              if (c.id === currentChatId) {
                const msgs = [...c.messages];
                if (msgs.length > 0) {
                  msgs[msgs.length - 1] = { role: "assistant", content: data.content };
                }
                return { ...c, messages: msgs };
              }
              return c;
            });
            // Save state to sessionStorage for guest
            saveStateToStorage(updated, apiKeys, nextChatCounter, apiErrorConfigs);
            return updated;
          });
          setPipelineState("completed");
        },
        onUsageSummary: (data) => {
          setChatUsage({
            inputTokens: data.chat.inputTokens,
            outputTokens: data.chat.outputTokens,
            costUsd: data.chat.costUsd
          });
          setUserUsage({
            inputTokens: data.user.inputTokens,
            outputTokens: data.user.outputTokens,
            costUsd: data.user.costUsd
          });
        },
        onError: (message) => {
          setActiveErrorMessage(message);
          setPipelineState("idle");
        }
      });
    } catch (e: any) {
      setActiveErrorMessage(e.message || "Failed to execute orchestration pipeline.");
      setPipelineState("idle");
    }
  };

  const handleTriggerOrchestrate = async (queryText: string) => {
    if (pipelineState === "running") return;
    if (!queryText.trim()) return;
    setActiveErrorMessage(null);

    // Guest Mode fallback
    if (!user) {
      handleGuestOrchestrate(queryText);
      return;
    }

    let currentChatId = activeChatId;
    let updatedChats = [...chats];

    // Create a new chat if none exists
    if (!currentChatId) {
      try {
        const title = `Chat ${nextChatCounter}`;
        const config = {
          title,
          selectedWorkers,
          selectedEvaluator,
          autoTitleModel: `${autoTitleModel}:${selectedModelIds[autoTitleModel]}`
        };
        const res = await authFetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        if (res.ok) {
          const newChatData = await res.json();
          currentChatId = newChatData.id;
          const newChat: Chat = {
            id: currentChatId as string,
            title: newChatData.title,
            messages: [],
            modelStats: getCleanStats()
          };
          updatedChats = [newChat, ...chats];
          setChats(updatedChats);
          setActiveChatId(currentChatId);
          setNextChatCounter(nextChatCounter + 1);
        } else {
          setActiveErrorMessage("Failed to create conversation on database.");
          return;
        }
      } catch (e) {
        setActiveErrorMessage("Failed to create conversation on database.");
        return;
      }
    }

    setSearchQuery("");
    setPipelineState("running");

    const targetIndex = updatedChats.findIndex(c => c.id === currentChatId);
    if (targetIndex === -1) return;

    const userMsg: Message = { role: "user", content: queryText };
    const initialStats = getCleanStats();
    
    // Set selected workers to running status
    selectedWorkers.forEach(w => {
      initialStats[w] = {
        ...initialStats[w],
        status: "running"
      };
    });

    updatedChats[targetIndex].messages = [...updatedChats[targetIndex].messages, userMsg];
    updatedChats[targetIndex].modelStats = initialStats;

    // Optimistic title update: set chat title to smart mock title immediately
    const isFirstMessage = updatedChats[targetIndex].messages.length === 1;
    if (isFirstMessage && updatedChats[targetIndex].title.startsWith('Chat ')) {
      updatedChats[targetIndex].title = generateMockTitle(queryText);
    }

    setChats(updatedChats);

    const streamingBuffers: Record<string, string> = {};
    selectedWorkers.forEach(w => {
      streamingBuffers[w] = "";
    });

    try {
      const response = await authFetch(`/api/chats/${currentChatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: queryText,
          selectedWorkers,
          selectedEvaluator,
          modelSelections: selectedModelIds
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        setActiveErrorMessage(formatErrorMessage(errData.error));
        setPipelineState("idle");
        return;
      }

      if (!response.body) {
        setActiveErrorMessage("Empty response body returned by stream server.");
        setPipelineState("idle");
        return;
      }

      // Add temporary empty assistant message to write streamed content into
      const tempAssistantMsg: Message = { role: "assistant", content: "" };
      setChats(prevChats => prevChats.map(c => {
        if (c.id === currentChatId) {
          return {
            ...c,
            messages: [...c.messages, tempAssistantMsg]
          };
        }
        return c;
      }));

      await consumeOrchestratorStream(response, {
        onWorkerStart: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const stats = { ...c.modelStats };
              stats[data.provider] = {
                ...stats[data.provider],
                status: "running"
              };
              return { ...c, modelStats: stats };
            }
            return c;
          }));
        },
        onWorkerDelta: (data) => {
          streamingBuffers[data.provider] += data.delta;
          if (!selectedEvaluator) {
            setChats(prevChats => prevChats.map(c => {
              if (c.id === currentChatId) {
                const msgs = [...c.messages];
                if (msgs.length > 0) {
                  msgs[msgs.length - 1] = { role: "assistant", content: streamingBuffers[data.provider] };
                }
                const stats = { ...c.modelStats };
                stats[data.provider] = {
                  ...stats[data.provider],
                  rawResponse: streamingBuffers[data.provider]
                };
                return { ...c, messages: msgs, modelStats: stats };
              }
              return c;
            }));
          } else {
            setChats(prevChats => prevChats.map(c => {
              if (c.id === currentChatId) {
                const stats = { ...c.modelStats };
                stats[data.provider] = {
                  ...stats[data.provider],
                  rawResponse: streamingBuffers[data.provider]
                };
                return { ...c, modelStats: stats };
              }
              return c;
            }));
          }
        },
        onWorkerDone: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const stats = { ...c.modelStats };
              stats[data.provider] = {
                latency: data.latencyMs / 1000,
                ttft: data.ttftMs ? data.ttftMs / 1000 : null,
                inputTokens: data.inputTokens,
                cachedTokens: data.cachedInputTokens || 0,
                outputTokens: data.outputTokens,
                cost: parseFloat(calculateRunCost(data.provider, data.modelId, data.inputTokens, data.outputTokens, {
                  cachedTokens: data.cachedInputTokens,
                }).toFixed(6)),
                status: "success",
                rawResponse: streamingBuffers[data.provider]
              };
              return { ...c, modelStats: stats };
            }
            return c;
          }));
        },
        onWorkerError: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const stats = { ...c.modelStats };
              stats[data.provider] = {
                latency: 0.1,
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
                status: data.errorType as any,
                rawResponse: `API Call Error: [${data.errorType}] ${data.message}`
              };
              return { ...c, modelStats: stats };
            }
            return c;
          }));
        },
        onEvaluatorStart: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const stats = { ...c.modelStats };
              if (selectedEvaluator) {
                stats[selectedEvaluator] = {
                  ...stats[selectedEvaluator],
                  status: "running"
                };
              }
              return { ...c, modelStats: stats };
            }
            return c;
          }));
        },
        onEvaluatorDelta: (data) => {
          tempAssistantMsg.content += data.delta;
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const msgs = [...c.messages];
              if (msgs.length > 0) {
                msgs[msgs.length - 1] = { role: "assistant", content: tempAssistantMsg.content };
              }
              return { ...c, messages: msgs };
            }
            return c;
          }));
        },
        onEvaluatorDone: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const stats = { ...c.modelStats };
              if (selectedEvaluator) {
                stats[selectedEvaluator] = {
                  latency: data.latencyMs / 1000,
                  ttft: data.ttftMs ? data.ttftMs / 1000 : null,
                  inputTokens: data.inputTokens,
                  cachedTokens: data.cachedInputTokens || 0,
                  outputTokens: data.outputTokens,
                  cost: parseFloat(calculateRunCost(selectedEvaluator, data.modelId, data.inputTokens, data.outputTokens, {
                    cachedTokens: data.cachedInputTokens,
                  }).toFixed(6)),
                  status: "success",
                  rawResponse: tempAssistantMsg.content
                };
              }
              return { ...c, modelStats: stats };
            }
            return c;
          }));
        },
        onFinalMessage: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === currentChatId) {
              const msgs = [...c.messages];
              if (msgs.length > 0) {
                msgs[msgs.length - 1] = { role: "assistant", content: data.content };
              }
              return { ...c, messages: msgs };
            }
            return c;
          }));
          setPipelineState("completed");
        },
        onUsageSummary: (data) => {
          setChatUsage({
            inputTokens: data.chat.inputTokens,
            outputTokens: data.chat.outputTokens,
            costUsd: data.chat.costUsd
          });
          setUserUsage({
            inputTokens: data.user.inputTokens,
            outputTokens: data.user.outputTokens,
            costUsd: data.user.costUsd
          });
        },
        onTitleUpdated: (data) => {
          setChats(prevChats => prevChats.map(c => {
            if (c.id === data.chatId) {
              return { ...c, title: data.title };
            }
            return c;
          }));
        },
        onError: (message) => {
          setActiveErrorMessage(message);
          setPipelineState("idle");
        }
      });
    } catch (e: any) {
      console.error("SSE stream reading failed:", e);
      setActiveErrorMessage(e.message || "Failed to read data stream from backend.");
      setPipelineState("idle");
    }
  };

  // Client side calculators for guest users
  const calculateGuestChatUsage = (chat: Chat | null) => {
    if (!chat) return { inputTokens: 0, outputTokens: 0, costUsd: "0.00000" };
    let input = 0;
    let output = 0;
    let cost = 0;
    Object.values(chat.modelStats).forEach(s => {
      input += s.inputTokens || 0;
      output += s.outputTokens || 0;
      cost += s.cost || 0;
    });
    return {
      inputTokens: input,
      outputTokens: output,
      costUsd: cost.toFixed(5)
    };
  };

  const calculateGuestSessionUsage = () => {
    let input = 0;
    let output = 0;
    let cost = 0;
    chats.forEach(chat => {
      Object.values(chat.modelStats).forEach(s => {
        input += s.inputTokens || 0;
        output += s.outputTokens || 0;
        cost += s.cost || 0;
      });
    });
    return {
      inputTokens: input,
      outputTokens: output,
      costUsd: cost.toFixed(5)
    };
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Filtered right card list (Only showing selected workers & evaluator)
  const activeRightSideCardIds = Array.from(new Set([...selectedWorkers, ...(selectedEvaluator ? [selectedEvaluator] : [])]));

  // Eligible models for Auto-Title must be currently active (workers + evaluator)
  const eligibleAutoTitleModelIds = activeRightSideCardIds;

  // Auto-title settings config text
  const currentAutoTitleModelName = MODEL_TEMPLATES[autoTitleModel]?.name || "Mistral Large";

  // Ensure `autoTitleModel` remains valid when selected workers/evaluator change
  useEffect(() => {
    const eligible = Array.from(
      new Set([...selectedWorkers, ...(selectedEvaluator ? [selectedEvaluator] : [])])
    );
    if (!eligible.includes(autoTitleModel) && eligible.length > 0) {
      setAutoTitleModel(eligible[0]);
    }
  }, [selectedWorkers, selectedEvaluator]);

  return (
    <div className="flex h-screen w-full bg-bg-base text-text-secondary overflow-hidden font-sans antialiased">
      
      {/* ==================== LEFT SIDEBAR ==================== */}
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border-subtle bg-bg-surface transition-transform duration-300 transform w-72 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0 lg:w-72 shrink-0 overflow-hidden`}
      >
        {/* Brand & Auth Area */}
        <div className="flex flex-col border-b border-border-subtle bg-bg-surface p-4 gap-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-tr from-accent-primary to-accent-secondary text-black font-black shadow-md shadow-accent-primary/20">
                Ω
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-text-primary leading-none">Arbiter</span>
                <span className="text-[10px] text-text-tertiary font-mono mt-0.5">Orchestrator v1.2</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/docs"
                className="text-[10px] font-bold text-accent-primary hover:text-accent-primary-hover border border-accent-primary/20 hover:border-accent-primary/50 px-2 py-1 rounded bg-accent-primary/5 transition duration-150"
              >
                Docs
              </Link>

              {/* Mobile Close Button */}
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-text-tertiary hover:text-text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* User Sign-In Block */}
          <div className="pt-1.5">
            {authLoading ? (
              <div className="flex items-center justify-center p-3 rounded-lg border border-border-subtle bg-bg-surface-raised animate-pulse h-12">
                <span className="text-[10px] text-text-tertiary">Loading session...</span>
              </div>
            ) : user ? (
              <div className="flex items-center justify-between bg-bg-surface-raised border border-border-subtle p-3 rounded-lg">
                <div className="flex items-center gap-2 overflow-hidden">
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name || "User"} 
                      className="h-7 w-7 rounded-full object-cover shrink-0 border border-border-subtle" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center text-xs font-bold text-accent-primary shrink-0">
                      {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-text-primary truncate">{user.name || 'User'}</p>
                    <p className="text-[9px] text-text-tertiary font-mono truncate max-w-[120px]">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="text-[10px] text-text-tertiary hover:text-status-error font-semibold px-2 py-1 rounded-md hover:bg-status-error-bg transition shrink-0"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button 
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-bg-surface-raised hover:bg-bg-surface-raised border border-border-subtle hover:border-border-strong py-2 px-3 text-xs font-bold text-text-secondary hover:text-text-primary transition duration-200"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
                <div className="flex justify-between items-center px-1 text-[9px] text-text-tertiary font-mono">
                  <span>Session: Guest Mode</span>
                  <span className="text-status-warning font-bold">Wipes on close</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Thread Action Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent-primary hover:bg-accent-primary-hover hover:shadow-accent-primary/10 py-2 px-4 text-xs font-bold text-black transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            <span>New Conversation</span>
          </button>
        </div>

        {/* Chat List Scroll Container */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scrollbar-thin">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Conversations</span>
            <span className="text-[10px] text-text-tertiary font-mono">({chats.length})</span>
          </div>

          {chats.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-text-tertiary italic">
              No threads active.<br />Click New Conversation above.
            </div>
          ) : (
            chats.map((c) => {
              const isActive = c.id === activeChatId;
              const isEditing = editingChatId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (!isEditing) {
                      setActiveChatId(c.id);
                      setPipelineState("completed");
                      setActiveErrorMessage(null);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`group relative flex items-center justify-between w-full px-5 py-4 rounded-md text-left border cursor-pointer transition ${
                    isActive
                      ? "bg-bg-surface-raised border-border-strong text-text-primary font-semibold shadow-inner shadow-black/40"
                      : "border-transparent hover:bg-bg-surface-raised/40 text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate flex-1 mr-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5 text-text-tertiary shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.598.598 0 0 1-.655-.077.598.598 0 0 1-.165-.63l.81-2.8a7.197 7.197 0 0 1-1.4-3.713C4 16.556 8.03 12.875 13 12.875c4.97 0 9 3.681 9 8.25Z" />
                    </svg>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editingChatTitle}
                        onChange={(e) => setEditingChatTitle(e.target.value)}
                        onBlur={() => handleSaveChatTitle(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveChatTitle(c.id);
                          if (e.key === "Escape") setEditingChatId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-bg-base text-xs px-2 py-1 border border-accent-primary rounded-md text-text-primary focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs truncate">{c.title}</span>
                    )}
                  </div>

                  {/* Actions Visible on Hover */}
                  {!isEditing && (
                    <div className="absolute right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Rename/Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditingTitle(c.id, c.title);
                        }}
                        title="Rename Thread"
                        className="text-text-tertiary hover:text-text-primary p-0.5 rounded-md hover:bg-bg-surface-raised"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteChat(c.id, e)}
                        title="Delete Thread"
                        className="text-text-tertiary hover:text-status-error p-0.5 rounded-md hover:bg-bg-surface-raised"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* BYOK Settings Trigger */}
        <div className="p-3 border-t border-border-subtle bg-bg-surface">
          <button 
            onClick={() => setKeysModalOpen(true)}
            className="flex w-full items-center justify-between rounded-md bg-bg-surface border border-border-subtle p-3 hover:border-border-strong hover:bg-bg-surface-raised transition duration-200"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-accent-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.992a7.723 7.723 0 0 1 0-.255c-.008-.378-.137-.75-.43-.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.936 6.936 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <div className="text-left">
                <p className="text-xs font-semibold text-text-primary">Settings & Keys</p>
                <p className="text-[9px] text-text-tertiary font-mono">Workers, Eval, Failures</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 text-text-tertiary">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ==================== CENTER MAIN CONTAINER ==================== */}
      <main className="flex flex-col flex-1 bg-bg-base relative overflow-hidden">
        
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-border-subtle bg-bg-base/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle for mobile */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-bg-surface-raised transition lg:hidden"
              title="Toggle chat sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5.5 h-5.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-text-primary">
                {activeChat ? activeChat.title : "No Thread Active"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Usage Metrics Badge */}
            <div className="hidden sm:flex items-center gap-3 sm:gap-4 bg-bg-surface-raised/80 border border-border-subtle px-3 py-1 rounded-md text-[10px] font-mono text-text-secondary select-none">
              <div className="flex flex-col text-left">
                <span className="text-[7.5px] text-text-tertiary uppercase font-bold tracking-wider">This Chat</span>
                <span className="font-bold text-status-success mt-0.5">
                  ${user ? parseFloat(chatUsage.costUsd).toFixed(5) : calculateGuestChatUsage(activeChat).costUsd} ({user ? chatUsage.inputTokens + chatUsage.outputTokens : calculateGuestChatUsage(activeChat).inputTokens + calculateGuestChatUsage(activeChat).outputTokens} t)
                </span>
              </div>
              <div className="h-5 w-px bg-border-subtle" />
              <div className="flex flex-col text-left">
                <span className="text-[7.5px] text-text-tertiary uppercase font-bold tracking-wider">{user ? "All-Time" : "This Session"}</span>
                <span className="font-bold text-accent-primary mt-0.5">
                  ${user ? parseFloat(userUsage.costUsd).toFixed(5) : calculateGuestSessionUsage().costUsd} ({user ? userUsage.inputTokens + userUsage.outputTokens : calculateGuestSessionUsage().inputTokens + calculateGuestSessionUsage().outputTokens} t)
                </span>
              </div>
            </div>

            {/* API Settings Button */}
            <button
              onClick={() => setKeysModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-subtle bg-bg-surface-raised hover:bg-bg-surface-raised hover:border-border-strong text-xs text-text-secondary hover:text-text-primary transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 text-accent-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a3 3 0 0 1-3 3m-12-6a3 3 0 0 1-3 3m12-3a3 3 0 0 1-3 3m-12 12a3 3 0 0 1-3-3m12 3a3 3 0 0 1-3-3" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Metrics Toggle */}
            <button 
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="text-text-secondary hover:text-text-primary p-2 rounded-md hover:bg-bg-surface-raised transition flex items-center gap-2 border border-border-subtle bg-bg-surface-raised animate-pulse"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
              </svg>
              <span className="text-xs font-semibold hidden md:inline">Inspect Metrics</span>
            </button>
          </div>
        </header>

        {/* Global Key Validation Error Banner */}
        {activeErrorMessage && (
          <div className="bg-status-error-bg border-b border-status-error/30 px-6 py-3 text-xs text-status-error font-semibold flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4.5 h-4.5 text-status-error">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{activeErrorMessage}</span>
            <button
              onClick={() => setActiveErrorMessage(null)}
              className="ml-auto p-1 text-status-error hover:bg-status-error-bg/60 rounded-md transition duration-150"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Guest Session Import Banner */}
        {showImportBanner && (
          <div className="bg-accent-primary/10 border-b border-accent-primary/30 px-6 py-3 text-xs text-text-primary flex items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Import your guest session?</span>
              <span className="text-text-tertiary">We found active guest conversations in this browser.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleImportGuestChats}
                className="px-3 py-1 bg-accent-primary text-black font-bold rounded hover:bg-accent-primary/95 transition text-[11px] leading-tight"
              >
                Import Account Chats
              </button>
              <button
                onClick={() => {
                  setShowImportBanner(false);
                  sessionStorage.removeItem("orchestrator_chats");
                }}
                className="px-3 py-1 border border-border-subtle hover:bg-bg-surface-raised transition text-[11px] rounded leading-tight"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* ==================== CENTER MESSAGES CONTAINER ==================== */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin select-text">
          
          {!activeChat || activeChat.messages.length === 0 ? (
            /* ==================== EMPTY STATE / COLD SCREEN ==================== */
            <div className="max-w-xl mx-auto text-center py-20 space-y-8 select-none">
              
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-text-primary tracking-tight">Arbiter Multi-Agent Platform</h2>
                <p className="text-xs text-text-tertiary max-w-sm mx-auto leading-relaxed">
                  Submit queries to multiple language models concurrently. View performance, evaluate options, and persist logs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <button 
                  onClick={() => handleTriggerOrchestrate("Compare the time complexity of QuickSort vs MergeSort with code examples.")}
                  className="p-4 rounded-lg border border-border-subtle bg-bg-surface hover:border-border-strong hover:bg-bg-surface-raised transition text-xs space-y-1"
                >
                  <p className="font-bold text-text-primary">Compare Sorting Algorithms</p>
                  <p className="text-[10px] text-text-tertiary mt-1">Queries Mistral, OpenAI and Claude, then runs synthesis reports.</p>
                </button>

                <button 
                  onClick={() => handleTriggerOrchestrate("Write a Next.js API route that encrypts BYOK credentials with AES-256.")}
                  className="p-4 rounded-lg border border-border-subtle bg-bg-surface hover:border-border-strong hover:bg-bg-surface-raised transition text-xs space-y-1"
                >
                  <p className="font-bold text-text-primary">Next.js API Cryptography</p>
                  <p className="text-[10px] text-text-tertiary mt-1">Evaluates cryptographical options across providers concurrently.</p>
                </button>
              </div>

            </div>
          ) : (
            /* ==================== ACTIVE CHAT MESSAGES ==================== */
            <div className="max-w-3xl mx-auto space-y-6">
              
              {activeChat.messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div 
                    key={index}
                    className={`flex gap-4 p-5 rounded-lg border transition-all ${
                      isUser 
                        ? "bg-bg-surface border-border-subtle justify-start"
                        : "bg-bg-surface-raised border-border-subtle leading-relaxed text-sm"
                    }`}
                  >
                    {/* Role Avatar */}
                    <div className={`h-8 w-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                      isUser 
                        ? "bg-bg-surface-raised text-text-secondary border border-border-subtle" 
                        : "bg-accent-primary/20 text-accent-primary border border-accent-primary/30"
                    }`}>
                      {isUser ? "U" : "Ω"}
                    </div>

                    <div className="flex-1 overflow-hidden text-left space-y-2">
                      <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                        {isUser ? "User Query" : "Arbiter Consolidated Response"}
                      </p>
                      {isUser ? (
                        <div className="text-xs sm:text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </div>
                      ) : (
                        <div 
                          className="text-xs sm:text-sm text-text-primary leading-relaxed prose-markdown"
                          dangerouslySetInnerHTML={{ 
                            __html: marked.parse(msg.content) as string
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Running Loader state inside message container */}
              {pipelineState === "running" && (
                <div className="flex gap-4 p-5 rounded-lg border border-border-subtle bg-bg-surface-raised/20 animate-pulse text-left">
                  <div className="h-8 w-8 rounded-md bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                    <svg className="animate-spin h-4 w-4 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Orchestrator running...</p>
                    <p className="text-xs text-text-secondary font-medium">
                      {selectedEvaluator ? (
                        `Querying workers (${selectedWorkers.map(id => MODEL_TEMPLATES[id]?.name || id).join(", ")}) concurrently. Synthesizing answers via ${MODEL_TEMPLATES[selectedEvaluator]?.name || selectedEvaluator}...`
                      ) : (
                        `Querying active worker (${selectedWorkers.map(id => MODEL_TEMPLATES[id]?.name || id).join(", ")}) directly...`
                      )}
                    </p>
                    <div className="h-1.5 w-48 bg-bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-accent-primary rounded-full animate-infinite-progress" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Anchor for Auto-scroll */}
              <div ref={messagesEndRef} />

            </div>
          )}

        </div>

        {/* ==================== BOTTOM INPUT AREA ==================== */}
        <footer className="p-4 border-t border-border-subtle bg-bg-base">
          <div className="max-w-3xl mx-auto relative">
            
            {/* Input Bar */}
            <div ref={inputWrapperRef} className="relative flex items-center rounded-lg border border-border-subtle bg-bg-surface focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/10 transition-all p-2 gap-3">
              
              <button 
                onClick={() => setKeysModalOpen(true)}
                title="Configure Keys & Workers"
                className="p-2 text-text-tertiary hover:text-accent-primary rounded-md hover:bg-bg-surface-raised transition shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </button>
 
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask Arbiter (e.g. Compare QuickSort vs MergeSort)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleTriggerOrchestrate(searchQuery);
                    requestAnimationFrame(() => {
                      inputRef.current?.focus();
                    });
                  }
                }}
                className="flex-1 bg-transparent text-xs sm:text-sm text-text-primary placeholder-text-tertiary outline-none disabled:text-text-tertiary"
              />
 
              <button
                onClick={() => handleTriggerOrchestrate(searchQuery || "Compare the time complexity of QuickSort vs MergeSort with code examples.")}
                disabled={pipelineState === "running" || !searchQuery.trim()}
                className="h-9 px-4 rounded-md bg-accent-primary hover:bg-accent-primary-hover text-black font-bold text-xs shadow-md shadow-accent-primary/20 active:scale-95 transition-all disabled:opacity-40"
              >
                Orchestrate
              </button>
            </div>
            
            <p className="text-center text-[10px] text-text-tertiary mt-3 font-mono">
              AES-256 encryption active • Drizzle ORM PostgreSQL persistence
            </p>

          </div>
        </footer>

      </main>

      {/* Backdrop for right panel on mobile */}
      {rightPanelOpen && (
        <div 
          onClick={() => setRightPanelOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* ==================== RIGHT INSPECTOR SIDEBAR ==================== */}
      <aside className={`fixed inset-y-0 right-0 z-40 flex flex-col border-l border-border-subtle bg-bg-surface transition-all duration-300 ${
        rightPanelOpen 
          ? "translate-x-0 w-80 lg:w-80 lg:static" 
          : "translate-x-full w-80 lg:w-0 lg:static lg:translate-x-0 lg:border-l-0 overflow-hidden"
      } shrink-0 select-none`}>
          
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border-subtle bg-bg-surface-raised">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Metrics Inspector</span>
              <span className="text-[9px] text-text-tertiary font-mono">Only selected worker/eval models</span>
            </div>
            <button 
              onClick={() => setRightPanelOpen(false)}
              className="p-1 text-text-tertiary hover:text-text-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* List of Models - FILTERED: Showing only the selected workers and evaluator */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            
            {activeRightSideCardIds.map((modelId) => {
              const config = MODEL_TEMPLATES[modelId];
              const stats = activeChat ? activeChat.modelStats[modelId] : null;

              const isWorker = selectedWorkers.includes(modelId);
              const isEvaluator = selectedEvaluator === modelId;
              const isSelected = selectedInspectorModel === modelId;

              const currentStatus = stats ? stats.status : "idle";

              return (
                <div 
                  key={modelId}
                  onClick={() => setSelectedInspectorModel(modelId)}
                  className={`p-4 rounded-lg border text-left transition duration-200 cursor-pointer ${
                    isSelected 
                      ? "bg-bg-surface-raised border-accent-primary shadow-md ring-1 ring-accent-primary/10" 
                      : "border-border-subtle bg-bg-surface-raised/40 hover:bg-bg-surface-raised/60"
                  }`}
                >
                  {/* Title Row with Workers & Evaluators Badges */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${config.avatarColor}`} />
                      <span className="text-xs font-bold text-text-primary">{config.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isWorker && (
                        <span className="text-[8px] font-mono font-bold bg-status-success-bg text-status-success px-1.5 py-0.5 rounded-sm">
                          Worker ✓
                        </span>
                      )}
                      {isEvaluator && (
                        <span className="text-[8px] font-mono font-bold bg-accent-secondary-bg text-accent-secondary px-1.5 py-0.5 rounded-sm">
                          Eval ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="mb-2">
                    {currentStatus === "running" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-status-info-bg text-status-info font-bold uppercase font-mono animate-pulse">
                        Running
                      </span>
                    )}
                    {currentStatus === "success" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-status-success-bg text-status-success font-bold uppercase font-mono">
                        Success
                      </span>
                    )}
                    {currentStatus === "key_error" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-status-error-bg text-status-error font-bold uppercase font-mono">
                        Key Error (401)
                      </span>
                    )}
                    {currentStatus === "rate_limit" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-status-warning-bg text-status-warning font-bold uppercase font-mono">
                        Rate Limit (429)
                      </span>
                    )}
                    {currentStatus === "timeout" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-status-info-bg text-status-info font-bold uppercase font-mono">
                        Timeout
                      </span>
                    )}
                    {currentStatus === "error" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-status-error-bg text-status-error font-bold uppercase font-mono">
                        Failed (500)
                      </span>
                    )}
                    {currentStatus === "idle" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-status-idle-bg text-text-tertiary font-bold uppercase font-mono">
                        Idle
                      </span>
                    )}
                  </div>

                  {/* Token usage per chat & cost subgrid */}
                  <div className="grid grid-cols-3 gap-1 py-1.5 border-t border-b border-border-subtle my-2 text-[10px] font-mono text-text-secondary">
                    <div>
                      <p className="text-[8px] text-text-tertiary font-sans uppercase">Latency / TTFT</p>
                      <p className="font-bold text-text-primary">
                        {stats && stats.latency > 0 ? `${stats.latency}s` : "0.00s"}
                        {stats && stats.ttft ? ` / ${stats.ttft.toFixed(2)}s` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-text-tertiary font-sans uppercase">Tokens (In/Out)</p>
                      <p className="font-bold text-text-primary leading-tight">
                        {stats && stats.inputTokens > 0 
                          ? `${stats.inputTokens + stats.outputTokens}` 
                          : "0"}
                      </p>
                      {stats && stats.inputTokens > 0 && (
                        <p className="text-[8px] text-text-tertiary">
                          ({stats.inputTokens}/{stats.outputTokens})
                          {stats.cachedTokens ? ` [${stats.cachedTokens} cached]` : ""}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[8px] text-text-tertiary font-sans uppercase">Cost Est.</p>
                      <p className="font-bold text-text-primary">
                        {stats && stats.cost > 0 ? `$${stats.cost.toFixed(5)}` : "$0.00000"}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Info helper tooltip */}
                  <div className="flex justify-between items-center text-[9px] text-text-tertiary font-mono">
                    <span>Input: ${config.inputCostPer1K}/1k</span>
                    <span>Output: ${config.outputCostPer1K}/1k</span>
                  </div>

                  {/* Specialty */}
                  <p className="text-[10px] text-text-tertiary mt-2">
                    <span className="text-text-secondary font-semibold">Specialty:</span> {config.strength}
                  </p>

                </div>
              );
            })}

          </div>

          {/* Model Raw Inspector Tab Viewer */}
          <div className="h-56 border-t border-border-subtle flex flex-col bg-bg-surface">
            
            <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-bg-surface-raised text-[9px] font-bold text-text-secondary uppercase tracking-wider">
              <span>Raw Response Preview</span>
              <span className="font-mono text-accent-primary">
                {MODEL_TEMPLATES[selectedInspectorModel]?.name || "Select Model"}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] text-text-secondary leading-normal scrollbar-thin bg-bg-base/40 select-all">
              {activeChat && activeChat.modelStats[selectedInspectorModel]?.rawResponse ? (
                <pre className="whitespace-pre-wrap text-left">{activeChat.modelStats[selectedInspectorModel].rawResponse}</pre>
              ) : (
                <span className="italic text-text-tertiary block text-center py-4">No data. Run search query to inspect raw model payloads.</span>
              )}
            </div>

          </div>

        </aside>

      {/* ==================== BYOK CREDENTIALS & SETTINGS MODAL ==================== */}
      {keysModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-lg rounded-lg border border-border-subtle bg-bg-surface-raised p-5 sm:p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-accent-primary/10 text-accent-primary">
                  ⚙️
                </div>
                <h3 className="text-base font-bold text-text-primary">Arbiter Configurations</h3>
              </div>
              <button 
                onClick={() => setKeysModalOpen(false)}
                className="text-text-tertiary hover:text-text-primary transition p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* BYOK KEY CONFIG SECTION WITH SIMPLIFIED PREFIX VALIDATION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">1. API Credentials (BYOK)</h4>
                <span className="text-[9px] text-text-tertiary font-mono">Format Verification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {Object.keys(MODEL_TEMPLATES).map((id) => {
                  const m = MODEL_TEMPLATES[id];
                  const state = keyValidationStates[id];
                  return (
                    <div key={id} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-semibold text-text-secondary">{m.name} Key</label>
                        {user && credentialsMeta[id]?.hasKey ? (
                          <span className="text-[9px] font-mono text-status-success font-bold">✓ Configured (Ends in {credentialsMeta[id].last4})</span>
                        ) : state === "valid" ? (
                          <span className="text-[9px] font-mono text-status-success font-bold">✓ Valid Prefix</span>
                        ) : state === "invalid" ? (
                          <span className="text-[9px] font-mono text-status-error font-bold">✗ Invalid Prefix</span>
                        ) : (
                          <span className="text-[9px] font-mono text-text-tertiary">Empty</span>
                        )}
                      </div>
                      <div className={`flex items-center rounded-md border p-2 bg-bg-base/60 ${
                        state === "valid" ? "border-status-success/30" : state === "invalid" ? "border-status-error/30" : "border-border-subtle"
                      }`}>
                        <input
                          type="password"
                          value={apiKeys[id]}
                          placeholder={m.placeholderKey}
                          onChange={(e) => handleKeyChange(id, e.target.value)}
                          onBlur={(e) => handleKeyBlur(id, e.target.value)}
                          className="w-full bg-transparent text-xs font-mono text-text-primary outline-none"
                        />
                        {apiKeys[id] && (
                          <button
                            onClick={() => handleKeyRevoke(id)}
                            title="Clear Key"
                            className="text-text-tertiary hover:text-status-error ml-2 text-[10px] font-semibold transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {user && (
                <p className="text-[9px] text-text-tertiary text-left">
                  * Credentials stay securely encrypted with AES-256-GCM on the database server.
                </p>
              )}
              {!user && (
                <p className="text-[9px] text-text-tertiary text-left">
                  * Guest keys stay in this browser only; sign in to save encrypted keys to your account.
                </p>
              )}
            </div>

            {/* MODEL CUSTOMIZATION CONFIG SECTION */}
            <div className="space-y-4 pt-4 border-t border-border-subtle text-left">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">2. Model Selection per LLM Type</h4>
                <span className="text-[9px] text-text-tertiary font-mono">Choose active version for each provider</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-bg-base/35 border border-border-subtle p-3 rounded-lg">
                {Object.keys(providerModels).map((providerId) => {
                  const providerMeta = PROVIDER_META[providerId];
                  const models = providerModels[providerId];
                  return (
                    <div key={providerId} className="space-y-1.5 text-xs">
                      <label className="font-semibold text-text-secondary flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${providerMeta.avatarColor}`} />
                        {providerMeta.provider} Model
                      </label>
                      <select
                        value={selectedModelIds[providerId]}
                        onChange={(e) => {
                          const updated = { ...selectedModelIds, [providerId]: e.target.value };
                          setSelectedModelIds(updated);
                          const storage = user ? localStorage : sessionStorage;
                          storage.setItem("orchestrator_selected_models", JSON.stringify(updated));
                        }}
                        className="w-full bg-bg-surface-raised border border-border-subtle rounded-md px-2.5 py-1.5 text-[11px] text-text-primary outline-none focus:border-accent-primary transition-all font-mono"
                      >
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} (${(m.inputCostPer1K * 1000).toFixed(4)}/M, ${(m.outputCostPer1K * 1000).toFixed(4)}/M)
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* API SIMULATOR ERROR CONFIGURATION SECTION (GUEST ONLY VIEW) */}
            {!user && (
              <div className="space-y-4 pt-4 border-t border-border-subtle text-left">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">3. API Call Error Simulator</h4>
                  <span className="text-[9px] text-text-tertiary font-mono">Configure runtime response states</span>
                </div>

                <div className="space-y-2.5 bg-bg-base/35 border border-border-subtle p-3 rounded-lg">
                  {Object.keys(MODEL_TEMPLATES).map((id) => {
                    const m = MODEL_TEMPLATES[id];
                    return (
                      <div key={id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-text-secondary">{m.name} API Call State:</span>
                        <select
                          value={apiErrorConfigs[id]}
                          onChange={(e) => {
                            const updated = { ...apiErrorConfigs, [id]: e.target.value as any };
                            setApiErrorConfigs(updated);
                            saveStateToStorage(chats, apiKeys, nextChatCounter, updated);
                          }}
                          className="bg-bg-surface-raised border border-border-subtle rounded-md px-2.5 py-1 text-[11px] text-text-primary outline-none"
                        >
                          <option value="success">Success (Healthy Call)</option>
                          <option value="key_error">Authentication Key Error (401)</option>
                          <option value="rate_limit">Rate Limit Exceeded (429)</option>
                          <option value="timeout">Gateway Network Timeout</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WORKERS CONFIG SECTION */}
            <div className="space-y-4 pt-4 border-t border-border-subtle text-left">
              
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider">4. Worker Pipeline Routing</h4>
                <span className="text-xs text-text-secondary font-semibold">
                  Max workers: {maxWorkers} {selectedEvaluator ? '(evaluator active)' : '(no evaluator — click to swap worker)'}
                </span>
              </div>

              {/* Workers Grid Selection */}
              <div className="space-y-1">
                <p className="text-[10px] text-text-tertiary font-mono mb-2">Select active workers (marked with green tick):</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.keys(MODEL_TEMPLATES).map((id) => {
                    const config = MODEL_TEMPLATES[id];
                    const isSelected = selectedWorkers.includes(id);
                    // Only block deselecting the last active worker — unselected workers are always clickable
                    const isOnlyWorkerSelected = isSelected && selectedWorkers.length <= 1;
                    return (
                      <button
                        key={id}
                        onClick={() => handleToggleWorker(id)}
                        disabled={isOnlyWorkerSelected}
                        title={isOnlyWorkerSelected ? 'At least one worker must be active' : !selectedEvaluator && !isSelected ? 'Click to switch to this worker' : undefined}
                        className={`flex flex-col items-center justify-between p-3 rounded-lg border text-center transition-all ${
                          isSelected 
                            ? "bg-status-success-bg/20 border-status-success text-status-success font-bold" 
                            : "border-border-subtle bg-bg-surface-raised/40 hover:bg-bg-surface-raised text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${config.avatarColor} mb-2`} />
                        <span className="text-[10px] truncate max-w-[80px]">{config.name}</span>
                        {isSelected && <span className="text-[9px] font-bold mt-1 text-status-success">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Evaluator Pick Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-secondary">Synthesis Evaluator Routing</label>
                <select
                  value={selectedEvaluator || "skip"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedEvaluator(val === "skip" ? null : val);
                  }}
                  className="w-full bg-bg-surface-raised border border-border-subtle rounded-md px-2.5 py-1.5 text-[11px] text-text-primary outline-none focus:border-accent-primary transition-all font-mono"
                >
                  <option value="skip">None (Skip Evaluator, Stream chosen Worker directly)</option>
                  {Object.keys(MODEL_TEMPLATES).map((id) => {
                    const config = MODEL_TEMPLATES[id];
                    return (
                      <option key={id} value={id}>
                        Use {config.name} as Evaluator
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Auto Title selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-secondary">Auto-Rename Thread Model</label>
                <select
                  value={autoTitleModel}
                  onChange={(e) => setAutoTitleModel(e.target.value)}
                  className="w-full bg-bg-surface-raised border border-border-subtle rounded-md px-2.5 py-1.5 text-[11px] text-text-primary outline-none focus:border-accent-primary transition-all font-mono"
                >
                  {eligibleAutoTitleModelIds.map((id) => {
                    const config = MODEL_TEMPLATES[id];
                    return (
                      <option key={id} value={id}>
                        {config.name} ({config.provider})
                      </option>
                    );
                  })}
                </select>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-border-subtle flex justify-end">
              <button 
                onClick={() => setKeysModalOpen(false)}
                className="px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-black font-bold text-xs rounded-md shadow-md shadow-accent-primary/20 active:scale-95 transition-all"
              >
                Close & Apply Configuration
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
