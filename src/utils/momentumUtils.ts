import { Project } from '../types';

/**
 * Calculates a composite Momentum Score (0 - 100+) for a project based on:
 * - Initiative completion percentage (35%)
 * - Priority level weighting (30%)
 * - Proximity to deadline / urgency (25%)
 * - Active project status momentum boost (10%)
 */
export function calculateMomentumScore(project: Project): number {
  // 1. Completion Progress (0-100)
  const totalInits = project.initiatives ? project.initiatives.length : 0;
  const avgProgress = totalInits > 0
    ? project.initiatives.reduce((acc, init) => acc + (init.progress || 0), 0) / totalInits
    : 0;

  // 2. Priority Weight
  const priorityWeights: Record<string, number> = {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10
  };
  const priorityScore = priorityWeights[project.priority] || 10;

  // 3. Proximity to Deadline / Urgency
  const now = new Date().getTime();
  const endDate = new Date(project.endDate).getTime();
  const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

  let deadlineScore = 0;
  if (project.status === 'completed') {
    deadlineScore = 0; // Completed projects don't have pending deadline pressure
  } else if (diffDays < 0) {
    // Overdue: Urgent attention required
    deadlineScore = 50 + Math.min(30, Math.abs(diffDays) * 2);
  } else if (diffDays <= 7) {
    deadlineScore = 45;
  } else if (diffDays <= 14) {
    deadlineScore = 30;
  } else if (diffDays <= 30) {
    deadlineScore = 15;
  } else {
    deadlineScore = 5;
  }

  // 4. Status Momentum Boost
  const statusBoost = project.status === 'active' ? 15 : project.status === 'planning' ? 5 : 0;

  const score = Math.round(
    (avgProgress * 0.35) + 
    (priorityScore * 0.30) + 
    (deadlineScore * 0.25) + 
    statusBoost
  );

  return Math.max(0, score);
}

/**
 * Returns a color and label badge configuration for a given momentum score.
 */
export function getMomentumBadge(score: number) {
  if (score >= 70) {
    return {
      label: 'High Velocity',
      colorClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      iconColor: 'text-amber-400'
    };
  }
  if (score >= 40) {
    return {
      label: 'Steady Stream',
      colorClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      iconColor: 'text-blue-400'
    };
  }
  return {
    label: 'Low Trajectory',
    colorClass: 'bg-stone-500/15 text-stone-400 border-stone-500/30',
    iconColor: 'text-stone-500'
  };
}
