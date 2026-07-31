"use client";

// A different cap color each day of the week (index = Date#getDay()), so the
// coach's look changes daily without needing any stored state.
const CAP_COLORS = ["#E66767", "#22E5FF", "#8B6BF2", "#0CA30C", "#F2B84B", "#4BA3F2", "#F27CC6"];

export function CoachMascot({ className = "h-14 w-14" }: { className?: string }) {
  const capColor = CAP_COLORS[new Date().getDay()];

  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden="true">
      <ellipse cx="42" cy="139" rx="11" ry="4.5" fill="#F2A93B" />
      <ellipse cx="78" cy="139" rx="11" ry="4.5" fill="#F2A93B" />

      <ellipse cx="16" cy="86" rx="10" ry="25" fill="#1B2230" transform="rotate(-16 16 86)" />
      <ellipse cx="104" cy="86" rx="10" ry="25" fill="#1B2230" transform="rotate(16 104 86)" />

      <ellipse cx="60" cy="88" rx="46" ry="52" fill="#1B2230" />
      <ellipse cx="60" cy="98" rx="29" ry="37" fill="#EEF1FB" />

      <path d="M47 80 L60 94 L73 80 Z" fill="#F2A93B" />

      <rect x="33" y="60" width="54" height="16" rx="8" fill="#0B0E14" />
      <rect x="39" y="63" width="17" height="7" rx="3.5" fill="#4A5578" opacity="0.65" />
      <rect x="64" y="63" width="17" height="7" rx="3.5" fill="#4A5578" opacity="0.65" />

      <path d="M27 48 A33 27 0 0 1 93 48 Z" fill={capColor} />
      <ellipse cx="92" cy="52" rx="15" ry="6" fill={capColor} transform="rotate(-14 92 52)" />
      <circle cx="60" cy="21" r="3" fill={capColor} />
    </svg>
  );
}
