export const Naira = ({ className = "" }: { className?: string }) => (
  <span className={`inline-flex items-center justify-center font-sans ${className}`}>
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-[1em] h-[1em] -translate-y-[0.05em]" // Optical alignment
    >
      <line x1="4" x2="4" y1="4" y2="20" />
      <line x1="20" x2="20" y1="4" y2="20" />
      <line x1="4" x2="20" y1="4" y2="20" />
      <line x1="2" x2="22" y1="10" y2="10" />
      <line x1="2" x2="22" y1="14" y2="14" />
    </svg>
  </span>
);
