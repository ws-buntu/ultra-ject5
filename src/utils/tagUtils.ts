/**
 * Utility function to return colorful, pill-shaped badge styles for tags.
 */
export const getTagStyle = (tag: string) => {
  const clean = tag.toLowerCase().replace(/^#/, '').trim();
  switch (clean) {
    case 'urgent':
    case 'critical':
      return 'bg-rose-500/15 border-rose-500/35 text-rose-300 hover:bg-rose-500/25';
    case 'review':
    case 'qa':
    case 'audit':
      return 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25';
    case 'client':
    case 'customer':
    case 'external':
      return 'bg-violet-500/15 border-violet-500/35 text-violet-300 hover:bg-violet-500/25';
    case 'work':
    case 'official':
      return 'bg-sky-500/15 border-sky-500/35 text-sky-300 hover:bg-sky-500/25';
    case 'personal':
    case 'private':
      return 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25';
    case 'technical':
    case 'dev':
    case 'code':
      return 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300 hover:bg-cyan-500/25';
    case 'marketing':
    case 'growth':
    case 'seo':
      return 'bg-pink-500/15 border-pink-500/35 text-pink-300 hover:bg-pink-500/25';
    case 'research':
    case 'design':
      return 'bg-indigo-500/15 border-indigo-500/35 text-indigo-300 hover:bg-indigo-500/25';
    case 'internal':
    case 'ops':
      return 'bg-teal-500/15 border-teal-500/35 text-teal-300 hover:bg-teal-500/25';
    default: {
      const palettes = [
        'bg-teal-500/15 border-teal-500/35 text-teal-300 hover:bg-teal-500/25',
        'bg-orange-500/15 border-orange-500/35 text-orange-300 hover:bg-orange-500/25',
        'bg-fuchsia-500/15 border-fuchsia-500/35 text-fuchsia-300 hover:bg-fuchsia-500/25',
        'bg-lime-500/15 border-lime-500/35 text-lime-300 hover:bg-lime-500/25',
        'bg-purple-500/15 border-purple-500/35 text-purple-300 hover:bg-purple-500/25',
        'bg-blue-500/15 border-blue-500/35 text-blue-300 hover:bg-blue-500/25',
      ];
      let hash = 0;
      for (let i = 0; i < clean.length; i++) {
        hash = clean.charCodeAt(i) + ((hash << 5) - hash);
      }
      const idx = Math.abs(hash) % palettes.length;
      return palettes[idx];
    }
  }
};
