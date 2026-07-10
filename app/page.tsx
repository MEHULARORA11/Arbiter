"use client";

import React, { useState, useEffect, useRef } from "react";

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
  regex: RegExp;
  placeholderKey: string;
  rawResponseTemplate: string;
}

const MODEL_TEMPLATES: Record<string, ModelConfig> = {
  openai: {
    id: "openai",
    name: "GPT-4o",
    provider: "OpenAI",
    avatarColor: "bg-emerald-500",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
    textColor: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    inputCostPer1K: 0.0025, // $2.50 per 1M tokens
    outputCostPer1K: 0.0100, // $10.00 per 1M tokens
    strength: "Precise coding & highly optimized execution syntax.",
    regex: /^sk-[a-zA-Z0-9-]{20,100}$/,
    placeholderKey: "sk-proj-...",
    rawResponseTemplate: `### OpenAI GPT-4o Response
Here is the requested sorting analysis:
* **QuickSort**: Average $O(n \\log n)$, Worst $O(n^2)$. In-place partitioning. Very fast on primitives due to cache locality.
* **MergeSort**: Always $O(n \\log n)$. Stable, preserves index sequences, but uses $O(n)$ extra memory.
\`\`\`python
def quicksort(arr):
    if len(arr) <= 1: return arr
    pivot = arr[len(arr)//2]
    return quicksort([x for x in arr if x < pivot]) + [x for x in arr if x == pivot] + quicksort([x for x in arr if x > pivot])
\`\`\``
  },
  claude: {
    id: "claude",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    avatarColor: "bg-orange-500",
    borderColor: "border-orange-500/30 hover:border-orange-500/60",
    textColor: "text-orange-400",
    accentBg: "bg-orange-500/10",
    inputCostPer1K: 0.0030, // $3.00 per 1M tokens
    outputCostPer1K: 0.0150, // $15.00 per 1M tokens
    strength: "Architectural reasoning, edge case handling, and complexity bounds.",
    regex: /^sk-ant-[a-zA-Z0-9-]{30,120}$/,
    placeholderKey: "sk-ant-...",
    rawResponseTemplate: `### Claude 3.5 Sonnet Response
Evaluating sorting architectures:
* **Memory Limits**: MergeSort auxiliary array space can cause OOM on heap limits. QuickSort uses stack memory $O(\\log n)$.
* **Stability Requirement**: If sorting complex data elements (e.g. database records with composite keys), MergeSort's stable merge preserves historical orders.
\`\`\`python
def mergesort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left, right = mergesort(arr[:mid]), mergesort(arr[mid:])
    return merge(left, right)
\`\`\``
  },
  gemini: {
    id: "gemini",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    avatarColor: "bg-blue-500",
    borderColor: "border-blue-500/30 hover:border-blue-500/60",
    textColor: "text-blue-400",
    accentBg: "bg-blue-500/10",
    inputCostPer1K: 0.00125, // $1.25 per 1M tokens
    outputCostPer1K: 0.00375, // $3.75 per 1M tokens
    strength: "Explanatory analogies, context windows, and structured flows.",
    regex: /^AIzaSy[a-zA-Z0-9_-]{30,45}$/,
    placeholderKey: "AIzaSy...",
    rawResponseTemplate: `### Gemini 1.5 Pro Response
Think of sorting like sorting a library book shelf:
* **MergeSort**: You break the shelf into 2 halves, ask 2 assistants to sort them separately, and merge. Safe, but you need table space equal to the shelf size ($O(n)$ space).
* **QuickSort**: You pick a random book (pivot), place all thinner books to the left and thicker to the right. Fast, but if you pick the thinnest book every time, you sort one-by-one ($O(n^2)$ worst case).`
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    avatarColor: "bg-sky-500",
    borderColor: "border-sky-500/30 hover:border-sky-500/60",
    textColor: "text-sky-400",
    accentBg: "bg-sky-500/10",
    inputCostPer1K: 0.00014, // $0.14 per 1M tokens
    outputCostPer1K: 0.00028, // $0.28 per 1M tokens
    strength: "Extremely cost-effective mathematical reasoning and clean logic.",
    regex: /^(sk-ds-[a-zA-Z0-9-]{20,100}|sk-[a-zA-Z0-9]{32,48})$/,
    placeholderKey: "sk-ds-...",
    rawResponseTemplate: `### DeepSeek V3 Response
Analyzing recursive optimizations:
* QuickSort is standard in libraries like C++ std::sort (IntroSort fallback) due to pointer cache benefits.
* DeepSeek recommends memoization-like pivots. By choosing median-of-three, we practically avoid the worst-case quadratic complexity:
\`\`\`python
# Median-of-three pivot quicksort helper
def median_of_three(a, b, c):
    return sorted([a, b, c])[1]
\`\`\``
  },
  mistral: {
    id: "mistral",
    name: "Mistral Large",
    provider: "Mistral",
    avatarColor: "bg-red-500",
    borderColor: "border-red-500/30 hover:border-red-500/60",
    textColor: "text-red-400",
    accentBg: "bg-red-500/10",
    inputCostPer1K: 0.0020, // $2.00 per 1M tokens
    outputCostPer1K: 0.0060, // $6.00 per 1M tokens
    strength: "Systems design, European localization, and low overhead operations.",
    regex: /^(sk-ms-[a-zA-Z0-9-]{20,100}|[a-zA-Z0-9]{32})$/,
    placeholderKey: "Mistral key...",
    rawResponseTemplate: `### Mistral Large Response
Sorting complexity profile:
* MergeSort is stable, parallelizable on disk blocks.
* QuickSort worst-case stack is $O(n)$ without tail recursion optimization. With tail recursion, it is $O(\\log n)$.
* Mistral Large prioritizes cache friendliness: arrays fit cache lines, so QuickSort swaps are blazing fast.`
  }
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
    inputTokens: number;
    outputTokens: number;
    cost: number;
    status: "idle" | "running" | "done" | "failed";
    rawResponse: string;
  }>;
}

