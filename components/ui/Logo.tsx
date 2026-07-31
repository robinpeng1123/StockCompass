export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet shadow-glow ${className}`}>
      <svg viewBox="0 0 36 36" className="h-[60%] w-[60%]" fill="none">
        <circle cx="18" cy="18" r="13.5" stroke="#05070C" strokeWidth="2" />
        <path d="M23.5 12.5L19.6 20.2L11.5 23.5L15.4 15.8L23.5 12.5Z" fill="#05070C" />
        <path d="M18 12.5L19.6 20.2L18 23.5L16.4 20.2Z" fill="#05070C" opacity="0.55" />
        <circle cx="18" cy="18" r="1.6" fill="#EEF1FB" />
      </svg>
    </div>
  );
}
