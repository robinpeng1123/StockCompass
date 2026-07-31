"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card, CardHeader } from "@/components/ui/Card";
import { saveWatchlist } from "@/lib/watchlist";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [cleared, setCleared] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (
      !window.confirm(
        "Delete your account? This permanently removes your profile, synced portfolio, and sign-in — this can't be undone."
      )
    ) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account.");
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Something went wrong deleting your account. Try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Settings</h1>
        <p className="mt-1 text-sm text-ink-secondary">Account and data preferences.</p>
      </div>

      <Card>
        <CardHeader eyebrow="Account" title="Sign in" />
        {status === "authenticated" && session?.user ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink-primary">{session.user.name || "Signed in"}</p>
              <p className="text-xs text-ink-muted">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-ink-primary hover:bg-white/[0.06]"
            >
              Sign out
            </button>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-ink-secondary">
            <Link href="/sign-in" className="font-medium text-accent-cyan hover:underline">
              Sign in
            </Link>{" "}
            to sync your portfolio across devices instead of keeping it only in this browser.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader eyebrow="Data" title="Portfolio data" />
        <p className="mb-3 text-sm leading-relaxed text-ink-secondary">
          {status === "authenticated"
            ? "Your portfolio is synced to your account. Clearing it removes every position you've added — this can't be undone."
            : "Your portfolio is currently stored in this browser only. Clearing it removes every position you've added — this can't be undone."}
        </p>
        <button
          onClick={() => {
            saveWatchlist([]);
            setCleared(true);
            setTimeout(() => setCleared(false), 2500);
          }}
          className="rounded-xl border border-status-critical/30 bg-status-critical/[0.06] px-4 py-2 text-xs font-semibold text-status-critical hover:bg-status-critical/[0.1]"
        >
          Clear portfolio data
        </button>
        {cleared && <p className="mt-2 text-xs text-status-good">Cleared. Refresh any open portfolio page to see it update.</p>}
        {status === "authenticated" && (
          <p className="mt-2 text-[11px] text-ink-muted">
            Note: this only clears browser-local data. Remove synced holdings individually from the Portfolio Copilot page.
          </p>
        )}
      </Card>

      {status === "authenticated" && (
        <Card>
          <CardHeader eyebrow="Danger Zone" title="Delete account" />
          <p className="mb-3 text-sm leading-relaxed text-ink-secondary">
            Permanently deletes your profile, sign-in, and synced portfolio holdings. This can&apos;t be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-xl border border-status-critical/30 bg-status-critical/[0.06] px-4 py-2 text-xs font-semibold text-status-critical hover:bg-status-critical/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete account"}
          </button>
          {deleteError && <p className="mt-2 text-xs text-status-critical">{deleteError}</p>}
        </Card>
      )}

      <Card>
        <CardHeader eyebrow="About" title="StockCompass" />
        <p className="text-sm leading-relaxed text-ink-secondary">
          Prices, charts and news are live. Risk/momentum/volatility scores and scenario simulations are computed
          heuristics for education, not financial advice or a guarantee of future performance.
        </p>
      </Card>
    </div>
  );
}
