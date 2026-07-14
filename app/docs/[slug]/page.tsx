"use client";

import React, { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArchitectureExplorer from "../components/ArchitectureExplorer";
import SseSimulator from "../components/SseSimulator";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = React.useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-border-subtle bg-bg-base">
      <div className="flex items-center justify-between px-4 py-1.5 bg-bg-surface border-b border-border-subtle text-[11px] font-mono text-text-secondary select-none">
        <span>{language}</span>
        <button
          onClick={copyToClipboard}
          className="hover:text-text-primary transition-colors cursor-pointer"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-text-secondary">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function DocSlugPage({ params }: PageProps) {
  const { slug } = use(params);

  switch (slug) {
    case "architecture":
      return (
        <div className="prose-markdown max-w-3xl">
          <div className="border-b border-border-subtle pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
              System Architecture
            </h1>
            <p className="text-sm text-text-secondary">
              A high-level view of Arbiter request distribution, API routing, and backend telemetry.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            Arbiter runs entirely as a serverless Next.js 16 application. There are no persistent background daemons orchestrating streams; instead, Next.js dynamic Edge/API routes handle client fetch requests, decrypt keys on the fly, trigger concurrent vendor requests, stream response deltas back to the client using Server-Sent Events (SSE), and write transactions to a Postgres database.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Request Flow Lifecycle</h2>
          <p className="text-sm leading-relaxed text-text-secondary mb-4">
            The flowchart below illustrates the request-response lifecycle from the client UI down to the vendor models and back. Notice that user API keys are retrieved from the database, decrypted in memory using AES-GCM, and immediately piped into outbound streams, preventing plain-text leakage.
          </p>

          {/* SVG Excalidraw-Style Architecture Diagram */}
          <div className="w-full flex flex-col items-center my-6 p-4 rounded-lg bg-bg-surface border border-border-subtle">
            <div className="w-full overflow-x-auto scrollbar-thin">
              <svg width="680" height="260" viewBox="0 0 680 260" fill="none" className="min-w-[600px] mx-auto">
                {/* Hand-drawn style boxes */}
                {/* Client UI */}
                <rect x="20" y="70" width="120" height="70" rx="8" fill="var(--bg-base)" stroke="var(--accent-primary)" strokeWidth="2" strokeDasharray="3 2" />
                <text x="80" y="100" fill="var(--accent-primary)" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">Client UI</text>
                <text x="80" y="120" fill="var(--text-tertiary)" fontSize="10" fontFamily="monospace" textAnchor="middle">app/page.tsx</text>

                {/* API Route */}
                <rect x="200" y="70" width="120" height="70" rx="8" fill="var(--bg-base)" stroke="var(--text-primary)" strokeWidth="2" />
                <text x="260" y="100" fill="var(--text-primary)" fontSize="12" fontFamily="monospace" textAnchor="middle">API Endpoint</text>
                <text x="260" y="120" fill="var(--text-tertiary)" fontSize="9" fontFamily="monospace" textAnchor="middle">/api/chats/[id]/msg</text>

                {/* Orchestrator */}
                <rect x="380" y="70" width="120" height="70" rx="8" fill="var(--bg-base)" stroke="var(--text-primary)" strokeWidth="2" />
                <text x="440" y="100" fill="var(--text-primary)" fontSize="12" fontFamily="monospace" textAnchor="middle">Orchestrator</text>
                <text x="440" y="120" fill="var(--text-tertiary)" fontSize="10" fontFamily="monospace" textAnchor="middle">runPipeline.ts</text>

                {/* Database */}
                <rect x="200" y="180" width="120" height="60" rx="8" fill="var(--bg-base)" stroke="var(--text-secondary)" strokeWidth="1.5" />
                <text x="260" y="210" fill="var(--text-secondary)" fontSize="11" fontFamily="monospace" textAnchor="middle">Database (Pg)</text>
                <text x="260" y="225" fill="var(--text-tertiary)" fontSize="9" fontFamily="monospace" textAnchor="middle">Drizzle ORM</text>

                {/* LLM Vendors */}
                <rect x="540" y="70" width="120" height="70" rx="8" fill="var(--bg-base)" stroke="var(--accent-secondary)" strokeWidth="2" strokeDasharray="3 2" />
                <text x="600" y="100" fill="var(--accent-secondary)" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">LLM API Gateways</text>
                <text x="600" y="120" fill="var(--text-tertiary)" fontSize="10" fontFamily="monospace" textAnchor="middle">OpenAI, Claude...</text>

                {/* Connectors */}
                <path d="M 140 105 L 200 105" stroke="var(--accent-primary)" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="170" y="95" fill="var(--accent-primary)" fontSize="9" fontFamily="monospace" textAnchor="middle">HTTP POST</text>

                <path d="M 320 105 L 380 105" stroke="var(--text-secondary)" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <path d="M 500 105 L 540 105" stroke="var(--text-secondary)" strokeWidth="1.5" markerEnd="url(#arrow)" />

                {/* Auth lookups */}
                <path d="M 260 140 L 260 180" stroke="var(--border-subtle)" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                <text x="290" y="160" fill="var(--text-tertiary)" fontSize="9" fontFamily="monospace">Keys & Logs</text>

                {/* Return SSE path */}
                <path d="M 380 120 C 320 160, 200 160, 140 125" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#arrow)" />
                <text x="260" y="150" fill="var(--accent-primary)" fontSize="9" fontFamily="monospace" textAnchor="middle">SSE Stream deltas</text>

                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--border-strong)" />
                  </marker>
                </defs>
              </svg>
            </div>
            <div className="text-[10px] text-text-tertiary font-mono mt-2 text-center select-none block lg:hidden">
              ↔ Swipe horizontally to view full execution flow
            </div>
          </div>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Interactive Architecture Explorer</h2>
          <p className="text-sm leading-relaxed text-text-secondary mb-6">
            Click on any module in the live node-graph below to inspect implemented mechanics and target codebase files.
          </p>

          <ArchitectureExplorer />
        </div>
      );

    case "auth":
      return (
        <div className="prose-markdown max-w-3xl">
          <div className="border-b border-border-subtle pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
              Authentication & Sessions
            </h1>
            <p className="text-sm text-text-secondary">
              Google OAuth 2.0 PKCE redirection, session cookie signatures, and transparent token rotations.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            Arbiter implements a secure, stateful session cookie pattern built on top of the standard Google OAuth 2.0 protocol. Instead of static passwords, we utilize a stateless Proof Key for Code Exchange (PKCE) flow to exchange secure authorization grants.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">The Login & Refresh Lifecycle</h2>
          
          {/* SVG Sequence Diagram */}
          <div className="w-full flex flex-col items-center my-6 p-4 rounded-lg bg-bg-surface border border-border-subtle">
            <div className="w-full overflow-x-auto scrollbar-thin">
              <svg width="680" height="340" viewBox="0 0 680 340" fill="none" className="min-w-[600px] mx-auto">
                {/* Actors */}
                <line x1="80" y1="40" x2="80" y2="300" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <line x1="280" y1="40" x2="280" y2="300" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <line x1="480" y1="40" x2="480" y2="300" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <line x1="620" y1="40" x2="620" y2="300" stroke="var(--border-subtle)" strokeWidth="1.5" />

                <rect x="30" y="10" width="100" height="30" rx="4" fill="var(--bg-base)" stroke="var(--border-subtle)" />
                <text x="80" y="28" fill="var(--text-primary)" fontSize="10" fontFamily="monospace" textAnchor="middle">Client App</text>

                <rect x="230" y="10" width="100" height="30" rx="4" fill="var(--bg-base)" stroke="var(--border-subtle)" />
                <text x="280" y="28" fill="var(--text-primary)" fontSize="10" fontFamily="monospace" textAnchor="middle">Arbiter API</text>

                <rect x="430" y="10" width="100" height="30" rx="4" fill="var(--bg-base)" stroke="var(--border-subtle)" />
                <text x="480" y="28" fill="var(--text-primary)" fontSize="10" fontFamily="monospace" textAnchor="middle">Google OAuth</text>

                <rect x="580" y="10" width="80" height="30" rx="4" fill="var(--bg-base)" stroke="var(--border-subtle)" />
                <text x="620" y="28" fill="var(--text-primary)" fontSize="10" fontFamily="monospace" textAnchor="middle">Postgres</text>

                {/* Redirection */}
                <path d="M 80 70 L 280 70" stroke="var(--text-secondary)" strokeWidth="1" markerEnd="url(#arrow)" />
                <text x="180" y="65" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace" textAnchor="middle">1. GET /api/auth/google</text>

                <path d="M 280 90 L 480 90" stroke="var(--text-secondary)" strokeWidth="1" markerEnd="url(#arrow)" />
                <text x="380" y="85" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace" textAnchor="middle">2. Redirect (State & PKCE Challenge)</text>

                {/* Callback */}
                <path d="M 480 130 L 80 130" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#arrow)" />
                <text x="280" y="125" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace" textAnchor="middle">3. Callback with auth code</text>

                <path d="M 80 160 L 280 160" stroke="var(--text-secondary)" strokeWidth="1" markerEnd="url(#arrow)" />
                <text x="180" y="155" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace" textAnchor="middle">4. GET /callback?code=...</text>

                <path d="M 280 190 L 620 190" stroke="var(--accent-primary)" strokeWidth="1" markerEnd="url(#arrow)" />
                <text x="450" y="185" fill="var(--accent-primary)" fontSize="9" fontFamily="monospace" textAnchor="middle">5. Save User & Hash Refresh Token</text>

                <path d="M 280 220 L 80 220" stroke="var(--accent-primary)" strokeWidth="1" markerEnd="url(#arrow)" />
                <text x="180" y="215" fill="var(--accent-primary)" fontSize="9" fontFamily="monospace" textAnchor="middle">6. Set Cookies (JWT & Refresh)</text>

                {/* Refresh loop */}
                <path d="M 80 260 L 280 260" stroke="var(--accent-secondary)" strokeWidth="1" markerEnd="url(#arrow)" />
                <text x="180" y="255" fill="var(--accent-secondary)" fontSize="9" fontFamily="monospace" textAnchor="middle">7. POST /api/auth/refresh (on 401)</text>

                <path d="M 280 280 L 80 280" stroke="var(--accent-secondary)" strokeWidth="1" markerEnd="url(#arrow)" />
                <text x="180" y="275" fill="var(--accent-secondary)" fontSize="9" fontFamily="monospace" textAnchor="middle">8. Rotated Cookies (JWT & New Refresh)</text>

                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--border-strong)" />
                  </marker>
                </defs>
              </svg>
            </div>
            <div className="text-[10px] text-text-tertiary font-mono mt-2 text-center select-none block lg:hidden">
              ↔ Swipe horizontally to view full sequence flow
            </div>
          </div>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">PKCE Mechanics</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            PKCE (Proof Key for Code Exchange) is essential to prevent authorization code hijacking. When starting a login request, the server generates a high-entropy <code>code_verifier</code> (using <code>crypto.getRandomValues</code>) and computes its SHA-256 hash, generating the <code>code_challenge</code>.
          </p>
          <p className="text-sm leading-relaxed text-text-secondary mt-2">
            The verifier and state variables are encrypted into short-lived HTTP-only cookies (<code>oauth_state</code> and <code>oauth_code_verifier</code>) before redirecting to Google. On the callback redirect, the server verifies the state parameter (preventing CSRF) and exchanges the temporary auth code alongside the verifier cookie to obtain the profile tokens.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Transparent Retry via authFetch</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            Rather than forcing a hard redirect when a user session expires, the client wrapping utility handles 401 response statuses transparently. Look at the code in <Link href="file:///d:/PROGRAMMING/WEB%20DEVELOPMENT/JS/js/perplexity-clone/lib/client/authFetch.ts" className="font-mono text-accent-primary hover:underline">lib/client/authFetch.ts</Link>:
          </p>

          <CodeBlock
            language="typescript"
            code={`export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let res = await fetch(url, options);

  if (res.status === 401) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      if (refreshRes.ok) {
        // Refresh succeeded, retry the original request once
        res = await fetch(url, options);
      } else {
        // Refresh failed, dispatch event to trigger client logout
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-failed'));
        }
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-failed'));
      }
    }
  }

  return res;
}`}
          />

          <p className="text-sm leading-relaxed text-text-secondary mt-4">
            If the access token expires, the client fetches the refresh route, which rotates the refresh token row in Postgres (invalidating the old hash and committing a new SHA-256 hash). If the refresh token is revoked or expired, the client is forced to logout.
          </p>
        </div>
      );

    case "guest-mode":
      return (
        <div className="prose-markdown max-w-3xl">
          <div className="border-b border-border-subtle pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
              Guest vs. Logged-In Mode
            </h1>
            <p className="text-sm text-text-secondary">
              A breakdown of session boundaries, storage targets, and rate limiting profiles.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            Arbiter supports a stateless Guest Mode that allows users to test concurrent queries without creating a database profile. This is not a secondary code pipeline: both modes share the exact same orchestrator and providers. The distinction lies entirely in where state is stored and how rate limits are calculated.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Functional Differences</h2>
          <div className="overflow-x-auto my-4 border border-border-subtle rounded-lg">
            <table className="min-w-full text-xs text-text-secondary bg-bg-surface">
              <thead>
                <tr className="border-b border-border-subtle text-text-primary bg-bg-surface-raised font-mono">
                  <th className="px-4 py-3 text-left">Feature</th>
                  <th className="px-4 py-3 text-left">Guest Mode</th>
                  <th className="px-4 py-3 text-left">Logged-In Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                <tr>
                  <td className="px-4 py-3 font-semibold text-text-primary">Chat History</td>
                  <td className="px-4 py-3">In-Memory / sessionStorage (tab scoped)</td>
                  <td className="px-4 py-3">PostgreSQL (Drizzle ORM)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-text-primary">API Credentials</td>
                  <td className="px-4 py-3">sessionStorage (sent in payload body)</td>
                  <td className="px-4 py-3">PostgreSQL (AES-GCM encrypted)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-text-primary">Rate Limiter Scope</td>
                  <td className="px-4 py-3">IP Address (in-memory map)</td>
                  <td className="px-4 py-3">User ID (in-memory sliding window)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-text-primary">Telemetry & Costs</td>
                  <td className="px-4 py-3">Computed in-memory per message turn</td>
                  <td className="px-4 py-3">Saved to Postgres (aggregate tracking)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Guest Storage Tradeoffs</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            We store guest keys in <code>sessionStorage</code> on purpose — losing them on tab close is the point, not a bug. By keeping keys out of persistent local storage, we guarantee that closed browser windows cannot leak API keys even if a physical machine is compromised.
          </p>
          <p className="text-sm leading-relaxed text-text-secondary mt-2">
            When a guest user sends a request, the keys are passed inside the POST request body to the stateless <Link href="file:///d:/PROGRAMMING/WEB%20DEVELOPMENT/JS/js/perplexity-clone/app/api/guest/message/route.ts" className="font-mono text-accent-primary hover:underline">/api/guest/message</Link> endpoint. The backend processes the LLM streams but never logs the query, response, or metadata to PostgreSQL.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">IP-Based Rate Limiting</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            Since guest routes cannot verify user identities, they are gated by an IP extraction filter. In the guest route, we resolve the client IP via headers:
          </p>
          <CodeBlock
            language="typescript"
            code={`const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
if (isIpRateLimited(ip)) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}`}
          />
          <p className="text-sm leading-relaxed text-text-secondary mt-2">
            This prevents denial-of-service (DoS) attempts against downstream LLMs. Both guest and logged-in rate limit maps are stored in memory and reset after 60,000ms.
          </p>
        </div>
      );

    case "orchestration":
      return (
        <div className="prose-markdown max-w-3xl">
          <div className="border-b border-border-subtle pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
              Orchestration Pipeline
            </h1>
            <p className="text-sm text-text-secondary">
              Deconstructing fanned concurrency, stream delta propagation, and evaluator synthesis steps.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            The core engine of Arbiter is <Link href="file:///d:/PROGRAMMING/WEB%20DEVELOPMENT/JS/js/perplexity-clone/lib/orchestrator/runPipeline.ts" className="font-mono text-accent-primary hover:underline">lib/orchestrator/runPipeline.ts</Link>. It handles the synchronization of concurrent stream outputs, intercepts stream metadata, and pipes results directly into the evaluation step.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Fanned Execution Phase</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            When a prompt arrives, the orchestrator maps all selected workers and fires their stream processes concurrently using <code>Promise.all</code>. As chunks arrive from each vendor API, they are tagged with their provider code and pushed to the HTTP write buffer as SSE events.
          </p>
          <p className="text-sm leading-relaxed text-text-secondary mt-2">
            The server tracks metrics like Time-to-First-Token (TTFT) by catching the timestamp of the first chunk delta. When a worker stream concludes, its usage statistics are saved to a temporary tracker.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Evaluator Synthesis Phase</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            Once all fanned worker streams complete successfully, the orchestrator checks if an evaluator is selected. If active, it resolves the evaluator adapter and feeds:
          </p>
          <ul className="list-disc pl-5 my-3 text-xs text-text-secondary">
            <li>The original user query</li>
            <li>Historical chat messages</li>
            <li>All worker responses (labeled with model IDs and completion statuses)</li>
          </ul>
          <p className="text-sm leading-relaxed text-text-secondary">
            The evaluator streams a consolidated response back to the user, identifying points of agreement or contradiction. If no evaluator is selected, the client falls back to displaying the first successful worker response.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Interactive SSE Stream Simulator</h2>
          <p className="text-sm leading-relaxed text-text-secondary mb-4">
            Test the SSE event emission sequences and cost accumulators below.
          </p>

          <SseSimulator />
        </div>
      );

    case "adapters":
      return (
        <div className="prose-markdown max-w-3xl">
          <div className="border-b border-border-subtle pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
              Provider Adapters
            </h1>
            <p className="text-sm text-text-secondary">
              Normalizing disparate LLM APIs into a unified runtime streaming contract.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            Every AI provider uses a distinct API schema, authorization header scheme, and streaming event layout. To handle this without filling our orchestration code with switch statements, Arbiter defines a strict interface contract.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">The AgentAdapter Contract</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            All adapters under <Link href="file:///d:/PROGRAMMING/WEB%20DEVELOPMENT/JS/js/perplexity-clone/lib/agents/types.ts" className="font-mono text-accent-primary hover:underline">lib/agents/types.ts</Link> must satisfy the following TypeScript signature:
          </p>

          <CodeBlock
            language="typescript"
            code={`export interface AgentAdapter {
  provider: 'openai' | 'claude' | 'gemini' | 'deepseek' | 'mistral';
  streamWorker(input: WorkerInput): AsyncGenerator<AgentStreamEvent>;
  streamEvaluator(input: EvaluatorInput): AsyncGenerator<AgentStreamEvent>;
  runTitle(input: TitleInput): Promise<string>;
}`}
          />

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Adapter Example: OpenAI</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            The OpenAI adapter (located in <Link href="file:///d:/PROGRAMMING/WEB%20DEVELOPMENT/JS/js/perplexity-clone/lib/agents/openai.ts" className="font-mono text-accent-primary hover:underline">lib/agents/openai.ts</Link>) intercepts SSE stream lines. Since OpenAI does not yield token counts on streaming chunks by default, we configure <code>stream_options: &#123; include_usage: true &#125;</code> and parse the final chunk. Here is a stripped-down look at how delta parsing is normalized:
          </p>

          <CodeBlock
            language="typescript"
            code={`// From openAiAdapter.streamWorker:
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${input.apiKey}\`
  },
  body: JSON.stringify({
    model: input.modelId,
    messages,
    stream: true,
    stream_options: { include_usage: true }
  })
});

const reader = response.body.getReader();
const lineIterator = makeLineIterator(reader);
for await (const line of lineIterator) {
  if (!line.startsWith('data: ')) continue;
  const dataStr = line.slice(6).trim();
  if (dataStr === '[DONE]') continue;
  
  const parsed = JSON.parse(dataStr);
  const delta = parsed.choices?.[0]?.delta?.content || '';
  if (delta) {
    yield { type: 'delta', text: delta };
  }
}`}
          />

          <p className="text-sm leading-relaxed text-text-secondary mt-4">
            This design lets us swap or add providers (like Anthropic Claude or Google Gemini) easily by adding their respective files in <code>lib/agents/</code> and registering them in <Link href="file:///d:/PROGRAMMING/WEB%20DEVELOPMENT/JS/js/perplexity-clone/lib/agents/registry.ts" className="font-mono text-accent-primary hover:underline">lib/agents/registry.ts</Link>.
          </p>
        </div>
      );

    case "data-model":
      return (
        <div className="prose-markdown max-w-3xl">
          <div className="border-b border-border-subtle pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
              Database Data Model
            </h1>
            <p className="text-sm text-text-secondary">
              Relational entity layouts, constraints, indexes, and credentials encryption mappings.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            Arbiter uses Drizzle ORM to interface with a relational PostgreSQL database. The schema is optimized for write speeds on log messages and guarantees credentials isolation using unique indexes and cascade deletion rules.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Entity Relation (ER) Diagram</h2>

          {/* SVG ER Diagram */}
          <div className="w-full flex flex-col items-center my-6 p-4 rounded-lg bg-bg-surface border border-border-subtle">
            <div className="w-full overflow-x-auto scrollbar-thin">
              <svg width="680" height="300" viewBox="0 0 680 300" fill="none" className="min-w-[600px] mx-auto">
                {/* Users table */}
                <rect x="20" y="20" width="160" height="100" rx="6" fill="var(--bg-base)" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <rect x="20" y="20" width="160" height="24" rx="6" fill="var(--bg-surface-raised)" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <text x="30" y="36" fill="var(--accent-primary)" fontSize="10" fontWeight="bold" fontFamily="monospace">users</text>
                <text x="30" y="60" fill="var(--text-primary)" fontSize="9" fontFamily="monospace">id (PK - UUID)</text>
                <text x="30" y="75" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">google_id (Unique)</text>
                <text x="30" y="90" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">email (Unique)</text>

                {/* api_credentials */}
                <rect x="20" y="160" width="160" height="110" rx="6" fill="var(--bg-base)" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <rect x="20" y="160" width="160" height="24" rx="6" fill="var(--bg-surface-raised)" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <text x="30" y="176" fill="var(--text-primary)" fontSize="10" fontWeight="bold" fontFamily="monospace">api_credentials</text>
                <text x="30" y="200" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">userId (FK users.id)</text>
                <text x="30" y="215" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">provider</text>
                <text x="30" y="230" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">encrypted_key</text>
                <text x="30" y="245" fill="var(--text-tertiary)" fontSize="9" fontFamily="monospace">iv / auth_tag</text>

                {/* chats */}
                <rect x="260" y="20" width="160" height="100" rx="6" fill="var(--bg-base)" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <rect x="260" y="20" width="160" height="24" rx="6" fill="var(--bg-surface-raised)" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <text x="270" y="36" fill="var(--text-primary)" fontSize="10" fontWeight="bold" fontFamily="monospace">chats</text>
                <text x="270" y="60" fill="var(--text-primary)" fontSize="9" fontFamily="monospace">id (PK - UUID)</text>
                <text x="270" y="75" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">userId (FK users.id)</text>
                <text x="270" y="90" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">title</text>

                {/* messages */}
                <rect x="500" y="20" width="160" height="100" rx="6" fill="var(--bg-base)" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <rect x="500" y="20" width="160" height="24" rx="6" fill="var(--bg-surface-raised)" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <text x="510" y="36" fill="var(--text-primary)" fontSize="10" fontWeight="bold" fontFamily="monospace">messages</text>
                <text x="510" y="60" fill="var(--text-primary)" fontSize="9" fontFamily="monospace">id (PK - UUID)</text>
                <text x="510" y="75" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">chatId (FK chats.id)</text>
                <text x="510" y="90" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">content / role</text>

                {/* message_model_runs */}
                <rect x="420" y="150" width="240" height="130" rx="6" fill="var(--bg-base)" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <rect x="420" y="150" width="240" height="24" rx="6" fill="var(--bg-surface-raised)" stroke="var(--border-subtle)" strokeWidth="1.5" />
                <text x="430" y="166" fill="var(--text-primary)" fontSize="10" fontWeight="bold" fontFamily="monospace">message_model_runs</text>
                <text x="430" y="190" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">messageId (FK messages.id)</text>
                <text x="430" y="205" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">chatId (FK chats.id)</text>
                <text x="430" y="220" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">provider / modelId</text>
                <text x="430" y="235" fill="var(--text-tertiary)" fontSize="9" fontFamily="monospace">inputTokens / cachedTokens / outputTokens</text>
                <text x="430" y="250" fill="var(--text-tertiary)" fontSize="9" fontFamily="monospace">costUsd / latencyMs / ttftMs</text>

                {/* Connectors */}
                {/* Users to api_credentials */}
                <path d="M 100 120 L 100 160" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="3 3" />
                {/* Users to chats */}
                <path d="M 180 70 L 260 70" stroke="var(--text-secondary)" strokeWidth="1" />
                {/* Chats to messages */}
                <path d="M 420 70 L 500 70" stroke="var(--text-secondary)" strokeWidth="1" />
                {/* Messages to message_model_runs */}
                <path d="M 580 120 L 580 150" stroke="var(--text-secondary)" strokeWidth="1" />
              </svg>
            </div>
            <div className="text-[10px] text-text-tertiary font-mono mt-2 text-center select-none block lg:hidden">
              ↔ Swipe horizontally to view full database entity diagram
            </div>
          </div>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Key Schemas Details</h2>
          
          <h3 className="text-sm font-bold text-text-primary mt-4 mb-2">1. Encryption of API Keys</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            API keys stored in <code>api_credentials</code> are never plaintext. They are encrypted using <code>aes-256-gcm</code> in <Link href="file:///d:/PROGRAMMING/WEB%20DEVELOPMENT/JS/js/perplexity-clone/lib/crypto/aesGcm.ts" className="font-mono text-accent-primary hover:underline">lib/crypto/aesGcm.ts</Link>, producing an <code>encrypted_key</code>, <code>iv</code> (initialization vector), and an <code>auth_tag</code>. These fields are all stored alongside the record to ensure integrity. A unique constraint is declared on the composite key <code>(userId, provider)</code> to prevent duplication.
          </p>

          <h3 className="text-sm font-bold text-text-primary mt-6 mb-2">2. Granular Telemetry Tracking</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            Notice that <code>message_model_runs</code> is separate from <code>messages</code>. When a fanned message query runs, it creates one client message, but multiple runs (one per selected worker, plus one for the evaluator). This table isolates performance telemetry, logging <code>ttft_ms</code> (time-to-first-token), <code>latency_ms</code>, and <code>cost_usd</code> for each model execution.
          </p>
        </div>
      );

    case "pricing":
      return (
        <div className="prose-markdown max-w-3xl">
          <div className="border-b border-border-subtle pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
              Cost & Pricing Model
            </h1>
            <p className="text-sm text-text-secondary">
              Walking through caching calculations, tiered prompt sizes, and batch discount rates.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            Arbiter computes LLM pricing dynamically at the end of every stream. Instead of using flat estimation averages, the backend pulls configurations from <Link href="file:///d:/PROGRAMMING/WEB%20DEVELOPMENT/JS/js/perplexity-clone/config/modelPricing.ts" className="font-mono text-accent-primary hover:underline">config/modelPricing.ts</Link> and evaluates cost metrics inside <code>calculateRunCost</code>.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Pricing Configuration Columns</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            Each configuration tracks pricing per 1 million tokens (USD) and includes fields for cached read/write pricing, batch discounts, and verification dates:
          </p>
          <CodeBlock
            language="typescript"
            code={`export interface ModelPricing {
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
}`}
          />

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Cost Calculation Rules</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            The helper function <code>calculateRunCost</code> inside <Link href="file:///d:/PROGRAMMING/WEB%20DEVELOPMENT/JS/js/perplexity-clone/lib/agents/utils.ts" className="font-mono text-accent-primary hover:underline">lib/agents/utils.ts</Link> applies vendor-specific algorithms:
          </p>

          <h3 className="text-sm font-bold text-text-primary mt-4 mb-2">1. OpenAI & DeepSeek Caching</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            Charged by separating normal prompt tokens from cache hits (defined by <code>cachedInputPricePer1M</code>). For DeepSeek, cache hits drop prompt prices to $0.0028/M tokens.
          </p>

          <h3 className="text-sm font-bold text-text-primary mt-6 mb-2">2. Anthropic Claude Cache Reads & Writes</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            Claude splits input tokens into standard inputs, cache writes (which incur a 25% premium, charged at <code>cacheWritePricePer1M</code>), and cache reads (charged at a 90% discount, <code>cacheReadPricePer1M</code>).
          </p>

          <h3 className="text-sm font-bold text-text-primary mt-6 mb-2">3. Google Gemini Tiered Pricing</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            Gemini pricing changes based on whether the context length exceeds 200,000 tokens. For <code>gemini-2.5-pro</code>, input tokens ≤ 200K are charged at $1.25/M, whereas tokens &gt; 200K double to $2.50/M.
          </p>

          <h3 className="text-sm font-bold text-text-primary mt-6 mb-2">4. Batch Processing Discounts</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            If a model is processed in batch mode, a flat discount multiplier is applied (e.g. 50% discount for Gemini, Claude, OpenAI, and Mistral):
          </p>
          <CodeBlock
            language="typescript"
            code={`const discountMultiplier = isBatch ? (1 - model.batchDiscountPct / 100) : 1;
return (inputCost + outputCost) * discountMultiplier;`}
          />
        </div>
      );

    case "api-reference":
      return (
        <div className="prose-markdown max-w-3xl">
          <div className="border-b border-border-subtle pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
              API Reference
            </h1>
            <p className="text-sm text-text-secondary">
              Every route, request payload layout, authentication level, and response code.
            </p>
          </div>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Route Reference Table</h2>
          <div className="overflow-x-auto my-4 border border-border-subtle rounded-lg">
            <table className="min-w-full text-xs text-text-secondary bg-bg-surface">
              <thead>
                <tr className="border-b border-border-subtle text-text-primary bg-bg-surface-raised font-mono">
                  <th className="px-3 py-3 text-left">Method</th>
                  <th className="px-3 py-3 text-left">Route</th>
                  <th className="px-3 py-3 text-left">Auth</th>
                  <th className="px-3 py-3 text-left">Request Body</th>
                  <th className="px-3 py-3 text-left">Responses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                <tr>
                  <td className="px-3 py-3 text-status-success font-bold">GET</td>
                  <td className="px-3 py-3">/api/auth/google</td>
                  <td className="px-3 py-3 text-text-tertiary">None</td>
                  <td className="px-3 py-3">None</td>
                  <td className="px-3 py-3 text-text-secondary">302 Redirect to Google OAuth</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 text-status-success font-bold">GET</td>
                  <td className="px-3 py-3">/api/auth/google/callback</td>
                  <td className="px-3 py-3 text-text-tertiary">None</td>
                  <td className="px-3 py-3">Query: code, state</td>
                  <td className="px-3 py-3 text-text-secondary">302 Home (Sets Cookies) | 403 CSRF</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 text-accent-secondary font-bold">POST</td>
                  <td className="px-3 py-3">/api/auth/refresh</td>
                  <td className="px-3 py-3 text-accent-primary">Cookie</td>
                  <td className="px-3 py-3">None</td>
                  <td className="px-3 py-3 text-text-secondary">200 Profile | 401 Expired</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 text-accent-secondary font-bold">POST</td>
                  <td className="px-3 py-3">/api/auth/logout</td>
                  <td className="px-3 py-3 text-accent-primary">Cookie</td>
                  <td className="px-3 py-3">None</td>
                  <td className="px-3 py-3 text-text-secondary">200 Success (Clears Cookies)</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 text-status-success font-bold">GET</td>
                  <td className="px-3 py-3">/api/chats</td>
                  <td className="px-3 py-3 text-accent-primary">Cookie</td>
                  <td className="px-3 py-3">None</td>
                  <td className="px-3 py-3 text-text-secondary">200 Chats List | 401</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 text-accent-secondary font-bold">POST</td>
                  <td className="px-3 py-3">/api/chats</td>
                  <td className="px-3 py-3 text-accent-primary">Cookie</td>
                  <td className="px-3 py-3">&#123; title, selectedWorkers... &#125;</td>
                  <td className="px-3 py-3 text-text-secondary">200 New Chat Record | 401</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 text-accent-secondary font-bold">POST</td>
                  <td className="px-3 py-3">/api/chats/[id]/message</td>
                  <td className="px-3 py-3 text-accent-primary">Cookie</td>
                  <td className="px-3 py-3">&#123; content, modelSelections... &#125;</td>
                  <td className="px-3 py-3 text-text-secondary">200 SSE stream | 401 | 429</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 text-accent-secondary font-bold">POST</td>
                  <td className="px-3 py-3">/api/guest/message</td>
                  <td className="px-3 py-3 text-text-tertiary">None</td>
                  <td className="px-3 py-3">&#123; content, history, apiKeys &#125;</td>
                  <td className="px-3 py-3 text-text-secondary">200 SSE stream | 429</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 text-status-success font-bold">GET</td>
                  <td className="px-3 py-3">/api/models</td>
                  <td className="px-3 py-3 text-text-tertiary">None</td>
                  <td className="px-3 py-3">None</td>
                  <td className="px-3 py-3 text-text-secondary">200 MODEL_PRICING config</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );

    case "limitations":
      return (
        <div className="prose-markdown max-w-3xl">
          <div className="border-b border-border-subtle pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
              Known Limitations & Rough Edges
            </h1>
            <p className="text-sm text-text-secondary">
              An honest engineering look at scale constraints and pipeline vulnerabilities.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            No system is perfect. Here are the known trade-offs and limits currently present in the codebase.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">1. In-Memory Sliding Rate Limiting</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            The rate limiter implemented in <code>lib/orchestrator/rateLimiter.ts</code> uses a simple in-memory JavaScript <code>Map</code>. While this works perfectly for single-instance applications, it does not share state across multiple server instances (e.g. Vercel Serverless or multi-node Docker deployments). Under high loads or autoscaling groups, users can bypass limits. Upgrading this to Redis is a high priority.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">2. Evaluator History Truncation</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            To prevent hitting strict context boundaries on the evaluator (which receives fanned responses from multiple workers plus the conversation history), we strip empty lines and limit historical context to standard turns. If worker answers are excessively verbose, the evaluator request can suffer from latency bloat or truncation issues.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">3. Database Connection pool bounds</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            Since serverless API endpoints open connection pools on every fanned pipeline call, database connection spikes can occur under heavy concurrent user requests if the pool bounds are not throttled at the database level.
          </p>
        </div>
      );

    case "changelog":
      return (
        <div className="prose-markdown max-w-3xl">
          <div className="border-b border-border-subtle pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
              Changelog & Decisions Log
            </h1>
            <p className="text-sm text-text-secondary">
              Commit records and engineering reviews extracted from development audits.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            Below is the sequence of core improvements, model inventory migrations, and orchestration tweaks completed during the initial design audits.
          </p>

          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Engineering Log Entries</h2>

          <div className="relative border-l border-border-subtle pl-6 space-y-8 my-6">
            {/* Entry 1 */}
            <div className="relative">
              <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-accent-primary" />
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded border border-accent-primary/20">2026-07-13</span>
                <span className="text-xs text-text-tertiary">@mehul</span>
              </div>
              <h3 className="text-xs font-bold text-text-primary">Model ID Refinement & Auto-Title Correctness</h3>
              <ul className="list-disc pl-5 text-xs text-text-secondary leading-relaxed mt-2 space-y-1">
                <li>Corrected Mistral API IDs to match callable slugs (e.g. migrated <code>mistral-medium-3.5</code> to <code>mistral-medium-3-5</code>).</li>
                <li>Restored standard legacy models (<code>gpt-4o</code>, <code>claude-3-5-sonnet-20241022</code>, etc.) to prevent frontend model picker desynchronization.</li>
                <li>Gated auto-title executions to run only on successful pipeline response turns.</li>
              </ul>
            </div>

            {/* Entry 2 */}
            <div className="relative">
              <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-text-tertiary" />
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono text-text-secondary bg-bg-surface px-2 py-0.5 rounded border border-border-subtle">2026-07-10</span>
                <span className="text-xs text-text-tertiary">@mehul</span>
              </div>
              <h3 className="text-xs font-bold text-text-primary">Pricing configurator rewrite</h3>
              <ul className="list-disc pl-5 text-xs text-text-secondary leading-relaxed mt-2 space-y-1">
                <li>Removed hardcoded rates from <code>lib/agents/utils.ts</code>, migrating all rates to a single configuration record at <code>config/modelPricing.ts</code>.</li>
                <li>Rewrote <code>calculateRunCost</code> to support Advanced Caching: OpenAI/DeepSeek cached token rates, Anthropic cache writes/reads, and Gemini tiered prompt constraints.</li>
                <li>Added batch mode 50% discounts across all supported models.</li>
              </ul>
            </div>

            {/* Entry 3 */}
            <div className="relative">
              <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-text-tertiary" />
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono text-text-secondary bg-bg-surface px-2 py-0.5 rounded border border-border-subtle">2026-07-08</span>
                <span className="text-xs text-text-tertiary">@mehul</span>
              </div>
              <h3 className="text-xs font-bold text-text-primary">Database Telemetry & Schema Migration</h3>
              <ul className="list-disc pl-5 text-xs text-text-secondary leading-relaxed mt-2 space-y-1">
                <li>Migrated <code>message_model_runs</code> table columns to support recording <code>cached_tokens</code> counts and <code>ttft_ms</code> times.</li>
                <li>Updated SSE generators to capture latency benchmarks on the initial chunk payload delta.</li>
              </ul>
            </div>
          </div>
        </div>
      );

    default:
      notFound();
  }
}
