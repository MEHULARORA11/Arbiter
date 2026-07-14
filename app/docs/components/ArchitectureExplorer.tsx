"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NodeData {
  id: string;
  title: string;
  files: string[];
  description: string;
  icon: string;
  badge: string;
  mechanics: string[];
}

const MODULES: NodeData[] = [
  {
    id: "client",
    title: "Client UI & Stream Orchestration",
    badge: "Frontend",
    icon: "🌐",
    files: ["app/page.tsx", "lib/client/authFetch.ts"],
    description:
      "The client-side single page app. It manages chat histories, provider/model selection state, and coordinates with credentials configurations. When a query is submitted, it opens a connection and parses SSE events in real-time.",
    mechanics: [
      "Uses custom consumeOrchestratorStream to parse SSE data stream buffers.",
      "Handles local guest sessions using sessionStorage (discarded on tab close).",
      "Performs transparent OAuth session token refresh via authFetch wrapper when a 401 Unauthorized error is caught.",
    ],
  },
  {
    id: "api",
    title: "Next.js API routes",
    badge: "Router",
    icon: "⚙️",
    files: [
      "app/api/chats/route.ts",
      "app/api/chats/[chatId]/message/route.ts",
      "app/api/credentials/route.ts",
      "app/api/auth/*",
    ],
    description:
      "Stateless HTTP handlers that act as the interface between the client and backend subsystems. Protects database queries with JWT session validation.",
    mechanics: [
      "Validates input payloads using Zod schemas.",
      "Handles session state cookies and refresh tokens dynamically.",
      "Parses multi-part actions like bulk importing guest chats into PostgreSQL.",
    ],
  },
  {
    id: "orchestrator",
    title: "Orchestration Pipeline",
    badge: "Core",
    icon: "🔀",
    files: [
      "lib/orchestrator/runPipeline.ts",
      "lib/orchestrator/sse.ts",
      "lib/orchestrator/rateLimiter.ts",
    ],
    description:
      "The central execution controller. It receives messages, resolves candidate workers, spins up concurrent adapter streams, and pipelines results into an evaluator synthesis step.",
    mechanics: [
      "Fans out up to 5 worker threads concurrently using Promise.all.",
      "Streams partial worker chunks immediately using SSE event formats.",
      "Checks sliding window rate limits (20 requests per minute) in-memory before pipeline startup.",
    ],
  },
  {
    id: "adapters",
    title: "Provider Adapters",
    badge: "Adapters",
    icon: "🔌",
    files: [
      "lib/agents/types.ts",
      "lib/agents/registry.ts",
      "lib/agents/openai.ts",
      "lib/agents/claude.ts",
      "lib/agents/gemini.ts",
      "lib/agents/deepseek.ts",
      "lib/agents/mistral.ts",
    ],
    description:
      "Implements the AgentAdapter interface, translating raw vendor API models into a unified stream delta format. Decouples the orchestrator from model specific details.",
    mechanics: [
      "Declares the standard streamWorker, streamEvaluator, and runTitle interface methods.",
      "Adapts proprietary stream shapes (e.g. Anthropic cache headers vs. OpenAI prompt_tokens_details).",
      "Aggregates latency, cache hits, time-to-first-token (TTFT) metrics, and token usage.",
    ],
  },
  {
    id: "llms",
    title: "External LLM Providers",
    badge: "External",
    icon: "🤖",
    files: ["OpenAI API", "Anthropic Claude API", "Google Gemini API", "DeepSeek API", "Mistral API"],
    description:
      "External proprietary model gateways. Requests are authenticated using either user-owned custom API keys (BYOK) or system-level keys.",
    mechanics: [
      "Requires TLS-encrypted HTTPS connections.",
      "Subject to model-specific context window constraints and raw pricing structures.",
    ],
  },
  {
    id: "database",
    title: "Postgres Database & Schema",
    badge: "Database",
    icon: "🗄️",
    files: ["db/schema.ts", "db/queries/users.ts", "db/index.ts"],
    description:
      "Relational data store managed using Drizzle ORM. Stores credentials, profiles, conversation lines, and granular telemetry reports.",
    mechanics: [
      "api_credentials stores GCM-encrypted API keys along with their IV and authentication tag.",
      "message_model_runs tracks cached token counts, latency, and TTFT for every LLM invocation.",
      "Uses cascade deletes on userId and chatId to ensure clean garbage collection.",
    ],
  },
];