export default function App() {
  // ==================== CORE STATE ====================

  // Auth
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

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

  // BYOK Credentials (Keys)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: "",
    claude: "",
    gemini: "",
    deepseek: "",
    mistral: ""
  });

  // Orchestrator Configuration Defaults
  const [numWorkers, setNumWorkers] = useState(3);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(["openai", "mistral", "claude"]);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("claude");
  const [autoTitleModel, setAutoTitleModel] = useState<string>("mistral");

  // Key validation errors during typing
  const [keyValidationStates, setKeyValidationStates] = useState<Record<string, "empty" | "valid" | "invalid">>({
    openai: "empty",
    claude: "empty",
    gemini: "empty",
    deepseek: "empty",
    mistral: "empty"
  });

  // UI state machine for orchestrator execution
  const [pipelineState, setPipelineState] = useState<"idle" | "running" | "completed">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeErrorMessage, setActiveErrorMessage] = useState<string | null>(null);

  // Inspector Card Focus
  const [selectedInspectorModel, setSelectedInspectorModel] = useState<string>("openai");

  // DOM Refs for Auto-Scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ==================== INITIALIZATION & PERSISTENCE ====================

  useEffect(() => {
    // Check if session storage is active
    const savedLogin = sessionStorage.getItem("is_logged_in");
    let isGuest = true;
    if (savedLogin === "true") {
      setUser({ name: "Mehul Arora", email: "mehul@example.com" });
      isGuest = false;
    }

    const storage = isGuest ? sessionStorage : localStorage;

    // Load keys
    const savedKeys = storage.getItem("orchestrator_keys");
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setApiKeys(parsed);
        // Pre-validate loaded keys
        const initialValidations: Record<string, "empty" | "valid" | "invalid"> = {};
        Object.keys(MODEL_TEMPLATES).forEach((k) => {
          const val = parsed[k] || "";
          if (val === "") {
            initialValidations[k] = "empty";
          } else {
            initialValidations[k] = MODEL_TEMPLATES[k].regex.test(val) ? "valid" : "invalid";
          }
        });
        setKeyValidationStates(initialValidations);
      } catch (e) {
        console.error("Failed to parse saved keys", e);
      }
    }

    // Load chats
    const savedChats = storage.getItem("orchestrator_chats");
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

    const savedCounter = storage.getItem("orchestrator_chat_counter");
    if (savedCounter) {
      setNextChatCounter(parseInt(savedCounter, 10));
    }
  }, []);

  // Sync state helpers
  const saveStateToStorage = (updatedChats: Chat[], updatedKeys: Record<string, string>, counter = nextChatCounter) => {
    const storage = user ? localStorage : sessionStorage;
    storage.setItem("orchestrator_chats", JSON.stringify(updatedChats));
    storage.setItem("orchestrator_keys", JSON.stringify(updatedKeys));
    storage.setItem("orchestrator_chat_counter", counter.toString());
  };

  // Auto-scroll handler
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, pipelineState, activeChatId]);

  // Handle worker selection limit according to choose number of workers
  const handleToggleWorker = (modelId: string) => {
    if (selectedWorkers.includes(modelId)) {
      setSelectedWorkers(selectedWorkers.filter((id) => id !== modelId));
    } else {
      if (selectedWorkers.length >= numWorkers) {
        // Remove the oldest selected worker to make room
        setSelectedWorkers([...selectedWorkers.slice(1), modelId]);
      } else {
        setSelectedWorkers([...selectedWorkers, modelId]);
      }
    }
  };

  // Google Login Mocks
  const handleGoogleLogin = () => {
    const mockUser = { name: "Mehul Arora", email: "mehul@example.com" };
    setUser(mockUser);
    sessionStorage.setItem("is_logged_in", "true");
    // Migrate session chats/keys to local storage so they persist permanently
    localStorage.setItem("orchestrator_chats", JSON.stringify(chats));
    localStorage.setItem("orchestrator_keys", JSON.stringify(apiKeys));
    localStorage.setItem("orchestrator_chat_counter", nextChatCounter.toString());
  };

  const handleSignOut = () => {
    setUser(null);
    sessionStorage.removeItem("is_logged_in");
    sessionStorage.removeItem("orchestrator_chats");
    sessionStorage.removeItem("orchestrator_keys");
    sessionStorage.removeItem("orchestrator_chat_counter");
    // Reset core states to defaults (no chats, empty keys)
    setChats([]);
    setActiveChatId(null);
    setNextChatCounter(1);
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
  };

  // API Key Typing Validation
  const handleKeyChange = (provider: string, value: string) => {
    const updated = { ...apiKeys, [provider]: value };
    setApiKeys(updated);

    // Validation
    const state = value === "" ? "empty" : MODEL_TEMPLATES[provider].regex.test(value) ? "valid" : "invalid";
    setKeyValidationStates((prev) => ({ ...prev, [provider]: state }));
  };

  // ==================== SIDEBAR CHAT CREATION & EDITING ====================

  const handleNewChat = () => {
    const newId = `chat_${Date.now()}`;
    const newChatTitle = `Chat ${nextChatCounter}`;
    
    // Set up base statistics representing clean state
    const initialStats: Record<string, any> = {};
    Object.keys(MODEL_TEMPLATES).forEach((k) => {
      initialStats[k] = {
        latency: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        status: "idle",
        rawResponse: ""
      };
    });

    const newChat: Chat = {
      id: newId,
      title: newChatTitle,
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
    setSidebarOpen(false); // Close sidebar drawer on mobile
  };

  const handleStartEditingTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingChatTitle(currentTitle);
  };

  const handleSaveChatTitle = (chatId: string) => {
    if (!editingChatTitle.trim()) return;
    const updatedChats = chats.map((c) => (c.id === chatId ? { ...c, title: editingChatTitle } : c));
    setChats(updatedChats);
    setEditingChatId(null);
    saveStateToStorage(updatedChats, apiKeys);
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChats = chats.filter((c) => c.id !== chatId);
    setChats(updatedChats);
    if (activeChatId === chatId) {
      setActiveChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
    saveStateToStorage(updatedChats, apiKeys);
  };

  // ==================== CORE ORCHESTRATION PIPELINE SIMULATOR ====================

  const handleTriggerOrchestrate = (queryText: string) => {
    if (!queryText.trim()) return;
    setActiveErrorMessage(null);

    // 1. KEY VALIDATION
    // Determine which keys are active (selected workers + selected evaluator)
    const requiredProviders = Array.from(new Set([...selectedWorkers, selectedEvaluator]));
    const invalidProviders: string[] = [];

    requiredProviders.forEach((prov) => {
      const key = apiKeys[prov];
      const isValid = MODEL_TEMPLATES[prov].regex.test(key);
      if (!isValid) {
        invalidProviders.push(MODEL_TEMPLATES[prov].name);
      }
    });

    if (invalidProviders.length > 0) {
      setActiveErrorMessage(
        `Error: Invalid or missing API Key for: ${invalidProviders.join(", ")}. Please configure valid keys in the BYOK settings.`
      );
      setKeysModalOpen(true); // Proactively open modal to let them fix it
      return;
    }

    // 2. RETRIEVE OR INITIALIZE CHAT
    let currentChatId = activeChatId;
    let updatedChats = [...chats];

    if (!currentChatId) {
      // Create first chat automatically if none exists
      const newId = `chat_${Date.now()}`;
      const newChatTitle = `Chat ${nextChatCounter}`;
      
      const initialStats: Record<string, any> = {};
      Object.keys(MODEL_TEMPLATES).forEach((k) => {
        initialStats[k] = {
          latency: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          status: "idle",
          rawResponse: ""
        };
      });

      const newChat: Chat = {
        id: newId,
        title: newChatTitle,
        messages: [],
        modelStats: initialStats
      };

      updatedChats = [newChat];
      currentChatId = newId;
      setNextChatCounter(nextChatCounter + 1);
      setActiveChatId(newId);
    }

    // Add user message to active chat
    const targetChatIndex = updatedChats.findIndex((c) => c.id === currentChatId);
    if (targetChatIndex === -1) return;

    const userMessage: Message = { role: "user", content: queryText };
    updatedChats[targetChatIndex].messages = [...updatedChats[targetChatIndex].messages, userMessage];

    // Reset input box
    setSearchQuery("");
    setChats(updatedChats);
    setPipelineState("running");

    // Initialize active stats for selected models on this query
    const statsCopy = { ...updatedChats[targetChatIndex].modelStats };
    selectedWorkers.forEach((w) => {
      statsCopy[w] = {
        ...statsCopy[w],
        status: "running",
        latency: 0.1,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        rawResponse: ""
      };
    });
    // Set non-selected models back to idle
    Object.keys(MODEL_TEMPLATES).forEach((k) => {
      if (!selectedWorkers.includes(k) && k !== selectedEvaluator) {
        statsCopy[k] = {
          ...statsCopy[k],
          status: "idle",
          latency: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          rawResponse: ""
        };
      }
    });

    updatedChats[targetChatIndex].modelStats = statsCopy;
    setChats(updatedChats);

    // 3. SIMULATED API DISPATCH & DUMMY CALCULATION
    setTimeout(() => {
      // Simulate concurrent completion
      const updatedChatsDone = [...updatedChats];
      const activeChat = updatedChatsDone[targetChatIndex];
      const finalStats = { ...activeChat.modelStats };

      // Calculate tokens & costs dynamically
      selectedWorkers.forEach((w) => {
        const config = MODEL_TEMPLATES[w];
        const inputT = Math.floor(Math.random() * 150) + 250;  // 250 - 400 tokens
        const outputT = Math.floor(Math.random() * 300) + 400; // 400 - 700 tokens
        
        // Cost: (InputT * rate/1k) + (OutputT * rate/1k)
        const costVal = (inputT * (config.inputCostPer1K / 1000)) + (outputT * (config.outputCostPer1K / 1000));
        const latencyVal = parseFloat((Math.random() * 0.8 + 0.6).toFixed(2)); // 0.6s to 1.4s

        finalStats[w] = {
          status: "done",
          latency: latencyVal,
          inputTokens: inputT,
          outputTokens: outputT,
          cost: parseFloat(costVal.toFixed(6)),
          rawResponse: config.rawResponseTemplate
        };
      });

      // Calculate evaluator cost
      const evalConfig = MODEL_TEMPLATES[selectedEvaluator];
      const evalInputT = Math.floor(Math.random() * 100) + 150;
      const evalOutputT = Math.floor(Math.random() * 200) + 300;
      const evalCostVal = (evalInputT * (evalConfig.inputCostPer1K / 1000)) + (evalOutputT * (evalConfig.outputCostPer1K / 1000));
      const evalLatencyVal = parseFloat((Math.random() * 0.5 + 0.4).toFixed(2));

      finalStats[selectedEvaluator] = {
        status: "done",
        latency: evalLatencyVal,
        inputTokens: finalStats[selectedEvaluator]?.inputTokens 
          ? finalStats[selectedEvaluator].inputTokens + evalInputT 
          : evalInputT,
        outputTokens: finalStats[selectedEvaluator]?.outputTokens 
          ? finalStats[selectedEvaluator].outputTokens + evalOutputT 
          : evalOutputT,
        cost: parseFloat(((finalStats[selectedEvaluator]?.cost || 0) + evalCostVal).toFixed(6)),
        rawResponse: evalConfig.rawResponseTemplate
      };

      // Synthesis Builder based on which evaluator was selected
      const synthesisTitle = `### ${evalConfig.name} Evaluator Synthesized Response\n`;
      const synthesisBody = `This report synthesizes information gathered concurrently from **${selectedWorkers.map(id => MODEL_TEMPLATES[id].name).join(", ")}** workers.

#### 1. Consolidation Matrix
The sorting profiles show MergeSort stability matches key requirements. Cache optimization favors QuickSort for memory arrays.

#### 2. Model Specific Specialties Integrated
${selectedWorkers.map(id => `* **${MODEL_TEMPLATES[id].name}**: ${MODEL_TEMPLATES[id].strength}`).join("\n")}

#### 3. Recommended Path
For primitive memory architectures, deploy QuickSort (median-of-three pivot to avoid worst cases). If records have metadata components, deploy MergeSort to preserve stability.`;

      const assistantMessage: Message = {
        role: "assistant",
        content: synthesisTitle + synthesisBody
      };

      activeChat.messages = [...activeChat.messages, assistantMessage];
      activeChat.modelStats = finalStats;

      setChats(updatedChatsDone);
      setPipelineState("completed");
      saveStateToStorage(updatedChatsDone, apiKeys);
    }, 2200);
  };

  // ==================== CALCULATION & SELECTORS ====================

  // Select active chat object
  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Calculate Cumulative Total Cost for all chats in history
  const calculateTotalUserCost = () => {
    return chats.reduce((total, chat) => {
      const statsSum = Object.values(chat.modelStats).reduce((sum, stats) => sum + (stats.cost || 0), 0);
      return total + statsSum;
    }, 0);
  };

  // Currently visible right panel cards
  // Users want to show ONLY the cards of selected worker models and the evaluator model
  const activeRightSideCardIds = Array.from(new Set([...selectedWorkers, selectedEvaluator]));

  // Auto-title settings config text
  const currentAutoTitleModelName = MODEL_TEMPLATES[autoTitleModel]?.name || "Mistral Large";

  return (
    <div className="flex h-screen w-full bg-[#08080a] text-zinc-200 overflow-hidden font-sans antialiased">
      
      {/* ==================== LEFT SIDEBAR ==================== */}
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-72 border-r border-zinc-800/80 bg-[#0c0c0e] transition-transform duration-300 transform lg:translate-x-0 lg:static shrink-0 overflow-hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & Auth Area */}
        <div className="flex flex-col border-b border-zinc-800/80 bg-[#09090b] p-4 gap-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black shadow-md shadow-violet-500/20">
                Ω
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-none">ApexRouter</span>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Orchestrator v1.2</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-zinc-500 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Sign-In Block */}
          <div className="pt-1.5">
            {user ? (
              <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 p-2.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-xs font-bold text-violet-300">
                    MA
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-zinc-200">{user.name}</p>
                    <p className="text-[9px] text-zinc-500 font-mono truncate max-w-[120px]">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="text-[10px] text-zinc-500 hover:text-red-400 font-semibold px-2 py-1 rounded hover:bg-red-500/10 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button 
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 py-2 px-3 text-xs font-bold text-zinc-300 hover:text-white transition duration-200"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
                <div className="flex justify-between items-center px-1 text-[9px] text-zinc-500 font-mono">
                  <span>Session: Guest Mode</span>
                  <span className="text-amber-500/90 font-bold">Wipes on close</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Thread Action Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 hover:shadow-violet-600/10 py-2.5 px-3 text-xs font-bold text-white transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            <span>New Conversation</span>
          </button>
        </div>

        {/* Chat List Scroll Container */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Conversations</span>
            <span className="text-[10px] text-zinc-600 font-mono">({chats.length})</span>
          </div>

          {chats.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-zinc-600 italic">
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
                    }
                  }}
                  className={`group relative flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left border cursor-pointer transition ${
                    isActive
                      ? "bg-zinc-900 border-zinc-800 text-white font-semibold shadow-inner shadow-black/40"
                      : "border-transparent hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 mr-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5 text-zinc-500 shrink-0">
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
                        className="w-full bg-zinc-950 text-xs px-1.5 py-0.5 border border-violet-500 rounded text-white focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs truncate">{c.title}</span>
                    )}
                  </div>

                  {/* Actions Visible on Hover */}
                  {!isEditing && (
                    <div className="absolute right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Rename/Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditingTitle(c.id, c.title);
                        }}
                        title="Rename Thread"
                        className="text-zinc-500 hover:text-white p-0.5 rounded hover:bg-zinc-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteChat(c.id, e)}
                        title="Delete Thread"
                        className="text-zinc-500 hover:text-red-400 p-0.5 rounded hover:bg-zinc-800"
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

        {/* Global Settings & Auto-Title configuration drawer trigger */}
        <div className="p-3 border-t border-zinc-800 bg-[#0a0a0c]">
          <button 
            onClick={() => setKeysModalOpen(true)}
            className="flex w-full items-center justify-between rounded-xl bg-zinc-900/50 border border-zinc-850 p-3 hover:border-violet-500/40 hover:bg-zinc-900 transition duration-200"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-violet-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.936 6.936 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <div className="text-left">
                <p className="text-xs font-semibold text-zinc-300">Settings & Keys</p>
                <p className="text-[9px] text-zinc-500 font-mono truncate max-w-[130px]">Workers, Eval, Titles</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 text-zinc-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Database Status Panel */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#09090b]">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-400 font-semibold">PostgreSQL Database Sync</span>
            </div>
          </div>
          <p className="text-[9px] text-zinc-500 font-mono mt-1">
            Status: {user ? "Authenticated (Synced)" : "Guest Session (Local storage)"}
          </p>
        </div>
      </aside>

      {/* ==================== CENTER MAIN CONTAINER ==================== */}
      <main className="flex flex-col flex-1 bg-[#08080a] relative overflow-hidden">
        
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-zinc-800/80 bg-[#08080a]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle for mobile */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5.5 h-5.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-white">
                {activeChat ? activeChat.title : "No Thread Active"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* API Key Modal Shortcut Indicator */}
            <button
              onClick={() => setKeysModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-400 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 text-violet-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a3 3 0 0 1-3 3m-12-6a3 3 0 0 1-3 3m12-3a3 3 0 0 1-3 3m-12 12a3 3 0 0 1-3-3m12 3a3 3 0 0 1-3-3" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Metrics Toggle for Mobile/Tablet */}
            <button 
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-900 transition flex items-center gap-2 border border-zinc-800 bg-zinc-900/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
              </svg>
              <span className="text-xs font-semibold hidden md:inline">Inspect Metrics</span>
            </button>
          </div>
        </header>

        {/* Dynamic Global Key Validation Error Banner */}
        {activeErrorMessage && (
          <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-3 text-xs text-red-400 font-semibold flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4.5 h-4.5 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{activeErrorMessage}</span>
          </div>
        )}

        {/* Chat / Simulation Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin"
        >
          {!activeChat || activeChat.messages.length === 0 ? (
            /* ==================== IDLE STATE: LANDING LAYOUT ==================== */
            <div className="max-w-xl mx-auto py-16 space-y-10 text-center">
              
              {/* Main Landing Header */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Consolidated AI Synthesizer<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
                    Dual Evaluation Gateway
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Query worker models concurrently, synthesize responses through an evaluator model, and persist historical metrics in Drizzle Postgres.
                </p>
              </div>

              {/* Status information tags */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2.5">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">Current Pipeline Configuration</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
                  <div>Workers Selectable: <span className="text-zinc-200">{numWorkers} Limit</span></div>
                  <div>Active Workers: <span className="text-zinc-200">{selectedWorkers.map(id => MODEL_TEMPLATES[id]?.name).join(", ")}</span></div>
                  <div className="col-span-2">Evaluator Model: <span className="text-rose-400 font-bold">{MODEL_TEMPLATES[selectedEvaluator]?.name}</span></div>
                  <div className="col-span-2">Auto-Title Model: <span className="text-zinc-200">{currentAutoTitleModelName}</span></div>
                </div>
              </div>

              {/* Clickable Quick-Start Prompts */}
              <div className="space-y-3 max-w-lg mx-auto text-left">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">Selected Sample Prompts</p>
                
                <button
                  onClick={() => handleTriggerOrchestrate("Compare the time complexity of QuickSort vs MergeSort with code examples.")}
                  className="w-full text-left p-3.5 rounded-xl border border-zinc-800 bg-[#0c0c0f]/50 hover:bg-[#0c0c0f] hover:border-violet-500/40 transition duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-zinc-300 font-medium group-hover:text-white">Compare the time complexity of QuickSort vs MergeSort with code examples.</span>
                    <span className="text-xs text-violet-400 group-hover:translate-x-1 transition duration-200 font-bold">→</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Runs concurrent benchmark trace inside the workspace container.</p>
                </button>

                <button
                  onClick={() => handleTriggerOrchestrate("Write a Next.js API route that encrypts BYOK credentials with AES-256.")}
                  className="w-full text-left p-3.5 rounded-xl border border-zinc-800 bg-[#0c0c0f]/50 hover:bg-[#0c0c0f] hover:border-violet-500/40 transition duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-zinc-300 font-medium group-hover:text-white">How do I securely encrypt credentials in Next.js using AES-256?</span>
                    <span className="text-xs text-violet-400 group-hover:translate-x-1 transition duration-200 font-bold">→</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Queries Mistral, OpenAI and Claude, then runs synthesis reports.</p>
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
                    className={`flex gap-4 p-4.5 rounded-2xl border transition-all ${
                      isUser 
                        ? "bg-zinc-900/30 border-zinc-850/80 justify-start"
                        : "bg-[#0c0c0f]/50 border-zinc-800/60 leading-relaxed text-sm"
                    }`}
                  >
                    {/* Role Avatar */}
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isUser 
                        ? "bg-zinc-800 text-zinc-300 border border-zinc-700" 
                        : "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                    }`}>
                      {isUser ? "U" : "Ω"}
                    </div>

                    {/* Message Body */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                        {isUser ? "User Query" : `${MODEL_TEMPLATES[selectedEvaluator]?.name} Evaluator Synthesis`}
                      </p>
                      
                      <div className="prose prose-invert max-w-none text-zinc-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                        {/* Custom markdown parsing for code blocks block formatting */}
                        {msg.content.split("```").map((chunk, idx) => {
                          const isCode = idx % 2 === 1;
                          if (isCode) {
                            // Extract language
                            const lines = chunk.split("\n");
                            const lang = lines[0] || "python";
                            const codeContent = lines.slice(1).join("\n");
                            return (
                              <div key={idx} className="my-3 rounded-lg overflow-hidden border border-zinc-800 bg-[#050507]">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 text-[10px] text-zinc-500 font-mono border-b border-zinc-800">
                                  <span>{lang} code snippet</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(codeContent.trim());
                                      alert("Code copied to clipboard!");
                                    }}
                                    className="hover:text-white flex items-center gap-1"
                                  >
                                    Copy
                                  </button>
                                </div>
                                <pre className="p-3.5 overflow-x-auto text-[11px] font-mono leading-relaxed text-zinc-300">
                                  <code>{codeContent.trim()}</code>
                                </pre>
                              </div>
                            );
                          }
                          return <span key={idx}>{chunk}</span>;
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Running Loader state inside message container */}
              {pipelineState === "running" && (
                <div className="flex gap-4 p-4.5 rounded-2xl border border-zinc-800/60 bg-[#0c0c0f]/20 animate-pulse">
                  <div className="h-8 w-8 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <svg className="animate-spin h-4 w-4 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Orchestrator running...</p>
                    <p className="text-xs text-zinc-400 font-medium">
                      Querying workers ({selectedWorkers.map(id => MODEL_TEMPLATES[id]?.name).join(", ")}) concurrently. Synthesizing answers via {MODEL_TEMPLATES[selectedEvaluator]?.name}...
                    </p>
                    <div className="h-1.5 w-48 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full animate-infinite-progress" style={{ width: "60%" }}></div>
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
        <footer className="p-4 border-t border-zinc-800/80 bg-[#08080a]">
          <div className="max-w-3xl mx-auto relative">
            
            {/* Input Bar */}
            <div className="relative flex items-center rounded-xl border border-zinc-800 bg-[#0d0d10] focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/10 transition-all p-2 gap-2.5">
              
              <button 
                onClick={() => setKeysModalOpen(true)}
                title="Configure Keys & Workers"
                className="p-2 text-zinc-500 hover:text-violet-400 rounded-lg hover:bg-zinc-900 transition shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </button>

              <input
                type="text"
                placeholder="Ask ApexRouter (e.g. Compare QuickSort vs MergeSort)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTriggerOrchestrate(searchQuery);
                  }
                }}
                disabled={pipelineState === "running"}
                className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none disabled:text-zinc-500"
              />

              <button
                onClick={() => handleTriggerOrchestrate(searchQuery || "Compare the time complexity of QuickSort vs MergeSort with code examples.")}
                disabled={pipelineState === "running" || !searchQuery.trim()}
                className="h-9 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-violet-500/20 active:scale-95 transition-all disabled:opacity-40"
              >
                Orchestrate
              </button>
            </div>
            
            <p className="text-center text-[10px] text-zinc-500 mt-2.5 font-mono">
              AES-256 encryption active • Drizzle ORM PostgreSQL persistence
            </p>
          </div>
        </footer>

      </main>

      {/* ==================== RIGHT INSPECTOR PANEL (ONLY SELECTED WORKERS & EVALUATOR) ==================== */}
      {rightPanelOpen && (
        <aside className="fixed inset-y-0 right-0 z-40 lg:static w-80 border-l border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0 overflow-hidden shadow-2xl lg:shadow-none">
          
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-800 bg-[#09090b]">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Metrics Inspector</span>
              <span className="text-[9px] text-zinc-500 font-mono">Only selected worker/eval models</span>
            </div>
            <button 
              onClick={() => setRightPanelOpen(false)}
              className="p-1 text-zinc-500 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Cumulative Total Cost & Active Chat cost */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/30 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/80">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Active Chat Cost</p>
              <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                {activeChat ? `$${Object.values(activeChat.modelStats).reduce((sum, s) => sum + s.cost, 0).toFixed(5)}` : "$0.00000"}
              </p>
            </div>
            <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/80">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Total User Cost</p>
              <p className="text-sm font-bold text-violet-400 font-mono mt-0.5">
                ${calculateTotalUserCost().toFixed(5)}
              </p>
            </div>
          </div>

          {/* List of Models - FILTERED: Showing only the selected workers and evaluator */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin">
            
            {activeRightSideCardIds.map((modelId) => {
              const config = MODEL_TEMPLATES[modelId];
              const stats = activeChat ? activeChat.modelStats[modelId] : null;

              const isWorker = selectedWorkers.includes(modelId);
              const isEvaluator = selectedEvaluator === modelId;
              const isSelected = selectedInspectorModel === modelId;

              return (
                <div 
                  key={modelId}
                  onClick={() => setSelectedInspectorModel(modelId)}
                  className={`p-3 rounded-xl border bg-zinc-900/40 text-left transition duration-200 cursor-pointer ${
                    isSelected 
                      ? "bg-zinc-900/80 border-violet-500/50 shadow-md ring-1 ring-violet-500/10" 
                      : "border-zinc-800 hover:bg-zinc-900/50"
                  }`}
                >
                  {/* Title Row with Workers & Evaluators Badges */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${config.avatarColor}`} />
                      <span className="text-xs font-bold text-white">{config.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isWorker && (
                        <span className="text-[8px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded">
                          Worker ✓
                        </span>
                      )}
                      {isEvaluator && (
                        <span className="text-[8px] font-mono font-bold bg-red-500/10 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded">
                          Eval ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Token usage per chat & cost subgrid */}
                  <div className="grid grid-cols-3 gap-1 py-1.5 border-t border-b border-zinc-800/80 my-2 text-[10px] font-mono text-zinc-400">
                    <div>
                      <p className="text-[8px] text-zinc-500 font-sans uppercase">Latency</p>
                      <p className="font-bold text-zinc-200">
                        {stats && stats.latency > 0 ? `${stats.latency}s` : "0.00s"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-500 font-sans uppercase">Tokens (In/Out)</p>
                      <p className="font-bold text-zinc-200 leading-tight">
                        {stats && stats.inputTokens > 0 
                          ? `${stats.inputTokens + stats.outputTokens}` 
                          : "0"}
                      </p>
                      {stats && stats.inputTokens > 0 && (
                        <p className="text-[8px] text-zinc-500">
                          ({stats.inputTokens}/{stats.outputTokens})
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-500 font-sans uppercase">Cost Est.</p>
                      <p className="font-bold text-zinc-200">
                        {stats && stats.cost > 0 ? `$${stats.cost.toFixed(5)}` : "$0.00000"}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Info helper tooltip */}
                  <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                    <span>Input: ${config.inputCostPer1K}/1k</span>
                    <span>Output: ${config.outputCostPer1K}/1k</span>
                  </div>

                  {/* Specialty */}
                  <p className="text-[10px] text-zinc-500 mt-2">
                    <span className="text-zinc-400 font-semibold">Specialty:</span> {config.strength}
                  </p>

                </div>
              );
            })}

          </div>

          {/* Model Raw Inspector Tab Viewer */}
          <div className="h-56 border-t border-zinc-800 flex flex-col bg-[#0b0b0d]">
            
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60 bg-[#09090b] text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Raw Response Preview</span>
              <span className="font-mono text-violet-400">
                {MODEL_TEMPLATES[selectedInspectorModel]?.name || "Select Model"}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] text-zinc-500 leading-normal scrollbar-thin bg-zinc-950/40 select-all">
              {activeChat && activeChat.modelStats[selectedInspectorModel]?.rawResponse ? (
                <pre className="whitespace-pre-wrap">{activeChat.modelStats[selectedInspectorModel].rawResponse}</pre>
              ) : (
                <span className="italic text-zinc-600 block text-center py-4">No data. Run search query to inspect raw model payloads.</span>
              )}
            </div>

          </div>

        </aside>
      )}

      {/* ==================== BYOK CREDENTIALS & SETTINGS MODAL ==================== */}
      {keysModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0f0f12] p-5 sm:p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                  ⚙️
                </div>
                <h3 className="text-base font-bold text-white">ApexRouter Orchestration Settings</h3>
              </div>
              <button 
                onClick={() => setKeysModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* BYOK KEY CONFIG SECTION WITH REAL-TIME REGEX VALIDATION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">1. API Keys (BYOK Encrypted Storage)</h4>
                <span className="text-[9px] text-zinc-500 font-mono">Real-time Regex Checks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {Object.keys(MODEL_TEMPLATES).map((id) => {
                  const m = MODEL_TEMPLATES[id];
                  const state = keyValidationStates[id];
                  return (
                    <div key={id} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-semibold text-zinc-400">{m.name} Key</label>
                        {state === "valid" && (
                          <span className="text-[9px] font-mono text-emerald-400 font-bold">✓ Valid</span>
                        )}
                        {state === "invalid" && (
                          <span className="text-[9px] font-mono text-red-400 font-bold">✗ Invalid format</span>
                        )}
                        {state === "empty" && (
                          <span className="text-[9px] font-mono text-zinc-600">Missing Key</span>
                        )}
                      </div>
                      <div className={`flex items-center rounded-lg border p-2 bg-zinc-950/60 ${
                        state === "valid" ? "border-emerald-500/30" : state === "invalid" ? "border-red-500/30" : "border-zinc-800"
                      }`}>
                        <input
                          type="password"
                          value={apiKeys[id]}
                          placeholder={m.placeholderKey}
                          onChange={(e) => handleKeyChange(id, e.target.value)}
                          className="w-full bg-transparent text-xs font-mono text-zinc-300 outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* WORKERS CONFIG SECTION */}
            <div className="space-y-4 pt-4 border-t border-zinc-800/80 text-left">
              
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">2. Worker Pipeline Routing</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-semibold">Max concurrent workers:</span>
                  <select 
                    value={numWorkers}
                    onChange={(e) => {
                      const count = parseInt(e.target.value, 10);
                      setNumWorkers(count);
                      // Shrink selected workers if they exceed the new count limit
                      if (selectedWorkers.length > count) {
                        setSelectedWorkers(selectedWorkers.slice(0, count));
                      }
                    }}
                    className="bg-zinc-900 border border-zinc-800 text-xs px-2 py-0.5 rounded text-white"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Workers Grid Selection */}
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 font-mono mb-2">Select up to {numWorkers} active workers (marked with green checkmarks):</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.keys(MODEL_TEMPLATES).map((id) => {
                    const config = MODEL_TEMPLATES[id];
                    const isSelected = selectedWorkers.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => handleToggleWorker(id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs transition duration-150 ${
                          isSelected 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" 
                            : "border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:bg-zinc-900"
                        }`}
                      >
                        <span>{config.name}</span>
                        {isSelected && <span className="text-emerald-500 font-bold text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Evaluator Configuration Selector */}
              <div className="space-y-1.5 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-zinc-400">3. Evaluator Model (Synthesizer Brain - marked with red checkmark):</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.keys(MODEL_TEMPLATES).map((id) => {
                    const config = MODEL_TEMPLATES[id];
                    const isSelected = selectedEvaluator === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedEvaluator(id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs transition duration-150 ${
                          isSelected 
                            ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold" 
                            : "border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:bg-zinc-900"
                        }`}
                      >
                        <span>{config.name}</span>
                        {isSelected && <span className="text-red-500 font-bold text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auto-Title Model Settings */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3">
                <div className="text-left">
                  <p className="text-[11px] font-semibold text-zinc-400">4. Auto-Title Thread Configuration</p>
                  <p className="text-[9px] text-zinc-500 font-mono">Model used to auto-name sidebar threads</p>
                </div>
                <select 
                  value={autoTitleModel}
                  onChange={(e) => setAutoTitleModel(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs px-2 py-1.5 rounded-lg text-white font-mono w-full sm:w-44"
                >
                  {Object.keys(MODEL_TEMPLATES).map((id) => (
                    <option key={id} value={id}>{MODEL_TEMPLATES[id].name}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Save Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
              <button
                onClick={() => setKeysModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setKeysModalOpen(false);
                  saveStateToStorage(chats, apiKeys);
                  alert("Settings successfully written to storage!");
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-500/20 transition duration-200"
              >
                Save Settings
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
