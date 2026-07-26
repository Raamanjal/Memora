export function AudioIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 10l12-3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="15" r="3" />
    </svg>
  );
}
