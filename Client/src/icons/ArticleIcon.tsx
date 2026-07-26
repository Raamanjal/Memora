export function ArticleIcon({ className = "size-5" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.75 3.75h12.5A1.75 1.75 0 0 1 20 5.5v13a1.75 1.75 0 0 1-1.75 1.75H5.75A1.75 1.75 0 0 1 4 18.5v-13a1.75 1.75 0 0 1 1.75-1.75Z" />
    <path strokeLinecap="round" d="M8 8h8M8 11.5h8M8 15h5" />
  </svg>;
}
