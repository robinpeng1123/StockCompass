"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Command Center", icon: NavIconGrid },
  { href: "/screener", label: "Stock Search", icon: NavIconSearch },
  { href: "/portfolio", label: "Portfolio Copilot", icon: NavIconShield },
  { href: "/learn", label: "Learn", icon: NavIconBook },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid-backdrop min-h-screen bg-plane bg-[length:32px_32px]">
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-plane/60 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-2 px-6 py-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet shadow-glow">
              <span className="text-sm font-bold text-plane">SC</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-ink-primary">StockCompass</div>
              <div className="text-[11px] text-ink-muted">AI Trading Coach</div>
            </div>
          </div>

          <nav className="mt-4 flex-1 space-y-1 px-3">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-white/[0.06] text-ink-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                      : "text-ink-secondary hover:bg-white/[0.03] hover:text-ink-primary"
                  }`}
                >
                  <Icon active={active} />
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-cyan shadow-glow" />}
                </Link>
              );
            })}
          </nav>

          <div className="m-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-status-good" />
              Simulated market feed
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
              All prices, scores and predictions on this site are illustrative and for
              education only — not financial advice.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <TopBar />
          <main className="px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-16">{children}</main>
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}

function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/[0.08] bg-plane/90 backdrop-blur-xl lg:hidden">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
              active ? "text-accent-cyan" : "text-ink-muted"
            }`}
          >
            <Icon active={active} />
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/[0.06] bg-plane/70 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet">
          <span className="text-xs font-bold text-plane">SC</span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-ink-secondary sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-status-good" />
          Markets open · simulated
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-series-7 to-series-5 text-xs font-semibold text-white">
          RP
        </div>
      </div>
    </header>
  );
}

function NavIconGrid({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={active ? "opacity-100" : "opacity-70"}>
      <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function NavIconSearch({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={active ? "opacity-100" : "opacity-70"}>
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M15 15L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function NavIconShield({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={active ? "opacity-100" : "opacity-70"}>
      <path
        d="M9 2.25L14.75 4.5V8.7c0 3.6-2.45 6.53-5.75 7.55-3.3-1.02-5.75-3.95-5.75-7.55V4.5L9 2.25Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function NavIconBook({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={active ? "opacity-100" : "opacity-70"}>
      <path d="M3 3.5c1.8-.7 4-.7 6 0v11c-2-.7-4.2-.7-6 0v-11Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M15 3.5c-1.8-.7-4-.7-6 0v11c2-.7 4.2-.7 6 0v-11Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
