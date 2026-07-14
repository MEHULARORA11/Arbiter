"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/docs", label: "Overview", icon: "◈" },
  { href: "/docs/architecture", label: "Architecture", icon: "⬡" },
  { href: "/docs/auth", label: "Auth & Sessions", icon: "⬥" },
  { href: "/docs/guest-mode", label: "Guest vs. Logged-In", icon: "◎" },
  { href: "/docs/orchestration", label: "Orchestration Pipeline", icon: "⟳" },
  { href: "/docs/adapters", label: "Provider Adapters", icon: "◆" },
  { href: "/docs/data-model", label: "Data Model", icon: "◉" },
  { href: "/docs/pricing", label: "Cost & Pricing", icon: "◇" },
  { href: "/docs/api-reference", label: "API Reference", icon: "◈" },
  { href: "/docs/limitations", label: "Known Limitations", icon: "△" },
  { href: "/docs/changelog", label: "Changelog", icon: "◐" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* Top bar */}
      <header
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2 font-semibold text-sm" style={{ color: "var(--accent-primary)" }}>
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>ARBITER</span>
          </Link>

          <span style={{ color: "var(--border-subtle)" }}>/</span>

          <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Docs</span>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="text-xs px-3 py-1.5 rounded-md border transition-colors"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">
        {/* Sidebar — desktop */}
        <aside
          className="hidden lg:flex flex-col w-56 shrink-0 py-6 pr-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto"
          style={{ borderRight: "1px solid var(--border-subtle)" }}
        >
          <SidebarNav pathname={pathname} />
        </aside>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          />
        )}

        {/* Mobile drawer panel */}
        <div
          className="fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col py-6 px-4 lg:hidden transition-transform duration-300"
          style={{
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border-subtle)",
            transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="font-semibold text-sm" style={{ color: "var(--accent-primary)", fontFamily: "var(--font-geist-mono)" }}>
              ARBITER / Docs
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ color: "var(--text-secondary)" }}
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>
          <SidebarNav pathname={pathname} onItemClick={() => setDrawerOpen(false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 py-8 px-4 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarNav({ pathname, onItemClick }: { pathname: string; onItemClick?: () => void }) {
  const [search, setSearch] = React.useState("");

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return NAV_ITEMS;
    const clean = search.toLowerCase();
    return NAV_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(clean)
    );
  }, [search]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input */}
      <div className="relative px-3">
        <input
          type="text"
          placeholder="Filter documentation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg-base border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-5.5 top-1.5 text-text-tertiary hover:text-text-primary text-[10px] cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-0.5">
        {filteredItems.map((item) => {
          const isActive = item.href === "/docs"
            ? pathname === "/docs"
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150"
              style={{
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                background: isActive ? "rgba(0,245,255,0.07)" : "transparent",
                fontWeight: isActive ? "600" : "400",
              }}
            >
              <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="px-3 py-2 text-xs text-text-tertiary italic">
            No matches found
          </div>
        )}
      </nav>
    </div>
  );
}
