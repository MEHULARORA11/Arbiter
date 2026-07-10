"use client";

import React, { useState, useEffect, useRef } from "react";

// Mock database structures and simulation details
interface ModelCard {
  id: string;
  name: string;
  provider: string;
  avatarColor: string;
  borderColor: string;
  textColor: string;
  accentBg: string;
  defaultLatency: number;
  defaultTokens: number;
  defaultCost: number;
  strength: string;
  rawResponse: string;
  failedResponse: string;
}

const MODELS: ModelCard[] = [
  {
    id: "openai",
    name: "GPT-4o",
    provider: "OpenAI",
    avatarColor: "bg-emerald-500",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
    textColor: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    defaultLatency: 1.24,
    defaultTokens: 412,
    defaultCost: 0.00206,
    strength: "Precise coding & highly optimized execution syntax.",
    rawResponse: `### QuickSort vs MergeSort Implementation in Python

Here is a quick, optimized implementation of both algorithms.

\`\`\`python
# QuickSort (In-place, average O(n log n))
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

# MergeSort (Stable, guaranteed O(n log n))
def mergesort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = mergesort(arr[:mid])
    right = mergesort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
\`\`\`

**Time Complexity Analysis:**
* **QuickSort**: Average $O(n \\log n)$, Worst-case $O(n^2)$ (when pivot is poorly chosen).
* **MergeSort**: Always $O(n \\log n)$ for all cases.
`,
    failedResponse: "Model failed to respond due to endpoint rate limits.",
  },
  {
    id: "claude",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    avatarColor: "bg-orange-500",
    borderColor: "border-orange-500/30 hover:border-orange-500/60",
    textColor: "text-orange-400",
    accentBg: "bg-orange-500/10",
    defaultLatency: 1.68,
    defaultTokens: 489,
    defaultCost: 0.00734,
    strength: "Architectural reasoning, worst-case edge cases, and safety limits.",
    rawResponse: `### Algorithmic Comparison: QuickSort vs MergeSort

When deciding between **QuickSort** and **MergeSort**, the choice often depends on architectural trade-offs: memory limits, stable sorting requirements, and hardware cache performance.

#### Architectural Breakdown
1. **Space Complexity**:
   - **QuickSort** is space-efficient. It runs in-place, requiring only $O(\\log n)$ auxiliary space for the recursion stack.
   - **MergeSort** requires $O(n)$ extra memory to hold auxiliary arrays during merging, making it memory-intensive for large datasets.
2. **Stability**:
   - **MergeSort** is naturally **stable** (preserves the relative order of identical elements), which is critical for complex object sorting.
   - **QuickSort** is **unstable** in its standard in-place configurations.
3. **Worst-Case Behavior**:
   - **QuickSort** suffers from a quadratic $O(n^2)$ worst-case time complexity if pivots consistently partition the array into empty and $n-1$ elements.
   - **MergeSort** maintains a strict $O(n \\log n)$ bound under all conditions.

#### Python Code Snippet (In-Place Partitioning for QuickSort)
\`\`\`python
def quicksort_inplace(arr, low, high):
    if low < high:
        p_idx = partition(arr, low, high)
        quicksort_inplace(arr, low, p_idx - 1)
        quicksort_inplace(arr, p_idx + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
\`\`\`
`,
    failedResponse: "Model failed to respond due to endpoint rate limits.",
  },
  {
    id: "gemini",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    avatarColor: "bg-blue-500",
    borderColor: "border-blue-500/30 hover:border-blue-500/60",
    textColor: "text-blue-400",
    accentBg: "bg-blue-500/10",
    defaultLatency: 0.98,
    defaultTokens: 524,
    defaultCost: 0.00366,
    strength: "Explanatory analogies, large context integration, and visual flows.",
    rawResponse: `### Conceptualizing QuickSort and MergeSort

Think of the differences using these real-world comparisons:

* **MergeSort (Divide & Conquer / Cooperative)**: Imagine a teacher collecting exam papers from 4 classrooms. Instead of sorting all 120 papers at once, the teacher asks each of the 4 assistants to sort their classroom papers first ($O(n \\log n)$ division), then merges the sorted piles. It is highly predictable but requires an empty table large enough to hold all 120 papers ($O(n)$ memory).
* **QuickSort (Partitioning / Pivot-Based)**: Imagine sorting a list of numbers by choosing a random "middle value" (e.g., 50), putting everything smaller than 50 in a left bucket and everything larger in a right bucket, then repeating. You don't need additional tables (in-place), but if you accidentally pick the smallest number (e.g., 1) as your pivot every time, you end up sorting one-by-one ($O(n^2)$ worst case).

#### Time & Space Complexity Summary Table
| Metric | QuickSort | MergeSort |
| :--- | :--- | :--- |
| **Best Case** | $O(n \\log n)$ | $O(n \\log n)$ |
| **Average Case** | $O(n \\log n)$ | $O(n \\log n)$ |
| **Worst Case** | $O(n^2)$ | $O(n \\log n)$ |
| **Space Complexity** | $O(\\log n)$ | $O(n)$ |
| **Stability** | No | Yes |
`,
    failedResponse: "Google API Error: Service Unavailable (503). Simulation of Promise.allSettled fallback active.",
  },
];

