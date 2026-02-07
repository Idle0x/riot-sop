// The Studio Palette: Professional, high-contrast, dark-mode friendly
const SECTOR_PALETTE = [
  // 1. Emerald (Growth/Money)
  { border: 'border-emerald-500', shadow: 'shadow-emerald-500/10', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  // 2. Blue (Tech/Stability)
  { border: 'border-blue-500', shadow: 'shadow-blue-500/10', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  // 3. Violet (Deep Work/L2)
  { border: 'border-violet-500', shadow: 'shadow-violet-500/10', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  // 4. Rose (Passion/Speculation)
  { border: 'border-rose-500', shadow: 'shadow-rose-500/10', text: 'text-rose-400', bg: 'bg-rose-500/10' },
  // 5. Amber (Infrastructure/Building)
  { border: 'border-amber-500', shadow: 'shadow-amber-500/10', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  // 6. Cyan (Future/AI)
  { border: 'border-cyan-500', shadow: 'shadow-cyan-500/10', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  // 7. Indigo (Corporate/Formal)
  { border: 'border-indigo-500', shadow: 'shadow-indigo-500/10', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  // 8. Lime (Experimental)
  { border: 'border-lime-500', shadow: 'shadow-lime-500/10', text: 'text-lime-400', bg: 'bg-lime-500/10' },
];

export const getSectorStyle = (sectorName: string) => {
  if (!sectorName) return SECTOR_PALETTE[1]; // Default to Blue

  let hash = 0;
  for (let i = 0; i < sectorName.length; i++) {
    hash = sectorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % SECTOR_PALETTE.length;
  return SECTOR_PALETTE[index];
};

export const generateAssetID = (title: string, dateStr: string) => {
  // Generates something like "SUP-07"
  const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const suffix = new Date(dateStr).getDate().toString().padStart(2, '0');
  return `${prefix}-${suffix}`;
};
