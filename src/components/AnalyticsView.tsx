import React from 'react';
import { Project, ProjectCategory } from '../types';
import { TrendingUp, CheckCircle, Clock, Calendar, AlertTriangle, Layers, Award, Zap, ShieldAlert, BarChart3, Archive } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsViewProps {
  projects: Project[];
}

const CustomTooltip = ({ active, payload, totalProjects }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = totalProjects || 1;
    const pct = Math.round((data.count / total) * 100);
    return (
      <div className="bg-[#181818] border border-stone-700/80 p-2.5 rounded-lg shadow-xl font-mono text-xs text-white">
        <p className="font-bold flex items-center gap-1.5" style={{ color: data.fill }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: data.fill }} />
          {data.status} Projects
        </p>
        <div className="mt-1 flex items-baseline gap-2 text-stone-300">
          <span className="text-lg font-serif font-light text-white">{data.count}</span>
          <span className="text-[10px] text-stone-400">({pct}% of total portfolio)</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsView({ projects }: AnalyticsViewProps) {
  const anchorDate = new Date('2026-07-18');

  // --- STATS COMPUTATION ---
  const totalProjects = projects.length;
  
  // Initiatives stats
  let totalInitiatives = 0;
  let completedInitiatives = 0;
  projects.forEach(p => {
    p.initiatives.forEach(init => {
      totalInitiatives++;
      if (init.completed || init.progress === 100) {
        completedInitiatives++;
      }
    });
  });

  const initiativeCompRate = totalInitiatives > 0 
    ? Math.round((completedInitiatives / totalInitiatives) * 100) 
    : 0;

  // Milestones stats
  let totalMilestones = 0;
  let completedMilestones = 0;
  let overdueMilestones = 0;

  projects.forEach(p => {
    p.milestones.forEach(m => {
      totalMilestones++;
      if (m.completed) {
        completedMilestones++;
      } else {
        const mDate = new Date(m.date);
        if (mDate.getTime() < anchorDate.getTime()) {
          overdueMilestones++;
        }
      }
    });
  });

  const milestonesCompRate = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  // --- INSIGHT CARDS COMPUTATION (Velocity & Risk) ---
  const computeInsights = () => {
    if (projects.length === 0) {
      return { fastestMetric: null, highestRiskMetric: null };
    }

    const anchorTime = anchorDate.getTime();

    const projectMetrics = projects.map(p => {
      // Overall progress %
      const avgInitiativeProgress = p.initiatives.length > 0
        ? p.initiatives.reduce((acc, i) => acc + i.progress, 0) / p.initiatives.length
        : 0;

      const milestoneCompletionRate = p.milestones.length > 0
        ? (p.milestones.filter(m => m.completed).length / p.milestones.length) * 100
        : 0;

      const overallProgress = p.initiatives.length > 0 
        ? avgInitiativeProgress 
        : (p.milestones.length > 0 ? milestoneCompletionRate : 0);

      // Days elapsed & duration
      const sDate = p.startDate ? new Date(p.startDate) : new Date(anchorTime - 14 * 86400000);
      const eDate = p.endDate ? new Date(p.endDate) : new Date(anchorTime + 30 * 86400000);

      const totalDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / 86400000));
      const elapsedDays = Math.max(1, Math.round((anchorTime - sDate.getTime()) / 86400000));

      // Daily velocity (% progress per day elapsed)
      const dailyVelocity = overallProgress / elapsedDays;

      // Overdue milestones count
      const overdueMilestonesCount = p.milestones.filter(m => !m.completed && new Date(m.date).getTime() < anchorTime).length;

      // Timeline progress ratio vs actual progress
      const timelineRatio = Math.min(1, Math.max(0, elapsedDays / totalDays));
      const expectedProgress = timelineRatio * 100;
      const progressLag = Math.max(0, expectedProgress - overallProgress);

      // Risk score calculation (higher = riskier)
      let riskScore = 0;
      if (p.status !== 'completed' && p.status !== 'archived') {
        riskScore += overdueMilestonesCount * 30; // 30 pts per overdue milestone
        riskScore += progressLag * 1.5; // lag penalty
        
        if (p.priority === 'critical') riskScore += 25;
        if (p.priority === 'high') riskScore += 15;
        if (p.status === 'on-hold') riskScore += 20;

        // Near deadline penalty if progress is low
        const daysToDeadline = Math.round((eDate.getTime() - anchorTime) / 86400000);
        if (daysToDeadline <= 7 && overallProgress < 80) {
          riskScore += 35;
        }
      }

      return {
        project: p,
        overallProgress: Math.round(overallProgress),
        dailyVelocity: Number(dailyVelocity.toFixed(1)),
        elapsedDays,
        totalDays,
        overdueMilestonesCount,
        progressLag: Math.round(progressLag),
        riskScore: Math.round(riskScore)
      };
    });

    // Fastest velocity (prefer non-archived)
    const activeOrCompleted = projectMetrics.filter(m => m.project.status !== 'archived');
    const velocityPool = activeOrCompleted.length > 0 ? activeOrCompleted : projectMetrics;

    const fastestMetric = [...velocityPool].sort((a, b) => {
      if (b.dailyVelocity !== a.dailyVelocity) return b.dailyVelocity - a.dailyVelocity;
      return b.overallProgress - a.overallProgress;
    })[0];

    // Highest risk (prefer unfinished projects)
    const unfinishedProjects = projectMetrics.filter(m => m.project.status !== 'completed' && m.project.status !== 'archived');
    const riskPool = unfinishedProjects.length > 0 ? unfinishedProjects : projectMetrics;

    const highestRiskMetric = [...riskPool].sort((a, b) => b.riskScore - a.riskScore)[0];

    return {
      fastestMetric: fastestMetric || null,
      highestRiskMetric: highestRiskMetric || null
    };
  };

  const { fastestMetric, highestRiskMetric } = computeInsights();

  // --- COMPUTING CATEGORY METRICS ---
  const CATEGORIES: ProjectCategory[] = ['Development', 'Design', 'Marketing', 'Operations', 'Finance'];
  
  const categoryStats = CATEGORIES.map(cat => {
    const catProjects = projects.filter(p => p.category === cat);
    let totalProgressSum = 0;
    let initCount = 0;

    catProjects.forEach(p => {
      if (p.initiatives.length > 0) {
        const pProg = p.initiatives.reduce((acc, i) => acc + i.progress, 0) / p.initiatives.length;
        totalProgressSum += pProg;
      }
      initCount += p.initiatives.length;
    });

    const avgProgress = catProjects.length > 0 
      ? Math.round(totalProgressSum / catProjects.length) 
      : 0;

    return {
      category: cat,
      projectCount: catProjects.length,
      initiativeCount: initCount,
      progress: avgProgress
    };
  }).filter(stat => stat.projectCount > 0); // Only show categories with projects

  // Category Accent Colors
  const getCategoryColorClass = (cat: ProjectCategory) => {
    switch (cat) {
      case 'Development': return 'bg-stone-300';
      case 'Design': return 'bg-white';
      case 'Marketing': return 'bg-stone-400';
      case 'Operations': return 'bg-stone-500';
      case 'Finance': return 'bg-stone-600';
      default: return 'bg-stone-700';
    }
  };

  const getCategoryTextClass = (cat: ProjectCategory) => {
    switch (cat) {
      case 'Development': return 'text-stone-300';
      case 'Design': return 'text-white font-semibold';
      case 'Marketing': return 'text-stone-400';
      case 'Operations': return 'text-stone-500';
      case 'Finance': return 'text-stone-600';
      default: return 'text-stone-500';
    }
  };

  // --- URGENT MILESTONES (Upcoming 3 incomplete) ---
  const getUrgentMilestones = () => {
    const list: Array<{ pName: string; title: string; date: string; isOverdue: boolean }> = [];
    projects.forEach(p => {
      p.milestones.forEach(m => {
        if (!m.completed) {
          const mDate = new Date(m.date);
          const isOverdue = mDate.getTime() < anchorDate.getTime();
          list.push({
            pName: p.name,
            title: m.title,
            date: m.date,
            isOverdue
          });
        }
      });
    });

    // Sort: overdue first, then chronological
    return list.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }).slice(0, 3);
  };

  const urgentMilestones = getUrgentMilestones();

  // --- PROJECT STATUS DISTRIBUTION DATA ---
  const statusCounts = {
    active: projects.filter(p => p.status === 'active').length,
    planning: projects.filter(p => p.status === 'planning').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'on-hold').length,
    archived: projects.filter(p => p.status === 'archived').length,
  };

  const projectSummaryData = [
    { status: 'Active', count: statusCounts.active, fill: '#f59e0b' },
    { status: 'Planning', count: statusCounts.planning, fill: '#0ea5e9' },
    { status: 'Completed', count: statusCounts.completed, fill: '#10b981' },
  ];

  if (statusCounts.onHold > 0) {
    projectSummaryData.push({ status: 'On Hold', count: statusCounts.onHold, fill: '#f97316' });
  }
  if (statusCounts.archived > 0) {
    projectSummaryData.push({ status: 'Archived', count: statusCounts.archived, fill: '#a8a29e' });
  }

  // --- ARCHIVE INSIGHTS COMPUTATION ---
  const archivedProjects = projects.filter(p => p.status === 'archived');
  const totalArchivedCount = archivedProjects.length;

  const archivedTotalInitiatives = archivedProjects.reduce((acc, p) => acc + p.initiatives.length, 0);
  const archivedCompletedInitiatives = archivedProjects.reduce((acc, p) => {
    return acc + p.initiatives.filter(i => i.completed || i.progress === 100).length;
  }, 0);

  const archivedTotalMilestones = archivedProjects.reduce((acc, p) => acc + (p.milestones ? p.milestones.length : 0), 0);

  // Success vs Abandoned archived projects calculation
  // A project is considered "Successfully Completed" upon archive if its average initiative progress >= 75% or 100% completed initiatives
  const successfulArchivedProjects = archivedProjects.filter(p => {
    if (p.initiatives.length === 0) return true; // Default assumption for goal-free archived items
    const avgProgress = p.initiatives.reduce((acc, i) => acc + i.progress, 0) / p.initiatives.length;
    return avgProgress >= 75 || p.initiatives.every(i => i.completed);
  });
  const successfulArchivedCount = successfulArchivedProjects.length;
  const abandonedArchivedCount = totalArchivedCount - successfulArchivedCount;

  const archiveSuccessRatio = totalArchivedCount > 0 
    ? Math.round((successfulArchivedCount / totalArchivedCount) * 100) 
    : 100;

  // Category breakdown for archived projects
  const archivedCategoryCounts: Record<string, number> = {};
  archivedProjects.forEach(p => {
    archivedCategoryCounts[p.category] = (archivedCategoryCounts[p.category] || 0) + 1;
  });

  const archivedCategoryBreakdown = Object.entries(archivedCategoryCounts)
    .map(([cat, count]) => ({
      category: cat as ProjectCategory,
      count,
      percentage: totalArchivedCount > 0 ? Math.round((count / totalArchivedCount) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div id="analytics-view" className="flex flex-col flex-1 p-5 pb-20 space-y-4 select-none no-scrollbar overflow-y-auto">
      
      {/* Upper header */}
      <div className="flex flex-col gap-0.5 pb-3 border-b border-white/[0.04]">
        <h2 className="font-serif font-light text-2xl text-white tracking-tight leading-none">Analytics</h2>
        <p className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold font-sans mt-1">Initiative Telemetry & Velocity Audit</p>
      </div>

      {/* Grid: Overviews */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#111111] border border-white/[0.04] p-3.5 rounded-xl flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider font-mono">Initiatives</span>
            <Layers className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div>
            <p className="text-xl font-serif font-light text-white leading-none">
              {completedInitiatives}<span className="text-stone-500 text-xs font-sans font-normal">/{totalInitiatives}</span>
            </p>
            <p className="text-[9px] text-stone-500 font-mono mt-1.5">Completion: {initiativeCompRate}%</p>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/[0.04] p-3.5 rounded-xl flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider font-mono">Milestones</span>
            <Award className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div>
            <p className="text-xl font-serif font-light text-white leading-none">
              {completedMilestones}<span className="text-stone-500 text-xs font-sans font-normal">/{totalMilestones}</span>
            </p>
            <p className="text-[9px] text-stone-500 font-mono mt-1.5">Hit Index: {milestonesCompRate}%</p>
          </div>
        </div>
      </div>

      {/* PROJECT SUMMARY WIDGET WITH BAR CHART */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 space-y-3.5" id="project-summary-widget">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">
                Project Summary
              </h3>
              <p className="text-[10px] text-stone-500 font-sans">
                Portfolio distribution across project lifecycle stages
              </p>
            </div>
          </div>
          <span className="text-[9.5px] font-mono text-stone-400 bg-stone-900 px-2.5 py-1 rounded-lg border border-white/[0.06] font-semibold">
            Total: {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>

        {/* Bar Chart Container */}
        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectSummaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="status" 
                tick={{ fill: '#a8a29e', fontSize: 11, fontFamily: 'monospace' }} 
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip totalProjects={projects.length} />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {projectSummaryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Status Badges */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04]">
          {projectSummaryData.map(item => {
            const pct = projects.length > 0 ? Math.round((item.count / projects.length) * 100) : 0;
            return (
              <div 
                key={item.status} 
                className="bg-stone-950/50 border border-white/[0.04] p-2 rounded-lg flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="text-[10.5px] font-mono font-medium text-stone-300 truncate">{item.status}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className="text-base font-serif font-light text-white">{item.count}</span>
                  <span className="text-[9.5px] font-mono text-stone-500">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INSIGHT CARDS SECTION */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider font-mono">
              Insight Cards
            </span>
          </div>
          <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
            Telemetry Analysis
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* CARD 1: FASTEST VELOCITY */}
          <div className="bg-[#111111] border border-amber-500/20 rounded-xl p-3.5 space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
            
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" /> Fastest Velocity
              </span>
              {fastestMetric && (
                <span className="text-[9.5px] font-mono font-bold text-emerald-400">
                  ⚡ {fastestMetric.dailyVelocity}% / day
                </span>
              )}
            </div>

            {fastestMetric ? (
              <div className="space-y-2.5">
                <div>
                  <h4 className="font-serif font-medium text-sm text-white leading-tight">
                    {fastestMetric.project.name}
                  </h4>
                  <p className="text-[10px] text-stone-400 font-sans mt-0.5 line-clamp-1">
                    {fastestMetric.project.description || 'Peak momentum project'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-stone-400">Overall Progress</span>
                    <span className="text-amber-300 font-bold">{fastestMetric.overallProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, fastestMetric.overallProgress)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[9.5px] font-mono text-stone-500 border-t border-white/[0.04]">
                  <span>Cat: {fastestMetric.project.category}</span>
                  <span className="text-stone-300">
                    {fastestMetric.project.initiatives.filter(i => i.completed || i.progress === 100).length}/{fastestMetric.project.initiatives.length} initiatives
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 py-3 font-mono">No active velocity data available.</p>
            )}
          </div>

          {/* CARD 2: HIGHEST DEADLINE RISK */}
          <div className="bg-[#111111] border border-rose-500/20 rounded-xl p-3.5 space-y-3 relative overflow-hidden group hover:border-rose-500/40 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />

            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" /> Highest Deadline Risk
              </span>
              {highestRiskMetric && (
                <span className="text-[9.5px] font-mono font-bold text-rose-400">
                  Risk Score: {highestRiskMetric.riskScore}
                </span>
              )}
            </div>

            {highestRiskMetric ? (
              <div className="space-y-2.5">
                <div>
                  <h4 className="font-serif font-medium text-sm text-white leading-tight">
                    {highestRiskMetric.project.name}
                  </h4>
                  <p className="text-[10px] text-rose-300/80 font-sans mt-0.5 line-clamp-1">
                    {highestRiskMetric.overdueMilestonesCount > 0 
                      ? `⚠️ ${highestRiskMetric.overdueMilestonesCount} overdue checkpoint(s)`
                      : highestRiskMetric.progressLag > 0
                        ? `Lagging schedule by ~${highestRiskMetric.progressLag}% vs target`
                        : `Status: ${highestRiskMetric.project.status.toUpperCase()} • Priority: ${highestRiskMetric.project.priority.toUpperCase()}`}
                  </p>
                </div>

                {/* Progress bar vs Risk */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-stone-400">Current Progress</span>
                    <span className="text-rose-400 font-bold">{highestRiskMetric.overallProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, highestRiskMetric.overallProgress)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[9.5px] font-mono text-stone-500 border-t border-white/[0.04]">
                  <span>End: {highestRiskMetric.project.endDate || 'N/A'}</span>
                  <span className="text-rose-400 font-bold">
                    Prio: {highestRiskMetric.project.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 py-3 font-mono">All projects are currently low risk.</p>
            )}
          </div>
        </div>
      </div>

      {/* Category Performance Indices */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 space-y-3.5">
        <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">Progression by Category</span>
        
        <div className="space-y-3.5 pt-1">
          {categoryStats.map(stat => (
            <div key={stat.category} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${getCategoryColorClass(stat.category)}`} />
                  <span className={`text-[12px] font-medium ${getCategoryTextClass(stat.category)}`}>{stat.category}</span>
                  <span className="text-[9px] text-stone-500 font-mono">({stat.projectCount} proj)</span>
                </div>
                <span className="text-stone-300 font-semibold font-mono text-[10px]">{stat.progress}%</span>
              </div>
              <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getCategoryColorClass(stat.category)} transition-all duration-500`}
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ARCHIVE INSIGHTS SECTION */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 space-y-3.5" id="archive-insights-widget">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-stone-800 border border-stone-700/60 flex items-center justify-center text-stone-300">
              <Archive className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">
                Archive Insights
              </h3>
              <p className="text-[10px] text-stone-500 font-sans">
                Completed historical workload & category breakdown of archived projects
              </p>
            </div>
          </div>
          <span className="text-[9.5px] font-mono text-stone-400 bg-stone-900 px-2.5 py-1 rounded-lg border border-white/[0.06] font-semibold">
            {totalArchivedCount} Archived
          </span>
        </div>

        {totalArchivedCount > 0 ? (
          <div className="space-y-4 pt-1">
            {/* Archive Success Ratio Visual Gauge Card */}
            <div className="bg-stone-950/80 border border-amber-500/20 p-3.5 rounded-xl flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Radial SVG Gauge */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Arc */}
                  <path
                    className="text-stone-800"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Foreground Arc */}
                  <path
                    className={
                      archiveSuccessRatio >= 75
                        ? "text-emerald-400"
                        : archiveSuccessRatio >= 40
                        ? "text-amber-400"
                        : "text-rose-400"
                    }
                    strokeDasharray={`${archiveSuccessRatio}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                {/* Center Percentage Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-serif font-bold text-white leading-none">
                    {archiveSuccessRatio}%
                  </span>
                  <span className="text-[8px] font-mono text-stone-400 uppercase tracking-tighter mt-0.5">
                    Ratio
                  </span>
                </div>
              </div>

              {/* Metric Breakdown & Legend */}
              <div className="flex-1 space-y-1.5 text-center sm:text-left min-w-0">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <h4 className="text-xs font-bold font-mono text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Archive Success Ratio
                  </h4>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                    archiveSuccessRatio >= 75
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : archiveSuccessRatio >= 40
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}>
                    {archiveSuccessRatio >= 75 ? 'Optimal Throughput' : archiveSuccessRatio >= 40 ? 'Moderate Success' : 'Needs Review'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-sans leading-relaxed">
                  Percentage of archived initiatives that achieved target milestones and key goals prior to retirement versus those abandoned early.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <div className="bg-emerald-950/40 border border-emerald-500/20 px-2 py-1 rounded-md flex items-center gap-1.5 text-[10px] font-mono text-emerald-300">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>{successfulArchivedCount} Successful</span>
                  </div>
                  <div className="bg-rose-950/40 border border-rose-500/20 px-2 py-1 rounded-md flex items-center gap-1.5 text-[10px] font-mono text-rose-300">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>{abandonedArchivedCount} Abandoned/Early</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat Callouts */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-stone-950/60 border border-white/[0.04] p-2.5 rounded-lg">
                <span className="text-[9px] font-mono uppercase text-stone-500 block">Total Archived</span>
                <span className="text-lg font-serif font-light text-white leading-tight block mt-0.5">
                  {totalArchivedCount}
                </span>
                <span className="text-[9px] font-mono text-stone-400">
                  {projects.length > 0 ? Math.round((totalArchivedCount / projects.length) * 100) : 0}% of portfolio
                </span>
              </div>

              <div className="bg-stone-950/60 border border-white/[0.04] p-2.5 rounded-lg">
                <span className="text-[9px] font-mono uppercase text-stone-500 block">Workload Cleared</span>
                <span className="text-lg font-serif font-light text-emerald-400 leading-tight block mt-0.5">
                  {archivedTotalInitiatives}
                </span>
                <span className="text-[9px] font-mono text-stone-400">
                  initiatives ({archivedCompletedInitiatives} done)
                </span>
              </div>

              <div className="bg-stone-950/60 border border-white/[0.04] p-2.5 rounded-lg">
                <span className="text-[9px] font-mono uppercase text-stone-500 block">Milestones Saved</span>
                <span className="text-lg font-serif font-light text-amber-300 leading-tight block mt-0.5">
                  {archivedTotalMilestones}
                </span>
                <span className="text-[9px] font-mono text-stone-400">checkpoints logged</span>
              </div>
            </div>

            {/* Category Breakdown Progress Bars */}
            <div className="space-y-2.5 pt-1 border-t border-white/[0.04]">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider font-mono block">
                Archived Breakdown by Original Category
              </span>

              <div className="space-y-2.5">
                {archivedCategoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${getCategoryColorClass(item.category)}`} />
                        <span className={`text-[11.5px] font-medium ${getCategoryTextClass(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="text-[9px] font-mono text-stone-500">
                          ({item.count} {item.count === 1 ? 'proj' : 'projs'})
                        </span>
                      </div>
                      <span className="text-stone-300 font-mono text-[10px] font-bold">{item.percentage}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-white/[0.04]">
                      <div 
                        className={`h-full rounded-full ${getCategoryColorClass(item.category)} transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini List of Archived Projects */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
                Archived Project Vault
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {archivedProjects.map((p) => (
                  <div 
                    key={p.id}
                    className="bg-stone-950/40 border border-white/[0.04] p-2 rounded-lg flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h5 className="font-serif font-medium text-xs text-stone-200 truncate">{p.name}</h5>
                      <span className="text-[9px] font-mono text-stone-500">{p.category}</span>
                    </div>
                    <span className="text-[9.5px] font-mono text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded border border-white/[0.04] shrink-0">
                      {p.initiatives.length} init.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-950/50 border border-white/[0.04] rounded-lg p-4 text-center space-y-1">
            <p className="text-xs font-serif font-light text-stone-300">No projects currently archived.</p>
            <p className="text-[10px] text-stone-500 font-sans max-w-sm mx-auto">
              When projects are completed or retired, set their status to 'Archived' to preserve historical analytics and track long-term throughput here.
            </p>
          </div>
        )}
      </div>

      {/* Urgent / Outstanding Checkpoints */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono">Urgent Checkpoints</span>
          {overdueMilestones > 0 && (
            <span className="text-[8px] bg-red-950/20 text-red-400 border border-red-900/10 px-2 py-0.5 rounded font-bold animate-pulse flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> {overdueMilestones} Overdue
            </span>
          )}
        </div>

        <div className="space-y-2 pt-1">
          {urgentMilestones.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-stone-500">All checkpoints successfully cleared!</p>
            </div>
          ) : (
            urgentMilestones.map((mile, idx) => (
              <div 
                key={idx}
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                  mile.isOverdue 
                    ? 'bg-red-500/5 border-red-500/10 text-red-400' 
                    : 'bg-stone-950/40 border border-white/[0.04] text-stone-300'
                }`}
              >
                {mile.isOverdue ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                ) : (
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-stone-500" />
                )}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-serif font-light truncate text-white leading-tight">{mile.title}</p>
                    <span className="text-[9px] font-bold font-mono text-stone-500">{mile.date}</span>
                  </div>
                  <p className="text-[9px] text-stone-500 truncate font-sans">{mile.pName}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
