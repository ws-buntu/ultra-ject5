export const getInitials = (input: string): string => {
  if (!input) return '?';
  const str = input.trim();
  
  if (str.includes('@')) {
    const emailUser = str.split('@')[0];
    const userParts = emailUser.split(/[._\-+]/).filter(Boolean);
    if (userParts.length >= 2) {
      return (userParts[0][0] + userParts[1][0]).toUpperCase();
    }
    return emailUser.substring(0, 2).toUpperCase();
  }

  const parts = str.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0] ? parts[0].substring(0, 2).toUpperCase() : '?';
};

const PALETTE = [
  'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
  'bg-amber-950/80 text-amber-300 border-amber-500/40',
  'bg-violet-950/80 text-violet-300 border-violet-500/40',
  'bg-blue-950/80 text-blue-300 border-blue-500/40',
  'bg-rose-950/80 text-rose-300 border-rose-500/40',
  'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
  'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
  'bg-teal-950/80 text-teal-300 border-teal-500/40',
];

export const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};
