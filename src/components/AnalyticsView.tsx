import React from 'react';
import { Project, ProjectCategory } from '../types';
import { TrendingUp, CheckCircle, Clock, Calendar, AlertTriangle, Layers, Award } from 'lucide-react';

interface AnalyticsViewProps {
  projects: Project[];
}

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
