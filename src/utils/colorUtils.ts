export interface ColorOption {
  value: string;
  label: string;
  dotClass: string;
  textClass: string;
  progressBarClass: string;
  stripeClass: string;
  hoverBorderClass: string;
  glowClass?: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  {
    value: 'amber',
    label: 'Amber Gold',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400',
    progressBarClass: 'bg-amber-400',
    stripeClass: 'bg-amber-400',
    hoverBorderClass: 'hover:border-amber-400/50',
    glowClass: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]'
  },
  {
    value: 'emerald',
    label: 'Emerald Jade',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    progressBarClass: 'bg-emerald-400',
    stripeClass: 'bg-emerald-400',
    hoverBorderClass: 'hover:border-emerald-400/50',
    glowClass: 'shadow-[0_0_12px_rgba(52,211,153,0.35)]'
  },
  {
    value: 'blue',
    label: 'Electric Blue',
    dotClass: 'bg-blue-400',
    textClass: 'text-blue-400',
    progressBarClass: 'bg-blue-400',
    stripeClass: 'bg-blue-400',
    hoverBorderClass: 'hover:border-blue-400/50',
    glowClass: 'shadow-[0_0_12px_rgba(96,165,250,0.35)]'
  },
  {
    value: 'violet',
    label: 'Deep Violet',
    dotClass: 'bg-violet-400',
    textClass: 'text-violet-400',
    progressBarClass: 'bg-violet-400',
    stripeClass: 'bg-violet-400',
    hoverBorderClass: 'hover:border-violet-400/50',
    glowClass: 'shadow-[0_0_12px_rgba(167,139,250,0.35)]'
  },
  {
    value: 'rose',
    label: 'Crimson Rose',
    dotClass: 'bg-rose-400',
    textClass: 'text-rose-400',
    progressBarClass: 'bg-rose-400',
    stripeClass: 'bg-rose-400',
    hoverBorderClass: 'hover:border-rose-400/50',
    glowClass: 'shadow-[0_0_12px_rgba(251,113,133,0.35)]'
  },
  {
    value: 'cyan',
    label: 'Cyber Cyan',
    dotClass: 'bg-cyan-400',
    textClass: 'text-cyan-400',
    progressBarClass: 'bg-cyan-400',
    stripeClass: 'bg-cyan-400',
    hoverBorderClass: 'hover:border-cyan-400/50',
    glowClass: 'shadow-[0_0_12px_rgba(34,211,238,0.35)]'
  },
  {
    value: 'indigo',
    label: 'Royal Indigo',
    dotClass: 'bg-indigo-400',
    textClass: 'text-indigo-400',
    progressBarClass: 'bg-indigo-400',
    stripeClass: 'bg-indigo-400',
    hoverBorderClass: 'hover:border-indigo-400/50',
    glowClass: 'shadow-[0_0_12px_rgba(129,140,248,0.35)]'
  },
  {
    value: 'teal',
    label: 'Teal Mint',
    dotClass: 'bg-teal-400',
    textClass: 'text-teal-400',
    progressBarClass: 'bg-teal-400',
    stripeClass: 'bg-teal-400',
    hoverBorderClass: 'hover:border-teal-400/50',
    glowClass: 'shadow-[0_0_12px_rgba(45,212,191,0.35)]'
  },
  {
    value: 'orange',
    label: 'Warm Orange',
    dotClass: 'bg-orange-400',
    textClass: 'text-orange-400',
    progressBarClass: 'bg-orange-400',
    stripeClass: 'bg-orange-400',
    hoverBorderClass: 'hover:border-orange-400/50',
    glowClass: 'shadow-[0_0_12px_rgba(251,146,60,0.35)]'
  },
  {
    value: 'fuchsia',
    label: 'Vibrant Fuchsia',
    dotClass: 'bg-fuchsia-400',
    textClass: 'text-fuchsia-400',
    progressBarClass: 'bg-fuchsia-400',
    stripeClass: 'bg-fuchsia-400',
    hoverBorderClass: 'hover:border-fuchsia-400/50',
    glowClass: 'shadow-[0_0_12px_rgba(232,121,249,0.35)]'
  },
  {
    value: 'white',
    label: 'Silver Slate',
    dotClass: 'bg-stone-200',
    textClass: 'text-stone-200',
    progressBarClass: 'bg-stone-200',
    stripeClass: 'bg-stone-300',
    hoverBorderClass: 'hover:border-white/30',
    glowClass: 'shadow-[0_0_12px_rgba(255,255,255,0.2)]'
  }
];

/**
 * Assigns a unique, predefined professional accent color to a new project.
 * Analyzes existing projects to balance color distribution across the workspace.
 */
export function generateColorPalette(
  existingProjects: Array<{ color?: string }> = [],
  projectNameOrId?: string
): string {
  // Filter out neutral 'white' to pick vibrant professional accent colors first
  const vibrantOptions = COLOR_OPTIONS.filter(c => c.value !== 'white');
  const usageCount: Record<string, number> = {};
  vibrantOptions.forEach(c => (usageCount[c.value] = 0));

  existingProjects.forEach(p => {
    if (p.color && usageCount[p.color] !== undefined) {
      usageCount[p.color]++;
    }
  });

  // Find minimum usage count among available vibrant colors
  let minCount = Infinity;
  vibrantOptions.forEach(c => {
    if (usageCount[c.value] < minCount) {
      minCount = usageCount[c.value];
    }
  });

  const minCandidates = vibrantOptions.filter(c => usageCount[c.value] === minCount);

  if (minCandidates.length === 1) {
    return minCandidates[0].value;
  }

  // If multiple colors have minimum usage, pick deterministically using name/id hash if provided
  if (projectNameOrId) {
    const hash = projectNameOrId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return minCandidates[hash % minCandidates.length].value;
  }

  const randomIndex = Math.floor(Math.random() * minCandidates.length);
  return minCandidates[randomIndex].value;
}

/**
 * Retrieves styling classes for a specified accent color key.
 */
export function getColorClasses(color?: string) {
  const match = COLOR_OPTIONS.find(c => c.value === color);
  if (match) {
    return {
      dot: match.dotClass,
      text: match.textClass,
      progressBar: match.progressBarClass,
      stripe: match.stripeClass,
      hoverBorder: match.hoverBorderClass,
      glow: match.glowClass || ''
    };
  }

  // Fallback for custom or default colors
  return {
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    progressBar: 'bg-amber-400',
    stripe: 'bg-amber-400',
    hoverBorder: 'hover:border-amber-400/40',
    glow: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]'
  };
}
