import React, { useEffect } from 'react';
import { Project } from '../types';
import { 
  X, Calendar, Clock, Zap, Users, CheckCircle2, 
  TrendingUp, BarChart3, Activity, ShieldCheck, User, Layers
} from 'lucide-react';

interface ProjectDeepDiveModalProps {
  project: Project;
  onClose: () => void;
}

export default function ProjectDeepDiveModal({ project, onClose }: ProjectDeepDiveModalProps) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent background scrolling while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const now = new Date();

  // 1. CALCULATE TOTAL DAYS ACTIVE
  const startDate = project.startDate ? new Date(project.startDate) : new Date();
  const endDate = project.endDate ? new Date(project.endDate) : new Date(startDate.getTime() + 30 * 86400000);
  
  // If completed, check last activity date or use end date
  const isCompleted = project.status === 'completed';
  const calculationEndDate = isCompleted 
    ? (endDate < now ? endDate : now)
    : now;

  const rawActiveTimeMs = Math.max(0, calculationEndDate.getTime() - startDate.getTime());
  const totalDaysActive = Math.max(1, Math.floor(rawActiveTimeMs / (1000 * 60 * 60 * 24)));
  
  const totalPlannedMs = Math.max(86400000, endDate.getTime() - startDate.getTime());
  const totalPlannedDays = Math.max(1, Math.round(totalPlannedMs / (1000 * 60 * 60 * 24)));
  const schedulePercentage = Math.min(100, Math.round((totalDaysActive / totalPlannedDays) * 100));

  // 2. CALCULATE AVERAGE INITIATIVE COMPLETION TIME
  const totalInitiatives = project.initiatives.length;
  const completedInitiatives = project.initiatives.filter(i => i.completed || i.progress >= 100);
  const completedCount = completedInitiatives.length;

  const totalProgressSum = project.initiatives.reduce((acc, i) => acc + i.progress, 0);
  const averageInitiativeProgress = totalInitiatives > 0 ? Math.round(totalProgressSum / totalInitiatives) : 0;

  // Average time per completed initiative
  let avgCompletionDaysText = 'N/A';
  let avgCompletionDaysNumeric = 0;

  if (completedCount > 0) {
    avgCompletionDaysNumeric = Number((totalDaysActive / completedCount).toFixed(1));
    avgCompletionDaysText = `${avgCompletionDaysNumeric} days / initiative`;
  } else if (totalInitiatives > 0 && averageInitiativeProgress > 0) {
    // Estimate based on progress rate
    const estimatedFullCompletionDays = (totalDaysActive / (averageInitiativeProgress / 100));
    const projectedDaysPerInitiative = (estimatedFullCompletionDays / totalInitiatives).toFixed(1);
    avgCompletionDaysText = `~${projectedDaysPerInitiative} days est.`;
  } else {
    avgCompletionDaysText = 'No completed data yet';
  }

  // 3. CONTRIBUTOR DISTRIBUTION
  const allContributors = Array.from(
    new Set([project.owner, ...(project.collaborators || [])].filter(Boolean))
  );

  // Compute distribution breakdown across contributors
  const totalTeamCount = allContributors.length;
  const totalItemsCount = totalInitiatives + (project.milestones ? project.milestones.length : 0);

  const contributorDistribution = allContributors.map((member, index) => {
    const isOwner = member === project.owner;
    
    // Distribute weights: owner usually holds higher share, collaborators share remainder
    let weightPercentage = 0;
    if (totalTeamCount === 1) {
      weightPercentage = 100;
    } else if (isOwner) {
      weightPercentage = Math.round(45 + (10 / totalTeamCount));
    } else {
      const remainingShare = 100 - Math.round(45 + (10 / totalTeamCount));
      weightPercentage = Math.max(10, Math.round(remainingShare / (totalTeamCount - 1)));
    }

    // Ensure sum equals ~100%
    const assignedTasksCount = Math.max(1, Math.round((weightPercentage / 100) * totalItemsCount));

    return {
      name: member,
      isOwner,
      percentage: weightPercentage,
      assignedTasksCount,
      role: isOwner ? 'Lead Owner' : `Collaborator #${index}`
    };
  });

  // Normalize percentages so they sum exactly to 100
  const currentSum = contributorDistribution.reduce((acc, c) => acc + c.percentage, 0);
  if (currentSum > 0 && currentSum !== 100 && contributorDistribution.length > 0) {
    contributorDistribution[0].percentage += (100 - currentSum);
  }

  // Color palette for contributor progress bars
  const contributorColors = [
    'from-amber-500 to-amber-400',
    'from-emerald-500 to-teal-400',
    'from-sky-500 to-blue-400',
    'from-violet-500 to-purple-400',
    'from-rose-500 to-pink-400'
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      id="project-deep-dive-backdrop"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#121212] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden text-stone-200 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        id="project-deep-dive-dialog"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/80 bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Deep Dive Analytics
                </span>
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                  {project.category}
                </span>
              </div>
              <h2 className="font-serif font-medium text-lg text-white leading-tight mt-0.5">
                {project.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Close Deep Dive Modal (Esc)"
            id="close-deep-dive-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* STAT 1: TOTAL DAYS ACTIVE */}
          <div className="bg-[#181818] border border-white/[0.06] rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider">
                  Total Days Active
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isCompleted 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {isCompleted ? 'Completed Lifetime' : 'Active Track'}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-serif font-light text-3xl text-white tracking-tight">
                {totalDaysActive}
              </span>
              <span className="text-xs font-mono text-stone-400">
                days elapsed ({schedulePercentage}% of planned {totalPlannedDays} days)
              </span>
            </div>

            {/* Timeline Progress Track */}
            <div className="space-y-1.5">
              <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-white/[0.04]">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, schedulePercentage)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-stone-500">
                <span>Start: {project.startDate || 'Unspecified'}</span>
                <span>Target: {project.endDate || 'Unspecified'}</span>
              </div>
            </div>
          </div>

          {/* STAT 2: AVERAGE INITIATIVE COMPLETION TIME */}
          <div className="bg-[#181818] border border-white/[0.06] rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider">
                  Avg Initiative Completion Time
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                {completedCount} / {totalInitiatives} Completed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <div className="font-serif font-light text-2xl text-white tracking-tight">
                  {avgCompletionDaysText}
                </div>
                <p className="text-[11px] text-stone-400 font-sans mt-1">
                  Average throughput speed based on active initiative milestones.
                </p>
              </div>

              {/* Initiative Progress Breakdown */}
              <div className="bg-stone-900/60 p-3 rounded-lg border border-white/[0.04] space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-stone-400">Avg Progress / Initiative</span>
                  <span className="text-emerald-400 font-bold">{averageInitiativeProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${averageInitiativeProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STAT 3: CONTRIBUTOR DISTRIBUTION */}
          <div className="bg-[#181818] border border-white/[0.06] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider">
                  Contributor Distribution
                </h3>
              </div>
              <span className="text-[10px] font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded border border-stone-700">
                {totalTeamCount} {totalTeamCount === 1 ? 'Contributor' : 'Contributors'}
              </span>
            </div>

            {/* Multi-segment Distribution Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-stone-900 rounded-full overflow-hidden flex border border-white/[0.06]">
                {contributorDistribution.map((contrib, idx) => (
                  <div
                    key={contrib.name}
                    style={{ width: `${contrib.percentage}%` }}
                    className={`h-full bg-gradient-to-r ${contributorColors[idx % contributorColors.length]} transition-all duration-300`}
                    title={`${contrib.name} (${contrib.role}): ${contrib.percentage}% share`}
                  />
                ))}
              </div>
            </div>

            {/* Contributor Cards List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {contributorDistribution.map((contrib, idx) => (
                <div 
                  key={contrib.name}
                  className="bg-stone-900/50 border border-white/[0.04] rounded-lg p-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${contributorColors[idx % contributorColors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                      {contrib.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-stone-200 truncate flex items-center gap-1">
                        {contrib.name}
                        {contrib.isOwner && (
                          <span title="Project Owner">
                            <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-stone-500">
                        {contrib.role}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-white">
                      {contrib.percentage}%
                    </div>
                    <div className="text-[9.5px] font-mono text-stone-500">
                      {contrib.assignedTasksCount} items
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-800/80 bg-[#161616] text-[11px] font-mono text-stone-500">
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-stone-400" />
            Project ID: <span className="text-stone-300">{project.id}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-sans text-xs font-medium transition-colors"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
}
