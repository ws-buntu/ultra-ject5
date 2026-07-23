import React, { useState } from 'react';
import { Project, Milestone, ProjectCategory } from '../types';
import { Calendar, CheckCircle2, Circle, AlertCircle, Sparkles, MapPin, Tag } from 'lucide-react';

interface MilestonesTimelineProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

interface FlattenedMilestone {
  project: Project;
  milestone: Milestone;
}

export default function MilestonesTimeline({ projects, onSelectProject }: MilestonesTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'met'>('all');
  const anchorDate = new Date('2026-07-18');

  // Flatten milestones and sort chronologically
  const getAllMilestones = (): FlattenedMilestone[] => {
    const list: FlattenedMilestone[] = [];
    projects.forEach(project => {
      project.milestones.forEach(milestone => {
        list.push({ project, milestone });
      });
    });

    // Sort chronologically
    return list.sort((a, b) => {
      return new Date(a.milestone.date).getTime() - new Date(b.milestone.date).getTime();
    });
  };

  const allMilestones = getAllMilestones();

  // Apply filter
  const filteredMilestones = allMilestones.filter(item => {
    if (filter === 'met') return item.milestone.completed;
    if (filter === 'pending') return !item.milestone.completed;
    return true;
  });

  // Category Badge Colors
  const getCategoryStyles = (category: ProjectCategory) => {
    switch (category) {
      case 'Development': return 'text-stone-300 bg-[#18181b] border-white/[0.06]';
      case 'Design': return 'text-white bg-[#27272a] border-white/[0.12]';
      case 'Marketing': return 'text-stone-300 bg-[#18181b] border-white/[0.06]';
      case 'Operations': return 'text-stone-300 bg-[#18181b] border-white/[0.06]';
      case 'Finance': return 'text-stone-300 bg-[#18181b] border-white/[0.06]';
      default: return 'text-stone-400 bg-stone-900 border-white/[0.04]';
    }
  };

  return (
    <div id="timeline-view" className="flex flex-col flex-1 select-none">
      
      {/* Upper header */}
      <div className="p-5 border-b border-white/[0.04] bg-[#0c0c0c] space-y-3.5">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-serif font-light text-2xl text-white tracking-tight leading-none">Milestones</h2>
          <p className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold font-sans mt-1">Chronological Milestone Roadmap</p>
        </div>

        {/* Filters bar */}
        <div className="flex bg-[#121212] p-0.5 rounded-lg border border-white/[0.06]">
          {(['all', 'pending', 'met'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`flex-1 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
                filter === opt
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Road */}
      <div className="flex-1 overflow-y-auto p-5 pb-20 no-scrollbar">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/[0.08] rounded-xl bg-[#121212]/20 mt-4">
            <Calendar className="w-8 h-8 text-stone-700 mx-auto mb-2" />
            <p className="text-xs text-stone-500 font-semibold">No milestones found.</p>
            <p className="text-[10px] text-stone-600 mt-0.5">Try relaxing filters or adding milestones.</p>
          </div>
        ) : (
          <div className="relative border-l border-white/[0.05] pl-4 ml-2.5 py-1 space-y-4">
            {filteredMilestones.map(({ project, milestone }) => {
              const mDate = new Date(milestone.date);
              const isOverdue = !milestone.completed && mDate.getTime() < anchorDate.getTime();
              
              return (
                <div key={milestone.id} className="relative group/timeline-item">
                  
                  {/* Circle point */}
                  <div className={`absolute -left-[24px] top-1 w-3 h-3 rounded-full border bg-[#0a0a0a] transition-all ${
                    milestone.completed 
                      ? 'border-white bg-white' 
                      : isOverdue 
                        ? 'border-red-400 bg-red-950/40 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                        : 'border-stone-700'
                  }`} />

                  {/* Date badge left floating header */}
                  <div className="text-[9px] text-stone-500 font-bold font-mono tracking-wide uppercase mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-600" />
                    <span>{milestone.date}</span>
                    {isOverdue && (
                      <span className="text-[8px] font-bold text-red-400 bg-red-950/40 px-1 py-0.2 rounded font-mono uppercase">
                        Overdue
                      </span>
                    )}
                  </div>

                  {/* Main card panel - clickable to launch project detail */}
                  <button
                    onClick={() => onSelectProject(project)}
                    className="w-full text-left bg-[#111111] hover:bg-[#151515] border border-white/[0.04] hover:border-white/[0.08] rounded-xl p-3.5 transition-all flex flex-col gap-2 select-none group focus:outline-none focus:ring-1 focus:ring-stone-600"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-serif font-light text-white group-hover:text-stone-300 transition-colors leading-snug">
                        {milestone.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${getCategoryStyles(project.category)}`}>
                        {project.category}
                      </span>
                    </div>

                    {/* Belongs to Project info */}
                    <div className="text-[10px] text-stone-500 flex items-center gap-1">
                      <span className="font-mono text-stone-600">Project:</span>
                      <span className="text-stone-400 font-medium truncate max-w-[200px]">
                        {project.name}
                      </span>
                    </div>

                    {/* Notes summary */}
                    {milestone.notes && (
                      <p className="text-[11px] text-stone-500 bg-stone-950/30 p-2 rounded-lg border-l border-stone-700 font-sans italic leading-relaxed">
                        {milestone.notes}
                      </p>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