// Synthesized final answer
const SYNTHESIZED_RESPONSE_SUCCESS = `### Synthesized Orchestration Report: QuickSort vs MergeSort

This response integrates the core implementations from **GPT-4o**, the architectural analysis from **Claude 3.5 Sonnet**, and the analogies/complexity profiles from **Gemini 1.5 Pro**.

---

### 1. Conceptual Framework
* **QuickSort** is a partitioning-based algorithm. It selects a *pivot* element, organizes all other elements into sub-arrays depending on whether they are smaller or larger than the pivot, and recursively sorts the sub-arrays. It operates **in-place** with high cache locality, making it exceptionally fast in practice.
* **MergeSort** is a divide-and-conquer algorithm. It recursively splits the array into halves until single-element arrays are reached, and then merges them back in sorted order. It is a **stable** sort but requires **extra memory** ($O(n)$ space).

---

### 2. Time & Space Complexity Matrix

| Dimension | QuickSort (In-Place) | MergeSort (Stable) | Synthesized Trade-off |
| :--- | :--- | :--- | :--- |
| **Best Case** | $O(n \\log n)$ | $O(n \\log n)$ | Both perform mathematically equivalent operations. |
| **Average Case** | $O(n \\log n)$ | $O(n \\log n)$ | QuickSort has a smaller constant factor (cache-friendly). |
| **Worst Case** | $O(n^2)$ | $O(n \\log n)$ | MergeSort guarantees performance; QuickSort depends on pivot selection. |
| **Space Complexity** | $O(\\log n)$ (recursion stack) | $O(n)$ (auxiliary array) | QuickSort is preferred in memory-constrained environments. |
| **Stability** | Unstable | Stable | MergeSort is required when order of equal keys must be preserved. |

---

### 3. Implementation Details (Python)

#### A. In-Place QuickSort (Optimized)
This implementation uses the Lomuto partition scheme for optimal in-place memory usage (avoiding auxiliary lists):

\`\`\`python
def quicksort_inplace(arr, low, high):
    if low < high:
        pivot_idx = partition(arr, low, high)
        quicksort_inplace(arr, low, pivot_idx - 1)
        quicksort_inplace(arr, pivot_idx + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
\`\`\`

#### B. Stable MergeSort (Guaranteed Performance)
This version utilizes auxiliary slicing to ensure $O(n \\log n)$ efficiency:

\`\`\`python
def mergesort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = mergesort(arr[:mid])
    right = mergesort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
\`\`\`

---

### 4. Evaluator Recommendation
1. **Choose QuickSort** if you are sorting primitive datatypes (integers, floats) in-memory where cache performance and memory constraints are paramount. (Ensure randomized pivot selection is used to avoid $O(n^2)$ worst cases).
2. **Choose MergeSort** if you are sorting objects where sort stability is crucial, or when dealing with linked structures (like linked lists) where pointer manipulation is cheap and memory allocations can be optimized.`;

const SYNTHESIZED_RESPONSE_FALLBACK = `### Synthesized Orchestration Report: QuickSort vs MergeSort (Degraded Mode)

> [!WARNING]
> **Gemini 1.5 Pro failed to respond (API Error: 503)**. 
> The orchestrator bypassed the failure using \`Promise.allSettled()\` and synthesized the final output using **GPT-4o** and **Claude 3.5 Sonnet** data only.

---

### 1. Conceptual Framework (GPT-4o + Claude)
* **QuickSort** (In-Place, Partition-based): Selects a pivot, groups elements, and sorts recursively. Optimizes for space over stability.
* **MergeSort** (Divide & Conquer): Splits arrays, recursively sorts, and merges. Optimizes for stability and guaranteed bounds.

### 2. Time & Space Complexity Comparison

| Algorithm | Average Time | Worst Time | Space Complexity | Stable |
| :--- | :--- | :--- | :--- | :--- |
| **QuickSort** | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$ | No |
| **MergeSort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ | Yes |

*Note: Conceptual analogies usually provided by Gemini 1.5 Pro are unavailable in this report due to provider downtime.*

### 3. Synthesized Python Implementation
*(Optimized implementation based on GPT-4o's compact structure and Claude's safety partitions)*

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
\`\`\`

### 4. Evaluator Consensus
Without Gemini's input, the system recommends **QuickSort** for immediate, low-latency, memory-efficient sorting tasks, and **MergeSort** if stability is strictly required.`;

