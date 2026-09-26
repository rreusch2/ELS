export function EqualHousingLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Equal Housing Opportunity">
      <path d="M32 6 4 28h7v28h42V28h7L32 6zm15 44H17V25.5L32 14l15 11.5V50z" fill="currentColor" />
      <rect x="23" y="29" width="18" height="4.5" fill="currentColor" />
      <rect x="23" y="37.5" width="18" height="4.5" fill="currentColor" />
    </svg>
  );
}
