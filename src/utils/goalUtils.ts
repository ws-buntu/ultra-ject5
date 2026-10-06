import { ProjectGoal } from '../types';

export const normalizeGoals = (goals?: (string | ProjectGoal)[]): ProjectGoal[] => {
  if (!goals || !Array.isArray(goals)) return [];
  return goals.map((g, index) => {
    if (typeof g === 'string') {
      return {
        id: `goal-${index}-${g.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        text: g,
        completed: false
      };
    }
    return g;
  });
};