export default function LandingPage() {
  // Navigation & Toggle States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [keysModalOpen, setKeysModalOpen] = useState(false);
  const [geminiFails, setGeminiFails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pipeline State Machine
  // 'idle' | 'sending' | 'running_models' | 'evaluating' | 'saving' | 'completed'
  const [pipelineState, setPipelineState] = useState<
    "idle" | "sending" | "running_models" | "evaluating" | "saving" | "completed"
  >("idle");

  // Simulated active model states
  const [openaiState, setOpenaiState] = useState<"idle" | "running" | "done" | "failed">("idle");
  const [claudeState, setClaudeState] = useState<"idle" | "running" | "done" | "failed">("idle");
  const [geminiState, setGeminiState] = useState<"idle" | "running" | "done" | "failed">("idle");

  // Real-time latency counting states during simulation
  const [openaiLatency, setOpenaiLatency] = useState(0);
  const [claudeLatency, setClaudeLatency] = useState(0);
  const [geminiLatency, setGeminiLatency] = useState(0);

  // BYOK Saved Keys Mocks
  const [apiKeys, setApiKeys] = useState({
    openai: "sk-proj-••••••••••••••••U7A8",
    claude: "sk-ant-••••••••••••••••9F3D",
    gemini: "AIzaSy••••••••••••••••8H1W",
  });

  // Active Chat Message history mock
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      isFallback?: boolean;
    }>
  >([]);

  // Selected comparison tab for the individual model inspector
  const [selectedInspectorModel, setSelectedInspectorModel] = useState<string>("openai");

  // Triggering the simulation
  const handleStartSimulation = (promptText: string) => {
    if (!promptText.trim()) return;
    
    // Reset states
    setSearchQuery("");
    setPipelineState("sending");
    setOpenaiState("running");
    setClaudeState("running");
    setGeminiState(geminiFails ? "failed" : "running");
    
    setOpenaiLatency(0);
    setClaudeLatency(0);
    setGeminiLatency(0);

    // Add user message to UI
    setMessages([
      { role: "user", content: promptText }
    ]);

    // Latency counter animation loops
    let openaiTimer: NodeJS.Timeout;
    let claudeTimer: NodeJS.Timeout;
    let geminiTimer: NodeJS.Timeout;

    // Step 1: Sending -> Running Models (Concurrent Execution)
    setTimeout(() => {
      setPipelineState("running_models");
      
      // OpenAI Latency Count (Target: 1.24s)
      const opTarget = MODELS[0].defaultLatency;
      let opVal = 0;
      openaiTimer = setInterval(() => {
        if (opVal >= opTarget) {
          clearInterval(openaiTimer);
          setOpenaiState("done");
        } else {
          opVal += 0.1;
          setOpenaiLatency(parseFloat(opVal.toFixed(2)));
        }
      }, 100);

      // Claude Latency Count (Target: 1.68s)
      const clTarget = MODELS[1].defaultLatency;
      let clVal = 0;
      claudeTimer = setInterval(() => {
        if (clVal >= clTarget) {
          clearInterval(claudeTimer);
          setClaudeState("done");
        } else {
          clVal += 0.1;
          setClaudeLatency(parseFloat(clVal.toFixed(2)));
        }
      }, 100);

      // Gemini Latency Count (Target: 0.98s or Fail instantly)
      const gemTarget = MODELS[2].defaultLatency;
      let gemVal = 0;
      if (!geminiFails) {
        geminiTimer = setInterval(() => {
          if (gemVal >= gemTarget) {
            clearInterval(geminiTimer);
            setGeminiState("done");
          } else {
            gemVal += 0.1;
            setGeminiLatency(parseFloat(gemVal.toFixed(2)));
          }
        }, 100);
      } else {
        setGeminiState("failed");
        setGeminiLatency(0.12);
      }
    }, 800);

    // Step 2: Running -> Evaluating (Triggered after longest model completes, ~1.8s)
    setTimeout(() => {
      setPipelineState("evaluating");
    }, 2800);

    // Step 3: Evaluating -> Saving to PostgreSQL
    setTimeout(() => {
      setPipelineState("saving");
    }, 4300);

    // Step 4: Saving -> Completed
    setTimeout(() => {
      setPipelineState("completed");
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: geminiFails ? SYNTHESIZED_RESPONSE_FALLBACK : SYNTHESIZED_RESPONSE_SUCCESS,
          isFallback: geminiFails
        }
      ]);
    }, 5000);
  };

  const handleResetChat = () => {
    setPipelineState("idle");
    setMessages([]);
    setOpenaiState("idle");
    setClaudeState("idle");
    setGeminiState("idle");
    setOpenaiLatency(0);
    setClaudeLatency(0);
    setGeminiLatency(0);
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans antialiased">
      
      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside 
        className={`flex flex-col border-r border-zinc-800 bg-[#0e0e11] transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 -translate-x-full md:w-16 md:translate-x-0"
        } shrink-0 overflow-hidden`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center px-4 border-b border-zinc-800 gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold shadow-md shadow-violet-500/20">
            Ω
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-white leading-none">ApexRouter</span>
              <span className="text-[10px] text-zinc-400 font-mono mt-0.5">Orchestrator v1.0</span>
            </div>
          )}
        </div>

        {/* Action Button: New Thread */}
        <div className="p-3">
          <button
            onClick={handleResetChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 py-2.5 px-3 text-sm font-medium transition-all duration-200 hover:border-violet-500/30 group"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className="h-4 w-4 text-violet-400 group-hover:text-violet-300 transition-colors"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            {sidebarOpen && <span>New Conversation</span>}
          </button>
        </div>

        {/* Conversations History Mock */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin">
          {sidebarOpen && <p className="text-[11px] font-semibold text-zinc-500 uppercase px-2 mb-2 tracking-wider">Saved Threads</p>}
          
          <button 
            onClick={() => handleStartSimulation("Compare the time complexity of QuickSort vs MergeSort with code examples.")}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/40 text-left border border-zinc-800 hover:border-zinc-700/50 transition group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-zinc-400 group-hover:text-violet-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.598.598 0 0 1-.655-.077.598.598 0 0 1-.165-.63l.81-2.8a7.197 7.197 0 0 1-1.4-3.713C4 16.556 8.03 12.875 13 12.875c4.97 0 9 3.681 9 8.25Z" />
            </svg>
            {sidebarOpen && (
              <div className="flex-1 truncate">
                <p className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">QuickSort vs MergeSort</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">3 models • 2.1s elapsed</p>
              </div>
            )}
          </button>

          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/30 text-left border border-transparent hover:border-zinc-800 transition group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-zinc-500 group-hover:text-violet-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            {sidebarOpen && (
              <div className="flex-1 truncate">
                <p className="text-xs font-medium text-zinc-400 truncate">AES-256 Key Encryption</p>
                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">Settings page • 256-bit GCM</p>
              </div>
            )}
          </button>

          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/30 text-left border border-transparent hover:border-zinc-800 transition group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-zinc-500 group-hover:text-violet-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
            {sidebarOpen && (
              <div className="flex-1 truncate">
                <p className="text-xs font-medium text-zinc-400 truncate">Database Sharding Strategies</p>
                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">1 model • 1.1s latency</p>
              </div>
            )}
          </button>
        </div>

        {/* Bring Your Own Keys Indicator Block */}
        <div className="p-3 border-t border-zinc-800 bg-[#0c0c0f]">
          <button 
            onClick={() => setKeysModalOpen(true)}
            className="flex w-full flex-col gap-2 rounded-lg bg-zinc-900/60 border border-zinc-800 p-2.5 text-left hover:border-violet-500/40 hover:bg-zinc-900 transition duration-200"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">BYOK API Credentials</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            {sidebarOpen && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>OpenAI API Key</span>
                    <span className="text-emerald-500 font-bold">✓ Encrypted</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>Claude Key</span>
                    <span className="text-emerald-500 font-bold">✓ Encrypted</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>Gemini Key</span>
                    <span className="text-emerald-500 font-bold">✓ Encrypted</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-violet-400 font-semibold mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  <span>Manage Keys</span>
                </div>
              </>
            )}
          </button>
        </div>

        {/* Database Status Panel */}
        <div className="p-3 border-t border-zinc-800 bg-[#09090b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              {sidebarOpen && <span className="text-xs text-zinc-400 font-semibold">Postgres Online</span>}
            </div>
            {sidebarOpen && <span className="text-[10px] text-zinc-500 font-mono">Drizzle ORM</span>}
          </div>
          {sidebarOpen && (
            <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] text-zinc-500 font-mono">
              <div>Latency: <span className="text-zinc-300">4ms</span></div>
              <div>SSL: <span className="text-zinc-300">Enabled</span></div>
            </div>
          )}
        </div>
      </aside>

      {/* ==================== CENTER MAIN CONTAINER ==================== */}
      <main className="flex flex-col flex-1 bg-[#09090b] relative overflow-hidden">
        
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-300">Thread:</span>
              <span className="text-sm font-semibold text-white">
                {pipelineState === "idle" ? "New Workspace" : "Comparison: QuickSort vs MergeSort"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Gemini Error Simulator Toggle */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 py-1.5 px-3 rounded-full shadow-inner">
              <span className="text-xs text-zinc-400 font-medium">Gemini Fail simulation</span>
              <button 
                onClick={() => setGeminiFails(!geminiFails)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  geminiFails ? "bg-red-500" : "bg-zinc-700"
                }`}
              >
                <span 
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    geminiFails ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Right panel toggle button */}
            <button 
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition hidden lg:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
              </svg>
            </button>
          </div>
        </header>

        {/* Chat / Simulation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          
          {pipelineState === "idle" ? (
            /* ==================== IDLE STATE: LANDING LAYOUT ==================== */
            <div className="max-w-2xl mx-auto py-12 space-y-12">
              
              {/* Main Landing Header */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                  Consolidated AI, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
                    Synthesized in Real-Time
                  </span>
                </h1>
                <p className="text-base text-zinc-400 max-w-md mx-auto">
                  A high-performance orchestration gateway. Query multiple models concurrently, synthesize responses through an evaluator brain, and persist metadata.
                </p>
              </div>

              {/* Feature grid tags */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl border border-zinc-800 bg-[#0e0e11]/50 hover:bg-[#0e0e11] transition duration-200">
                  <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                    ⚡
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-zinc-200">Concurrent Run</p>
                    <p className="text-[10px] text-zinc-500">Promise.allSettled()</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl border border-zinc-800 bg-[#0e0e11]/50 hover:bg-[#0e0e11] transition duration-200">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    🔑
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-zinc-200">BYOK Router</p>
                    <p className="text-[10px] text-zinc-500">AES-256 Encrypted</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl border border-zinc-800 bg-[#0e0e11]/50 hover:bg-[#0e0e11] transition duration-200">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                    🧠
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-zinc-200">Synthesizer</p>
                    <p className="text-[10px] text-zinc-500">Dual model evaluation</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl border border-zinc-800 bg-[#0e0e11]/50 hover:bg-[#0e0e11] transition duration-200">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                    🗄️
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-zinc-200">PostgreSQL DB</p>
                    <p className="text-[10px] text-zinc-500">Drizzle schema tracing</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl border border-zinc-800 bg-[#0e0e11]/50 hover:bg-[#0e0e11] transition duration-200 col-span-2 md:col-span-1">
                  <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                    📊
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-zinc-200">Cost & Latency</p>
                    <p className="text-[10px] text-zinc-500">Per-provider metrics</p>
                  </div>
                </div>
              </div>

              {/* Clickable Quick-Start Prompts */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider text-left">Click a sample to test the pipeline</p>
                
                <button
                  onClick={() => handleStartSimulation("Compare the time complexity of QuickSort vs MergeSort with code examples.")}
                  className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-[#0e0e11]/40 hover:bg-[#0e0e11] hover:border-violet-500/40 transition duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-200 font-medium group-hover:text-white">Compare the time complexity of QuickSort vs MergeSort with code examples.</span>
                    <span className="text-xs text-violet-400 group-hover:translate-x-1 transition duration-200 font-bold">→</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Triggers concurrent execution across GPT-4o, Claude, and Gemini 1.5.</p>
                </button>

                <button
                  onClick={() => handleStartSimulation("How do I store API keys securely in a BYOK architecture using AES-256 encryption?")}
                  className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-[#0e0e11]/40 hover:bg-[#0e0e11] hover:border-violet-500/40 transition duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-200 font-medium group-hover:text-white">Write an API route that encrypts BYOK credentials with AES-256.</span>
                    <span className="text-xs text-violet-400 group-hover:translate-x-1 transition duration-200 font-bold">→</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Checks adapter configurations, schema tables, and encryption helper logic.</p>
                </button>
              </div>

            </div>
          ) : (
            /* ==================== ACTIVE SIMULATION LAYOUT ==================== */
            <div className="max-w-3xl mx-auto space-y-8">
              
              {/* User Prompt Bubble */}
              <div className="flex gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-sm shrink-0">
                  U
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">User Request</p>
                  <p className="text-sm text-zinc-200 leading-relaxed">
                    {messages[0]?.content}
                  </p>
                </div>
              </div>

              {/* Dynamic State Machine Progress Visualizer */}
              <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Orchestration pipeline flow</span>
                  <span className="text-xs font-mono text-zinc-500">Active status tracker</span>
                </div>

                <div className="grid grid-cols-4 gap-2 relative">
                  
                  {/* Step 1: Dispatching */}
                  <div className={`p-2.5 rounded-lg border text-center transition-all duration-300 ${
                    pipelineState === "sending"
                      ? "border-violet-500 bg-violet-500/5 text-violet-200 scale-105"
                      : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                  }`}>
                    <div className="text-xs font-bold font-mono">STEP 1</div>
                    <div className="text-[10px] mt-1 font-semibold">Dispatching</div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5">DB Message Save</div>
                  </div>

                  {/* Step 2: Concurrent API Dispatch */}
                  <div className={`p-2.5 rounded-lg border text-center transition-all duration-300 ${
                    pipelineState === "running_models"
                      ? "border-violet-500 bg-violet-500/5 text-violet-200 scale-105"
                      : pipelineState === "evaluating" || pipelineState === "saving" || pipelineState === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                      : "border-zinc-800 text-zinc-500"
                  }`}>
                    <div className="text-xs font-bold font-mono">STEP 2</div>
                    <div className="text-[10px] mt-1 font-semibold">API Execution</div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5">Promise.allSettled</div>
                  </div>

                  {/* Step 3: Synthesis Evaluation */}
                  <div className={`p-2.5 rounded-lg border text-center transition-all duration-300 ${
                    pipelineState === "evaluating"
                      ? "border-violet-500 bg-violet-500/5 text-violet-200 scale-105"
                      : pipelineState === "saving" || pipelineState === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                      : "border-zinc-800 text-zinc-500"
                  }`}>
                    <div className="text-xs font-bold font-mono">STEP 3</div>
                    <div className="text-[10px] mt-1 font-semibold">Evaluation</div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5">Synthesizer Brain</div>
                  </div>

                  {/* Step 4: Postgres Persist */}
                  <div className={`p-2.5 rounded-lg border text-center transition-all duration-300 ${
                    pipelineState === "saving"
                      ? "border-violet-500 bg-violet-500/5 text-violet-200 scale-105"
                      : pipelineState === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                      : "border-zinc-800 text-zinc-500"
                  }`}>
                    <div className="text-xs font-bold font-mono">STEP 4</div>
                    <div className="text-[10px] mt-1 font-semibold">Persisting</div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5">Write Postgres</div>
                  </div>

                </div>

                {/* Pipeline visual running line */}
                <div className="relative mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: 
                        pipelineState === "sending" ? "25%" :
                        pipelineState === "running_models" ? "50%" :
                        pipelineState === "evaluating" ? "75%" :
                        pipelineState === "saving" ? "90%" :
                        pipelineState === "completed" ? "100%" : "0%"
                    }}
                  />
                </div>
              </div>

              {/* Status and streaming panel */}
              {pipelineState !== "completed" && (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 text-zinc-400 space-y-4">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-semibold text-sm text-zinc-200">
                      {pipelineState === "sending" && "Connecting to local PostgreSQL instance..."}
                      {pipelineState === "running_models" && "Running models concurrently..."}
                      {pipelineState === "evaluating" && "Synthesizing answer structure..."}
                      {pipelineState === "saving" && "Writing records & usage costs to Postgres..."}
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs font-mono">
                    <span className={`transition-colors duration-200 ${openaiState === "running" ? "text-violet-400 animate-pulse" : openaiState === "done" ? "text-emerald-400" : "text-zinc-600"}`}>
                      OpenAI (GPT-4o): {openaiState === "running" ? `${openaiLatency}s` : openaiState === "done" ? "1.24s (Success)" : "Waiting..."}
                    </span>
                    <span className={`transition-colors duration-200 ${claudeState === "running" ? "text-violet-400 animate-pulse" : claudeState === "done" ? "text-emerald-400" : "text-zinc-600"}`}>
                      Claude (3.5 Sonnet): {claudeState === "running" ? `${claudeLatency}s` : claudeState === "done" ? "1.68s (Success)" : "Waiting..."}
                    </span>
                    <span className={`transition-colors duration-200 ${geminiState === "running" ? "text-violet-400 animate-pulse" : geminiState === "done" ? "text-emerald-400" : geminiState === "failed" ? "text-red-400 font-bold" : "text-zinc-600"}`}>
                      Gemini (1.5 Pro): {geminiState === "running" ? `${geminiLatency}s` : geminiState === "done" ? "0.98s (Success)" : geminiState === "failed" ? "Failed (Bypassed)" : "Waiting..."}
                    </span>
                  </div>
                </div>
              )}

              {/* Synthesized Response Rendering */}
              {pipelineState === "completed" && messages[1] && (
                <div className="space-y-6">
                  
                  {/* Synthesis Header Bar */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 text-violet-300">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-violet-500/20 text-xs font-bold">BRAIN</span>
                      <span className="text-xs font-semibold">Orchestrator synthesized response</span>
                    </div>
                    {messages[1].isFallback && (
                      <span className="text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded uppercase">
                        Degraded State Active
                      </span>
                    )}
                  </div>

                  {/* Main synthesized Markdown output */}
                  <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 text-zinc-300 leading-relaxed text-sm space-y-4">
                    
                    {/* Rendered content details */}
                    <div className="prose prose-invert max-w-none space-y-4">
                      
                      {/* Section 1 */}
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">Synthesized Orchestration Report: QuickSort vs MergeSort</h3>
                        <p className="text-zinc-400 text-xs italic mb-4">
                          This report consolidates results from {messages[1].isFallback ? "GPT-4o and Claude 3.5" : "GPT-4o, Claude 3.5, and Gemini 1.5 Pro"}.
                        </p>
                      </div>

                      {/* Warnings if fallback */}
                      {messages[1].isFallback && (
                        <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-300 rounded-lg text-xs flex gap-2 items-start">
                          <span className="text-sm leading-none">⚠️</span>
                          <div>
                            <span className="font-bold">Gemini 1.5 Pro failed to respond (API Error: 503)</span>. The orchestrator bypassed the failure using <code>Promise.allSettled()</code> and successfully synthesized the response using OpenAI and Anthropic metrics only.
                          </div>
                        </div>
                      )}

                      {/* Section 2 */}
                      <div>
                        <h4 className="text-sm font-bold text-violet-400 uppercase tracking-wider mb-2">1. Conceptual Overview</h4>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                          <li><strong>QuickSort</strong>: In-place, pivot-based partitioning. Average time complexity is $O(n \log n)$, but can degrade to $O(n^2)$ if pivots partition poorly. Highly space-efficient ($O(\log n)$ memory footprint).</li>
                          <li><strong>MergeSort</strong>: Divide-and-conquer strategy that splits data in halves recursively and merges. Guarantees a stable sort with strict $O(n \log n)$ complexity, but requires $O(n)$ extra space to merge components.</li>
                        </ul>
                      </div>

                      {/* Section 3 (Glowing comparison table) */}
                      <div className="overflow-x-auto my-6 border border-zinc-800 rounded-lg bg-zinc-950/40">
                        <table className="min-w-full divide-y divide-zinc-800 text-left text-xs font-mono">
                          <thead className="bg-zinc-900/60">
                            <tr>
                              <th className="px-4 py-2 text-zinc-400">Metric</th>
                              <th className="px-4 py-2 text-zinc-200">QuickSort</th>
                              <th className="px-4 py-2 text-zinc-200">MergeSort</th>
                              <th className="px-4 py-2 text-zinc-400">Router Recommendation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            <tr>
                              <td className="px-4 py-2 text-zinc-500 font-bold">Avg Complexity</td>
                              <td className="px-4 py-2 text-emerald-400">$O(n \log n)$</td>
                              <td className="px-4 py-2 text-emerald-400">$O(n \log n)$</td>
                              <td className="px-4 py-2 text-zinc-400">Identical bounds</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 text-zinc-500 font-bold">Worst Complexity</td>
                              <td className="px-4 py-2 text-amber-500">$O(n^2)$</td>
                              <td className="px-4 py-2 text-emerald-400">$O(n \log n)$</td>
                              <td className="px-4 py-2 text-zinc-400">MergeSort is guaranteed</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 text-zinc-500 font-bold">Space Required</td>
                              <td className="px-4 py-2 text-emerald-400">$O(\log n)$ (in-place)</td>
                              <td className="px-4 py-2 text-red-400">$O(n)$ (auxiliary)</td>
                              <td className="px-4 py-2 text-zinc-400">QuickSort is highly efficient</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 text-zinc-500 font-bold">Stable Sort</td>
                              <td className="px-4 py-2 text-zinc-400">No</td>
                              <td className="px-4 py-2 text-emerald-400">Yes</td>
                              <td className="px-4 py-2 text-zinc-400">MergeSort for object data</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Code syntax block */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono px-3 py-1 bg-zinc-900 border-t border-r border-l border-zinc-800 rounded-t-lg">
                          <span>quicksort_lomuto.py</span>
                          <button className="hover:text-white flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            Copy Code
                          </button>
                        </div>
                        <pre className="p-4 rounded-b-lg border-b border-r border-l border-zinc-800 bg-[#060608] text-zinc-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`def quicksort_inplace(arr, low, high):
    if low < high:
        pivot_idx = partition(arr, low, high)
        quicksort_inplace(arr, low, pivot_idx - 1)
        quicksort_inplace(arr, pivot_idx + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`}
                        </pre>
                      </div>

                      {/* Section 4 */}
                      <div className="mt-4 pt-4 border-t border-zinc-800/80">
                        <h4 className="text-sm font-bold text-violet-400 uppercase tracking-wider mb-2">Evaluator Synthesized Consensus</h4>
                        <p className="text-zinc-300 leading-relaxed text-sm">
                          Use <strong>QuickSort</strong> in memory-constrained environments sorting flat types like numbers where stable sorting is not required. Choose <strong>MergeSort</strong> when sorting complex object structures where relative order must be retained, or when a deterministic performance boundary is requested.
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Actions under the answer */}
                  <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(messages[1].content);
                        alert("Consolidated response copied to clipboard!");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-xs text-zinc-400 hover:text-white transition duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                      </svg>
                      Copy Report
                    </button>

                    <button 
                      onClick={handleResetChat}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-xs text-zinc-400 hover:text-white transition duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Rerun Pipeline
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* ==================== BOTTOM INPUT AREA ==================== */}
        <footer className="p-6 border-t border-zinc-800 bg-[#09090b]">
          <div className="max-w-3xl mx-auto relative">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Active Router Focus:</span>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400">Academic Mode</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400">Strict Code Synthesis</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md border border-violet-800/40 bg-violet-950/20 text-violet-400 font-semibold">Postgres Logging</span>
              </div>
            </div>

            {/* Simulated Input form */}
            <div className="relative flex items-center rounded-2xl border border-zinc-800 bg-[#0d0d10] focus-within:border-violet-500/60 transition-all shadow-lg p-2.5 gap-2.5">
              
              <div className="p-1 rounded bg-zinc-800 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                </svg>
              </div>

              <input
                type="text"
                placeholder="Ask ApexRouter (e.g. Compare QuickSort vs MergeSort)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleStartSimulation(searchQuery);
                  }
                }}
                disabled={pipelineState !== "idle" && pipelineState !== "completed"}
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none disabled:text-zinc-500"
              />

              <button
                onClick={() => handleStartSimulation(searchQuery || "Compare the time complexity of QuickSort vs MergeSort with code examples.")}
                disabled={pipelineState !== "idle" && pipelineState !== "completed"}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-violet-500/20 active:scale-95 transition-all disabled:opacity-40"
              >
                Orchestrate
              </button>
            </div>
            
            <p className="text-center text-[10px] text-zinc-500 mt-3 font-mono">
              AES-256 protected BYOK. Output written to Postgres 16 tables.
            </p>
          </div>
        </footer>

      </main>

      {/* ==================== RIGHT COMPARISON PANEL (METRICS & MOCK RESPONSES) ==================== */}
      {rightPanelOpen && (
        <aside className="w-80 border-l border-zinc-800 bg-[#0e0e11] flex flex-col shrink-0 overflow-hidden hidden lg:flex">
          
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-800">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Concurrent metrics inspector</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Promise.allSettled()
            </span>
          </div>

          {/* Model Statistics overview */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/30 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800/80">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Average Latency</p>
              <p className="text-lg font-bold text-white font-mono mt-0.5">
                {pipelineState === "completed" ? (geminiFails ? "1.46s" : "1.30s") : "0.00s"}
              </p>
            </div>
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800/80">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Cost Synthesis</p>
              <p className="text-lg font-bold text-violet-400 font-mono mt-0.5">
                {pipelineState === "completed" ? (geminiFails ? "$0.0094" : "$0.0131") : "$0.00"}
              </p>
            </div>
          </div>

          {/* Model Cards Grid list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {MODELS.map((model) => {
              const isRunning = pipelineState === "running_models";
              const isCompleted = pipelineState === "completed" || pipelineState === "saving" || pipelineState === "evaluating";
              const isFailed = model.id === "gemini" && geminiFails;
              
              // Latency counter values
              const currentLatency = 
                model.id === "openai" ? openaiLatency :
                model.id === "claude" ? claudeLatency :
                geminiLatency;
              
              return (
                <div 
                  key={model.id}
                  onClick={() => setSelectedInspectorModel(model.id)}
                  className={`p-3.5 rounded-xl border bg-zinc-900/40 text-left transition duration-200 cursor-pointer ${
                    selectedInspectorModel === model.id 
                      ? `bg-zinc-900/90 border-violet-500/50 shadow-md ring-1 ring-violet-500/10` 
                      : `border-zinc-800 hover:bg-zinc-900/60`
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${model.avatarColor}`} />
                      <span className="text-xs font-bold text-white">{model.name}</span>
                    </div>

                    {/* Status badges */}
                    {isFailed ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/40 border border-red-500/30 text-red-400 font-bold uppercase font-mono">
                        Failed
                      </span>
                    ) : isRunning && currentLatency > 0 && currentLatency < model.defaultLatency ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-950/40 border border-violet-500/30 text-violet-400 font-bold uppercase font-mono animate-pulse">
                        Running
                      </span>
                    ) : isCompleted ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold uppercase font-mono">
                        Success
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 font-mono">
                        Idle
                      </span>
                    )}
                  </div>

                  {/* Metrics subgrid */}
                  <div className="grid grid-cols-3 gap-1 py-1.5 border-t border-b border-zinc-800/80 my-2 text-[10px] font-mono text-zinc-400">
                    <div>
                      <p className="text-[8px] text-zinc-500 font-sans uppercase">Latency</p>
                      <p className="font-bold text-zinc-200">
                        {isCompleted && !isFailed ? `${model.defaultLatency}s` : isFailed ? "—" : currentLatency > 0 ? `${currentLatency}s` : "0.0s"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-500 font-sans uppercase">Tokens</p>
                      <p className="font-bold text-zinc-200">
                        {isCompleted && !isFailed ? model.defaultTokens : isFailed ? "—" : isRunning ? "Counting" : "0"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-500 font-sans uppercase">Cost Est.</p>
                      <p className="font-bold text-zinc-200">
                        {isCompleted && !isFailed ? `$${model.defaultCost.toFixed(5)}` : isFailed ? "$0.00" : "$0.00"}
                      </p>
                    </div>
                  </div>

                  {/* Strengths / Status description */}
                  <p className="text-[11px] text-zinc-500 mt-1">
                    <span className="text-zinc-400 font-semibold">Specialty:</span> {model.strength}
                  </p>

                </div>
              );
            })}

          </div>

          {/* Model Raw Inspector Tab viewer */}
          <div className="h-64 border-t border-zinc-800 flex flex-col bg-[#0b0b0d]">
            
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60 bg-[#09090b] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Raw Response Inspector</span>
              <span className="font-mono text-violet-400">
                {MODELS.find(m => m.id === selectedInspectorModel)?.name || "Select Model"}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] text-zinc-400 leading-normal scrollbar-thin bg-zinc-950/40 select-all">
              {pipelineState === "completed" || pipelineState === "saving" || pipelineState === "evaluating" ? (
                selectedInspectorModel === "gemini" && geminiFails ? (
                  <span className="text-red-400 font-bold">{MODELS.find(m => m.id === selectedInspectorModel)?.failedResponse}</span>
                ) : (
                  <pre className="whitespace-pre-wrap">{MODELS.find(m => m.id === selectedInspectorModel)?.rawResponse}</pre>
                )
              ) : (
                <span className="italic text-zinc-600">Raw individual provider text is shown here during execution trace. Click any model card to inspect.</span>
              )}
            </div>

          </div>

        </aside>
      )}

      {/* ==================== BYOK CREDENTIALS MODAL ==================== */}
      {keysModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0e0e11] p-6 shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                  🔒
                </div>
                <h3 className="text-base font-bold text-white">Manage BYOK Credentials</h3>
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

            {/* Warning block about key security */}
            <div className="p-3 rounded-xl border border-violet-800/20 bg-violet-950/10 text-xs text-violet-300">
              <p className="font-semibold mb-1">AES-256 Transit Protection</p>
              Your keys are never stored on a centralized server. They are encrypted in-browser using standard AES-256 and sent securely in header envelopes directly to model adapters.
            </div>

            {/* Inputs */}
            <div className="space-y-4 text-left">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">OpenAI API Key</label>
                <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
                  <span className="text-zinc-600 text-xs font-mono mr-2">sk-proj-</span>
                  <input
                    type="password"
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                    className="flex-1 bg-transparent text-xs font-mono text-zinc-300 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Anthropic Claude API Key</label>
                <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
                  <span className="text-zinc-600 text-xs font-mono mr-2">sk-ant-</span>
                  <input
                    type="password"
                    value={apiKeys.claude}
                    onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
                    className="flex-1 bg-transparent text-xs font-mono text-zinc-300 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Google Gemini API Key</label>
                <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
                  <span className="text-zinc-600 text-xs font-mono mr-2">AIzaSy-</span>
                  <input
                    type="password"
                    value={apiKeys.gemini}
                    onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                    className="flex-1 bg-transparent text-xs font-mono text-zinc-300 outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Save Buttons */}
            <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setKeysModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setKeysModalOpen(false);
                  alert("Keys successfully encrypted with AES-256 and committed to local mock database!");
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-500/20 transition duration-200"
              >
                Encrypt & Save Keys
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