export default function ArchitectureExplorer() {
  const [selectedId, setSelectedId] = useState<string>("client");

  const currentModule = MODULES.find((m) => m.id === selectedId) || MODULES[0];

  return (
    <div className="flex flex-col gap-6 w-full my-6 bg-bg-surface-raised border border-border-subtle rounded-xl p-4 sm:p-6">
      
      {/* Visual Header / Instructions */}
      <div>
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <span>🏗️</span> Interactive System Architecture Explorer
        </h3>
        <p className="text-[11px] text-text-secondary mt-1">
          Select any block in the pipeline to inspect directories, files, and underlying execution mechanics.
        </p>
      </div>

      {/* Grid Flow Layout - Desktop: Horizontal Flow, Mobile: Accordion list */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Desktop Pipeline Flow / Mobile Selector Stack */}
        <div className="flex-1 flex flex-col gap-3">
          
          {/* Desktop flow connections view (Grid layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {MODULES.map((mod) => {
              const isSelected = mod.id === selectedId;
              let badgeColor = "bg-bg-base text-text-secondary border-border-subtle";
              if (mod.id === "client") badgeColor = "bg-accent-primary/10 text-accent-primary border-accent-primary/20";
              else if (mod.id === "llms") badgeColor = "bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20";
              else if (mod.id === "database") badgeColor = "bg-status-info-bg/10 text-status-info border-status-info/20";

              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedId(mod.id)}
                  className={`flex flex-col text-left p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-bg-surface border-white shadow-glow"
                      : "bg-bg-base/60 border-border-subtle hover:border-border-strong/50 hover:bg-bg-base"
                  }`}
                >
                  <div className="flex justify-between items-start w-full gap-2 mb-2">
                    <span className="text-xl select-none">{mod.icon}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeColor}`}>
                      {mod.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-text-primary leading-tight truncate w-full">
                    {mod.title}
                  </h4>
                  <p className="text-[10px] text-text-tertiary font-mono truncate w-full mt-1.5">
                    {mod.files[0]}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Connective pipeline labels */}
          <div className="hidden lg:flex items-center justify-between px-2.5 py-2 rounded-lg bg-bg-base/40 border border-border-subtle/50 text-[10px] font-mono text-text-tertiary">
            <span className="flex items-center gap-1">🌐 Client <span className="text-accent-primary">➔</span> ⚙️ API</span>
            <span className="flex items-center gap-1">⚙️ API <span className="text-accent-primary">➔</span> 🔀 Pipeline</span>
            <span className="flex items-center gap-1">🔀 Pipeline <span className="text-accent-primary">➔</span> 🔌 Adapters</span>
            <span className="flex items-center gap-1">🔌 Adapters <span className="text-accent-secondary">➔</span> 🤖 LLMs</span>
          </div>
        </div>

        {/* Dynamic Detail Panel (Responsive & transitions) */}
        <div className="w-full lg:w-80 shrink-0 border border-border-subtle rounded-lg bg-bg-surface p-5 min-h-[360px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModule.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl select-none">{currentModule.icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-text-primary leading-tight">
                    {currentModule.title}
                  </h4>
                  <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-wide">
                    {currentModule.badge} Subsystem
                  </span>
                </div>
              </div>

              {/* Files list */}
              <div className="flex flex-wrap gap-1 mb-4 border-b border-border-subtle/50 pb-3">
                {currentModule.files.map((file) => (
                  <span
                    key={file}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-bg-base border border-border-subtle font-mono text-text-secondary truncate max-w-full"
                    title={file}
                  >
                    {file}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-xs text-text-secondary leading-relaxed mb-5">
                {currentModule.description}
              </p>

              {/* Mechanics list */}
              <div className="mt-auto">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2.5">
                  Execution Mechanics
                </h5>
                <ul className="space-y-2">
                  {currentModule.mechanics.map((mech, idx) => (
                    <li key={idx} className="flex gap-2 text-xs leading-relaxed text-text-secondary">
                      <span className="text-accent-primary select-none font-bold mt-0.5">✦</span>
                      <span>{mech}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
