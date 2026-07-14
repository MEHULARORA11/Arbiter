"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SseEvent {
  id: number;
  event: string;
  data: string;
  description: string;
  type: "system" | "worker" | "evaluator" | "summary";
}

export default function SseSimulator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<SseEvent[]>([]);
  const [pipelineMode, setPipelineMode] = useState<"fanned" | "single">("fanned");
  
  // Simulated stats
  const [openaiTokens, setOpenaiTokens] = useState("");
  const [mistralTokens, setMistralTokens] = useState("");
  const [evaluatorTokens, setEvaluatorTokens] = useState("");
  
  const [costUsd, setCostUsd] = useState("0.000000");
  const [accumulatedLatency, setAccumulatedLatency] = useState(0);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const resetSimulation = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
    setCurrentStep(0);
    setLogs([]);
    setOpenaiTokens("");
    setMistralTokens("");
    setEvaluatorTokens("");
    setCostUsd("0.000000");
    setAccumulatedLatency(0);
  };

  const stepsFanned = [
    {
      event: "worker_start",
      data: { provider: "openai", modelId: "gpt-5.4" },
      description: "OpenAI worker initiated. Starting stream execution.",
      type: "worker",
      action: () => {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "worker_start",
            data: JSON.stringify({ provider: "openai", modelId: "gpt-5.4" }),
            description: "OpenAI GPT-5.4 worker starts streaming.",
            type: "worker",
          },
        ]);
      },
    },
    {
      event: "worker_start",
      data: { provider: "mistral", modelId: "mistral-large-latest" },
      description: "Mistral worker initiated. Starting stream execution.",
      type: "worker",
      action: () => {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            event: "worker_start",
            data: JSON.stringify({ provider: "mistral", modelId: "mistral-large-latest" }),
            description: "Mistral Large 3 worker starts streaming concurrently.",
            type: "worker",
          },
        ]);
      },
    },
    // Chunks delta simulation
    {
      event: "worker_delta",
      data: { provider: "openai", delta: "QuickSort " },
      description: "Delta chunk received from OpenAI.",
      type: "worker",
      action: () => {
        setOpenaiTokens("QuickSort average O(n log n) partition speed.");
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "worker_delta",
            data: JSON.stringify({ provider: "openai", delta: "QuickSort..." }),
            description: "OpenAI streams tokens: 'QuickSort...'",
            type: "worker",
          },
        ]);
      },
    },
    {
      event: "worker_delta",
      data: { provider: "mistral", delta: "MergeSort " },
      description: "Delta chunk received from Mistral.",
      type: "worker",
      action: () => {
        setMistralTokens("MergeSort stable division, auxiliary O(n) space.");
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "worker_delta",
            data: JSON.stringify({ provider: "mistral", delta: "MergeSort..." }),
            description: "Mistral streams tokens: 'MergeSort...'",
            type: "worker",
          },
        ]);
      },
    },
    // Worker complete events
    {
      event: "worker_done",
      data: { provider: "openai", modelId: "gpt-5.4", inputTokens: 140, cachedInputTokens: 0, outputTokens: 85, latencyMs: 380, ttftMs: 95 },
      description: "OpenAI stream completed.",
      type: "worker",
      action: () => {
        setCostUsd((prev) => (parseFloat(prev) + 0.001625).toFixed(6)); // Cost: (140 * 2.5 + 85 * 15) / 1,000,000 = 0.00035 + 0.001275 = 0.001625
        setAccumulatedLatency((prev) => Math.max(prev, 380));
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "worker_done",
            data: JSON.stringify({
              provider: "openai",
              modelId: "gpt-5.4",
              inputTokens: 140,
              cachedInputTokens: 0,
              outputTokens: 85,
              latencyMs: 380,
              ttftMs: 95,
              status: "success",
            }),
            description: "OpenAI worker done. Latency: 380ms, TTFT: 95ms. Used 225 tokens.",
            type: "worker",
          },
        ]);
      },
    },
    {
      event: "worker_done",
      data: { provider: "mistral", modelId: "mistral-large-latest", inputTokens: 140, cachedInputTokens: 0, outputTokens: 90, latencyMs: 440, ttftMs: 110 },
      description: "Mistral stream completed.",
      type: "worker",
      action: () => {
        setCostUsd((prev) => (parseFloat(prev) + 0.000205).toFixed(6)); // Cost: (140 * 0.5 + 90 * 1.5) / 1,000,000 = 0.00007 + 0.000135 = 0.000205
        setAccumulatedLatency((prev) => Math.max(prev, 440));
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "worker_done",
            data: JSON.stringify({
              provider: "mistral",
              modelId: "mistral-large-latest",
              inputTokens: 140,
              cachedInputTokens: 0,
              outputTokens: 90,
              latencyMs: 440,
              ttftMs: 110,
              status: "success",
            }),
            description: "Mistral worker done. Latency: 440ms, TTFT: 110ms. Used 230 tokens.",
            type: "worker",
          },
        ]);
      },
    },
    // Evaluator start
    {
      event: "evaluator_start",
      data: { provider: "claude", modelId: "claude-sonnet-5" },
      description: "Evaluator initiated. Synthesizing worker candidate answers.",
      type: "evaluator",
      action: () => {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "evaluator_start",
            data: JSON.stringify({ provider: "claude", modelId: "claude-sonnet-5" }),
            description: "Claude Sonnet 5 Evaluator begins synthesis parsing.",
            type: "evaluator",
          },
        ]);
      },
    },
    // Evaluator deltas
    {
      event: "evaluator_delta",
      data: { delta: "Synthesis: QuickSort is faster in-place, but unstable. MergeSort is stable, requiring extra space." },
      description: "Evaluator synthesis delta text streaming.",
      type: "evaluator",
      action: () => {
        setEvaluatorTokens(
          "Synthesis: QuickSort partitions in-place, yielding excellent CPU cache locality. MergeSort provides stable divisions, essential for indexed objects."
        );
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "evaluator_delta",
            data: JSON.stringify({ delta: "Synthesis: QuickSort is..." }),
            description: "Evaluator streams: 'Synthesis: QuickSort is...'",
            type: "evaluator",
          },
        ]);
      },
    },
    // Evaluator done
    {
      event: "evaluator_done",
      data: { provider: "claude", modelId: "claude-sonnet-5", inputTokens: 560, cachedInputTokens: 120, outputTokens: 110, latencyMs: 650, ttftMs: 120 },
      description: "Evaluator execution done.",
      type: "evaluator",
      action: () => {
        setCostUsd((prev) => (parseFloat(prev) + 0.002004).toFixed(6)); // Cost: (440 * 2.0 + 120 * 0.20 + 110 * 10) / 1M = (880 + 24 + 1100)/1M = 0.002004
        setAccumulatedLatency((prev) => prev + 650);
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "evaluator_done",
            data: JSON.stringify({
              provider: "claude",
              modelId: "claude-sonnet-5",
              inputTokens: 560,
              cachedInputTokens: 120,
              outputTokens: 110,
              latencyMs: 650,
              ttftMs: 120,
            }),
            description: "Claude Evaluator done. Latency: 650ms, TTFT: 120ms. Used 670 tokens (120 cache read hits).",
            type: "evaluator",
          },
        ]);
      },
    },
    // Final structures
    {
      event: "final_message",
      data: { messageId: "chat-uuid-1", content: "...", producedByModel: "claude-sonnet-5", producedByRole: "evaluator" },
      description: "Assistant final payload resolved.",
      type: "system",
      action: () => {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "final_message",
            data: JSON.stringify({
              messageId: "chat-uuid-1",
              producedByModel: "claude-sonnet-5",
              producedByRole: "evaluator",
            }),
            description: "Final message saved to DB under Claude attribution.",
            type: "system",
          },
        ]);
      },
    },
    {
      event: "usage_summary",
      data: { chat: { inputTokens: 840, outputTokens: 285, costUsd: "0.003834" } },
      description: "Orchestration pipeline output telemetry complete.",
      type: "summary",
      action: () => {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "usage_summary",
            data: JSON.stringify({
              chat: { inputTokens: 840, outputTokens: 285, costUsd: "0.003834" },
            }),
            description: "Telemetric calculations completed. Pipeline shut down successfully.",
            type: "summary",
          },
        ]);
      },
    },
  ];

  const stepsSingle = [
    {
      event: "worker_start",
      data: { provider: "openai", modelId: "gpt-5.4" },
      description: "OpenAI worker initiated. Starting stream execution.",
      type: "worker",
      action: () => {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "worker_start",
            data: JSON.stringify({ provider: "openai", modelId: "gpt-5.4" }),
            description: "OpenAI GPT-5.4 worker starts streaming.",
            type: "worker",
          },
        ]);
      },
    },
    {
      event: "worker_delta",
      data: { provider: "openai", delta: "QuickSort " },
      description: "Delta chunk received from OpenAI.",
      type: "worker",
      action: () => {
        setOpenaiTokens("QuickSort average O(n log n) partition speed.");
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "worker_delta",
            data: JSON.stringify({ provider: "openai", delta: "QuickSort partition logic." }),
            description: "OpenAI streams tokens: 'QuickSort...'",
            type: "worker",
          },
        ]);
      },
    },
    {
      event: "worker_done",
      data: { provider: "openai", modelId: "gpt-5.4", inputTokens: 140, cachedInputTokens: 0, outputTokens: 85, latencyMs: 380, ttftMs: 95 },
      description: "OpenAI stream completed.",
      type: "worker",
      action: () => {
        setCostUsd((140 * 0.0025 + 85 * 0.0150 / 1000).toFixed(6)); // Fallback cost calc
        setCostUsd("0.001625");
        setAccumulatedLatency(380);
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "worker_done",
            data: JSON.stringify({
              provider: "openai",
              modelId: "gpt-5.4",
              inputTokens: 140,
              cachedInputTokens: 0,
              outputTokens: 85,
              latencyMs: 380,
              ttftMs: 95,
              status: "success",
            }),
            description: "OpenAI worker done. Latency: 380ms, TTFT: 95ms. Used 225 tokens.",
            type: "worker",
          },
        ]);
      },
    },
    {
      event: "final_message",
      data: { messageId: "chat-uuid-2", content: "...", producedByModel: "gpt-5.4", producedByRole: "worker" },
      description: "Assistant final payload resolved.",
      type: "system",
      action: () => {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "final_message",
            data: JSON.stringify({
              messageId: "chat-uuid-2",
              producedByModel: "gpt-5.4",
              producedByRole: "worker",
            }),
            description: "Final message saved to DB under OpenAI worker result directly (evaluator skipped).",
            type: "system",
          },
        ]);
      },
    },
    {
      event: "usage_summary",
      data: { chat: { inputTokens: 140, outputTokens: 85, costUsd: "0.001625" } },
      description: "Orchestration pipeline output telemetry complete.",
      type: "summary",
      action: () => {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now(),
            event: "usage_summary",
            data: JSON.stringify({
              chat: { inputTokens: 140, outputTokens: 85, costUsd: "0.001625" },
            }),
            description: "Telemetric calculations completed. Pipeline shut down successfully.",
            type: "summary",
          },
        ]);
      },
    },
  ];

  const steps = pipelineMode === "fanned" ? stepsFanned : stepsSingle;

  const runNextStep = (stepIndex: number) => {
    if (stepIndex >= steps.length) {
      setIsPlaying(false);
      return;
    }

    steps[stepIndex].action();
    setCurrentStep(stepIndex + 1);

    // Schedule next step
    timerRef.current = setTimeout(() => {
      runNextStep(stepIndex + 1);
    }, 1200);
  };

  const startSimulation = () => {
    resetSimulation();
    setIsPlaying(true);
    // Queue first step
    timerRef.current = setTimeout(() => {
      runNextStep(0);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-6 w-full border border-border-subtle rounded-xl overflow-hidden bg-bg-surface-raised p-5">
      {/* Controls & Sim settings */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">SSE Event Stream Orchestrator Simulator</h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Visualize server-to-client chunk flows and Drizzle transaction commits.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <select
            value={pipelineMode}
            onChange={(e) => {
              setPipelineMode(e.target.value as "fanned" | "single");
              resetSimulation();
            }}
            disabled={isPlaying}
            className="bg-bg-base border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary font-medium focus:outline-none focus:border-accent-primary w-full sm:w-auto"
          >
            <option value="fanned">Concurreny Workers + Evaluator Mode</option>
            <option value="single">Single Direct Worker Mode</option>
          </select>

          <div className="flex gap-2 w-full sm:w-auto">
            {isPlaying ? (
              <button
                onClick={resetSimulation}
                className="flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold border border-status-error text-status-error hover:bg-status-error-bg/10 transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={startSimulation}
                className="flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold bg-accent-primary text-bg-base hover:bg-accent-primary-hover transition-all duration-150 cursor-pointer shadow-glow"
              >
                Simulate Message
              </button>
            )}
            <button
              onClick={resetSimulation}
              disabled={isPlaying && logs.length === 0}
              className="px-3 py-1.5 rounded-md text-xs font-bold border border-border-subtle text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Visual Token Output Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* OpenAI Box */}
        <div className="bg-bg-base rounded-lg border border-border-subtle p-4 flex flex-col min-h-[110px]">
          <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2 mb-2">
            <span className="text-[11px] font-bold text-model-openai uppercase tracking-wide">OpenAI Worker</span>
            {isPlaying && currentStep > 0 && currentStep <= (pipelineMode === "fanned" ? 5 : 3) && (
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-ping" />
            )}
          </div>
          <div className="flex-1 text-xs font-mono text-text-secondary leading-relaxed break-words whitespace-pre-wrap">
            {openaiTokens || <span className="text-text-tertiary italic">Waiting for connection...</span>}
          </div>
        </div>

        {/* Mistral Box */}
        <div
          className={`bg-bg-base rounded-lg border border-border-subtle p-4 flex flex-col min-h-[110px] transition-all duration-200 ${
            pipelineMode === "single" ? "opacity-30 pointer-events-none" : ""
          }`}
        >
          <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2 mb-2">
            <span className="text-[11px] font-bold text-model-mistral uppercase tracking-wide">Mistral Worker</span>
            {isPlaying && currentStep > 1 && currentStep <= 6 && pipelineMode === "fanned" && (
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-ping" />
            )}
          </div>
          <div className="flex-1 text-xs font-mono text-text-secondary leading-relaxed break-words whitespace-pre-wrap">
            {pipelineMode === "single" ? (
              <span className="text-text-tertiary italic">Disabled in single worker mode</span>
            ) : mistralTokens || (
              <span className="text-text-tertiary italic">Waiting for connection...</span>
            )}
          </div>
        </div>

        {/* Evaluator Box */}
        <div
          className={`bg-bg-base rounded-lg border border-border-subtle p-4 flex flex-col min-h-[110px] transition-all duration-200 ${
            pipelineMode === "single" ? "opacity-30 pointer-events-none" : ""
          }`}
        >
          <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2 mb-2">
            <span className="text-[11px] font-bold text-model-claude uppercase tracking-wide">Claude Evaluator</span>
            {isPlaying && currentStep > 6 && currentStep <= 9 && pipelineMode === "fanned" && (
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-ping" />
            )}
          </div>
          <div className="flex-1 text-xs font-mono text-text-secondary leading-relaxed break-words whitespace-pre-wrap">
            {pipelineMode === "single" ? (
              <span className="text-text-tertiary italic">Disabled in single worker mode</span>
            ) : evaluatorTokens || (
              <span className="text-text-tertiary italic">Waiting for worker streams...</span>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex flex-col bg-bg-base border border-border-subtle rounded-lg overflow-hidden font-mono text-[11px] leading-relaxed">
        {/* Terminal Header */}
        <div className="bg-bg-surface px-4 py-2 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-error-bg border border-status-error/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-status-warning-bg border border-status-warning/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-status-success-bg border border-status-success/40" />
            <span className="text-text-secondary text-[10px] ml-2 select-none">SSE RAW EVENT STREAM PROTOCOL LOGS</span>
          </div>
          <div className="flex gap-4 text-[10px] text-text-tertiary">
            <span>COST: <strong className="text-accent-primary font-mono font-bold">${costUsd}</strong></span>
            <span>LATENCY: <strong className="text-text-primary font-mono">{accumulatedLatency}ms</strong></span>
          </div>
        </div>

        {/* Log body */}
        <div className="h-60 overflow-y-auto p-4 flex flex-col gap-3 font-mono">
          <AnimatePresence initial={false}>
            {logs.map((log) => {
              let tagColor = "text-text-tertiary bg-bg-surface-raised border border-border-subtle";
              if (log.type === "worker") tagColor = "text-accent-primary bg-accent-primary/5 border border-accent-primary/20";
              else if (log.type === "evaluator") tagColor = "text-model-claude bg-model-claude/5 border border-model-claude/20";
              else if (log.type === "summary") tagColor = "text-status-success bg-status-success-bg/10 border border-status-success/20";

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-1.5 border-l-2 border-border-subtle pl-3.5 py-0.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${tagColor}`}>
                      event: {log.event}
                    </span>
                    <span className="text-text-secondary font-sans leading-none">{log.description}</span>
                  </div>
                  <div className="text-text-tertiary font-mono text-[10px] select-all bg-bg-surface/30 p-1.5 rounded border border-border-subtle/30 overflow-x-auto whitespace-nowrap">
                    data: {log.data}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {logs.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-text-tertiary select-none italic text-xs">
              Click &quot;Simulate Message&quot; above to trace chunk logs.
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
