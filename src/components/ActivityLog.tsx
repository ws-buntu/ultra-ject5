import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Edit, Clock, Plus, Check, X, Trash2, 
  Activity, Search, Filter, History, Calendar, CheckSquare, FileText, Timer
} from 'lucide-react';
import { ProjectActivity } from '../types';

interface ActivityLogProps {
  history?: ProjectActivity[];
  projectName?: string;
}

export default function ActivityLog({ history = [], projectName }: ActivityLogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'status_edits' | 'milestones' | 'time_logged'>('all');

  // Format ISO timestamp into clean local date time string
  const formatActivityTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  // Calculate human relative time string
  const getRelativeTimeString = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      if (isNaN(diffMs)) return '';

      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths}mo ago`;
    } catch {
      return '';
    }
  };

  // Icon mapping
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      case 'project_edited':
        return <Edit className="w-3.5 h-3.5 text-blue-400" />;
      case 'status_change':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'milestone_added':
        return <Plus className="w-3.5 h-3.5 text-amber-300" />;
      case 'milestone_completed':
        return <Check className="w-3.5 h-3.5 text-emerald-400" />;
      case 'milestone_incomplete':
        return <X className="w-3.5 h-3.5 text-stone-400" />;
      case 'milestone_deleted':
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      case 'time_logged':
        return <Timer className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-stone-400" />;
    }
  };

  // Type badge styling
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'project_created':
        return { label: 'Created', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'project_edited':
        return { label: 'Edited', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      case 'status_change':
        return { label: 'Status', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'milestone_added':
        return { label: 'Milestone Added', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' };
      case 'milestone_completed':
        return { label: 'Milestone Done', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'milestone_incomplete':
        return { label: 'Milestone Reset', color: 'text-stone-400 bg-stone-500/10 border-stone-500/20' };
      case 'milestone_deleted':
        return { label: 'Milestone Removed', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'time_logged':
        return { label: 'Time Tracked', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      default:
        return { label: 'Event', color: 'text-stone-400 bg-stone-500/10 border-stone-500/20' };
    }
  };

  // Filtered and sorted activity items (newest first)
  const sortedAndFilteredHistory = useMemo(() => {
    let items = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (selectedFilter === 'status_edits') {
      items = items.filter(i => ['project_created', 'project_edited', 'status_change'].includes(i.type));
    } else if (selectedFilter === 'milestones') {
      items = items.filter(i => i.type.startsWith('milestone_'));
    } else if (selectedFilter === 'time_logged') {
      items = items.filter(i => i.type === 'time_logged');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(i => 
        i.message.toLowerCase().includes(query) || 
        (i.details && i.details.toLowerCase().includes(query)) ||
        i.type.toLowerCase().includes(query)
      );
    }

    return items;
  }, [history, selectedFilter, searchQuery]);

  return (
    <div className="space-y-4" id="activity-log-component">
      {/* Top Controls Header */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <History className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Activity Timeline & Audit Log
                </h3>
                <span className="text-[9px] font-mono font-bold bg-stone-900 border border-stone-800 text-stone-400 px-1.5 py-0.5 rounded">
                  {sortedAndFilteredHistory.length} {sortedAndFilteredHistory.length === 1 ? 'event' : 'events'}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-sans">
                Chronological record of status changes, edits, and milestone completions{projectName ? ` for ${projectName}` : ''}.
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#161616] p-1 rounded-lg border border-white/[0.04] self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                selectedFilter === 'all' 
                  ? 'bg-stone-800 text-white shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('status_edits')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                selectedFilter === 'status_edits' 
                  ? 'bg-stone-800 text-white shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Status & Edits
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('milestones')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                selectedFilter === 'milestones' 
                  ? 'bg-stone-800 text-white shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Milestones
            </button>
          </div>
        </div>

        {/* Search input if history has multiple entries */}
        {history.length > 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by message or details..."
              className="w-full bg-[#161616] border border-white/[0.05] focus:border-stone-600 text-xs text-stone-200 placeholder-stone-600 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none transition-colors font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Timeline Container */}
      <div className="relative border-l border-white/[0.08] pl-4 ml-3 py-1 space-y-4">
        {sortedAndFilteredHistory.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/[0.08] rounded-xl bg-[#121212]/30 -ml-4 space-y-2">
            <History className="w-7 h-7 text-stone-600 mx-auto animate-pulse" />
            <p className="text-xs font-semibold text-stone-300">
              {searchQuery ? 'No matching activity records found' : 'No activity logged yet'}
            </p>
            <p className="text-[10px] text-stone-500 max-w-[240px] mx-auto leading-normal">
              {searchQuery 
                ? 'Try clearing your search query or selecting "All" events filter.' 
                : 'Project creations, edits, status updates, and milestone completions will be tracked automatically.'}
            </p>
          </div>
        ) : (
          sortedAndFilteredHistory.map((act) => {
            const badge = getTypeBadge(act.type);
            const relativeTime = getRelativeTimeString(act.timestamp);
            const formattedTime = formatActivityTime(act.timestamp);

            return (
              <div key={act.id} className="relative group/act select-none">
                {/* Timeline Node Badge Icon */}
                <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full border border-white/[0.1] bg-[#0c0c0c] flex items-center justify-center shadow-md group-hover/act:border-amber-500/40 transition-colors">
                  {getActivityIcon(act.type)}
                </div>

                {/* Event Card */}
                <div className="bg-[#111111] border border-white/[0.04] hover:border-white/[0.1] rounded-xl p-3.5 space-y-2 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {relativeTime && (
                          <span className="text-[9px] text-amber-400/90 font-mono font-bold tracking-wider">
                            {relativeTime}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-sans font-medium text-stone-100 leading-relaxed">
                        {act.message}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9.5px] text-stone-500 font-mono block leading-tight">
                        {formattedTime}
                      </span>
                    </div>
                  </div>

                  {act.details && (
                    <div className="text-[10.5px] text-stone-400 font-mono leading-relaxed bg-[#161616] px-3 py-2 rounded-lg border border-white/[0.03]">
                      {act.details}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
