"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/memory", label: "Memory" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative z-10 min-h-screen">
      <header className="border-b border-line/80 bg-surface-raised/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="group flex flex-col">
            <span className="font-sans text-2xl font-bold tracking-tight text-ink transition group-hover:text-accent-strong">
              RecallOps
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
              Every incident makes it smarter
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-accent-soft text-accent-strong"
                      : "text-ink-muted hover:bg-surface-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
