"use client";

import React from "react";
import Link from "next/link";

export default function DocsOverviewPage() {
  return (
    <div className="prose-markdown max-w-3xl">
      <div className="border-b border-border-subtle pb-6 mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
          System Overview
        </h1>
        <p className="text-sm text-text-secondary">
          Welcome to the Arbiter system documentation. Written by engineers, for engineers. No marketing fluff, no AI-generated filler.
        </p>
      </div>

      <p className="text-sm leading-relaxed text-text-secondary">
        We built Arbiter to solve a simple but frustrating problem: LLMs are highly volatile, opinionated, and prone to silent failures. Fanning queries across multiple LLM providers simultaneously and dynamically synthesizing their outputs is the only way to get reliable, balanced responses.
      </p>

      <p className="text-sm leading-relaxed text-text-secondary mt-4">
        At its core, Arbiter is a <strong>multi-model LLM router, evaluator, and telemetry tracker</strong>. The system takes a single user prompt, fans it out to multiple models concurrently, feeds their individual streams into an evaluation agent, and delivers a unified, high-quality response.
      </p>

      <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Core Pillars</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-4 rounded-lg border border-border-subtle bg-bg-surface">
          <h3 className="text-xs font-bold text-accent-primary uppercase tracking-wider mb-2">Fanned Execution</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Run N models concurrently (OpenAI, Claude, Gemini, DeepSeek, Mistral) in parallel threads. We record time-to-first-token (TTFT) and latency metrics for every single worker.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border-subtle bg-bg-surface">
          <h3 className="text-xs font-bold text-model-claude uppercase tracking-wider mb-2">Evaluator Synthesis</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Feed fanned worker responses into a single evaluator agent (like Claude Sonnet 5). The evaluator acts as a referee, highlighting contradictions and outputting a comprehensive synthesis.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border-subtle bg-bg-surface">
          <h3 className="text-xs font-bold text-model-openai uppercase tracking-wider mb-2">Dynamic Cryptography</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Supports Bring Your Own Key (BYOK). Keys are encrypted locally using AES-256-GCM before writing to Postgres, decrypted only inside the session pipeline, and never stored in plain text.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border-subtle bg-bg-surface">
          <h3 className="text-xs font-bold text-model-mistral uppercase tracking-wider mb-2">Token-Level Telemetry</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Granular cost tracking pulling directly from official pricing logs. We calculate costs including cache read/write rates and tiered context bounds, storing results in Postgres.
          </p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Quick Navigation</h2>
      <p className="text-sm leading-relaxed text-text-secondary mb-4">
        To understand the technical design and boundaries, proceed through the following sections:
      </p>

      <ul className="space-y-2 text-xs text-text-secondary">
        <li>
          <Link href="/docs/architecture" className="text-accent-primary hover:underline">
            ⬡ System Architecture
          </Link>{" "}
          — View the high-level interactive node graph and component directories.
        </li>
        <li>
          <Link href="/docs/auth" className="text-accent-primary hover:underline">
            ⬥ OAuth & Sessions
          </Link>{" "}
          — Trace the Google PKCE callback and automatic transparent refresh flows.
        </li>
        <li>
          <Link href="/docs/guest-mode" className="text-accent-primary hover:underline">
            ◎ Guest vs. Logged-In Mode
          </Link>{" "}
          — Understand storage scopes (sessionStorage vs. Postgres) and rate limits.
        </li>
        <li>
          <Link href="/docs/orchestration" className="text-accent-primary hover:underline">
            ⟳ SSE Orchestration Pipeline
          </Link>{" "}
          — Simulate the streaming chunk sequence and done telemetry events.
        </li>
        <li>
          <Link href="/docs/adapters" className="text-accent-primary hover:underline">
            ◆ Provider Adapters
          </Link>{" "}
          — Examine the <code>AgentAdapter</code> contract and provider mappings.
        </li>
        <li>
          <Link href="/docs/data-model" className="text-accent-primary hover:underline">
            ◉ Database Data Model
          </Link>{" "}
          — Walk the Drizzle table schemas and entity relation linkages.
        </li>
        <li>
          <Link href="/docs/pricing" className="text-accent-primary hover:underline">
            ◇ Cost & Pricing
          </Link>{" "}
          — Deconstruct the caching math and context tier computations.
        </li>
      </ul>

      <div className="mt-10 p-4 rounded-lg bg-status-info-bg/10 border border-status-info/20 text-xs text-text-secondary flex gap-3">
        <span className="text-status-info text-base select-none mt-0.5">ℹ</span>
        <div>
          <strong>Looking for the application logic?</strong> The main client dashboard is located in the app root directory. You can return by clicking the &ldquo;Back to App&rdquo; button in the header.
        </div>
      </div>
    </div>
  );
}
