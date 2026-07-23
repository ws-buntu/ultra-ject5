import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Project, ProjectCategory, ProjectStatus, Milestone as MilestoneType, ProjectActivity, ProjectPriority } from '../types';
import { Calendar, User, Milestone, ClipboardList, AlertCircle, Clock, Plus, Bell, BellRing, Trash2, StickyNote, Activity, MoreVertical, ArrowUpDown, ChevronDown, ChevronUp, Archive, SlidersHorizontal, Pin, Copy } from 'lucide-react';

interface ProjectCardProps {
  key?: string | number;
  project: Project;
  onClick: () => void;
  onUpdateProject?: (updated: Project) => void;
  onDuplicateProject?: (project: Project) => void;
  onTogglePinProject?: (projectId: string) => void;
  searchQuery?: string;
}

export default function ProjectCard({ 
  project, 
  onClick, 
  onUpdateProject, 
  onDuplicateProject, 
  onTogglePinProject, 
  searchQuery 
}: ProjectCardProps) {
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickMilestoneTitle, setQuickMilestoneTitle] = useState('');
  const [quickMilestoneDate, setQuickMilestoneDate] = useState(project.endDate);
  const [quickMilestoneInitiativeId, setQuickMilestoneInitiativeId] = useState('');
  const [quickMilestoneWeight, setQuickMilestoneWeight] = useState<number>(25);

  const [isSchedulingReminder, setIsSchedulingReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(project.endDate);
  const [reminderTime, setReminderTime] = useState('09:00');
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  const [isSwipedOpen, setIsSwipedOpen] = useState(false);
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editCategory, setEditCategory] = useState<ProjectCategory>(project.category);
  const [editPriority, setEditPriority] = useState<ProjectPriority>(project.priority);
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status);

  // Sync state values when inline Quick Edit is opened
  const handleStartQuickEdit = () => {
    setEditName(project.name);
    setEditCategory(project.category);
    setEditPriority(project.priority);
    setEditStatus(project.status);
    setIsQuickEditing(true);
    setIsSwipedOpen(false);
  };

  const handleQuickArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateProject) return;

    const nextStatus = project.status === 'archived' ? 'active' : 'archived';
    const updatedHistory: ProjectActivity[] = [
      {
        id: `act-${Date.now()}-archive`,
        timestamp: new Date().toISOString(),
        type: 'project_edited',
        message: nextStatus === 'archived' ? 'Project archived' : 'Project unarchived',
        details: nextStatus === 'archived' ? 'Archived via swipe action' : 'Unarchived via swipe action'
      },
      ...(project.history || [])
    ];

    onUpdateProject({
      ...project,
      status: nextStatus,
      history: updatedHistory
    });
    setIsSwipedOpen(false);
  };

  const handleCyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateProject) return;

    const priorities: ProjectPriority[] = ['low', 'medium', 'high', 'critical'];
    const currentIndex = priorities.indexOf(project.priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    const nextPriority = priorities[nextIndex];

    const updatedHistory: ProjectActivity[] = [
      {
        id: `act-${Date.now()}-prio-cycle`,
        timestamp: new Date().toISOString(),
        type: 'project_edited',
        message: `Priority updated to ${nextPriority.charAt(0).toUpperCase() + nextPriority.slice(1)} (Quick Cycle)`,
        details: `Cycled from ${project.priority.toUpperCase()} via context menu`
      },
      ...(project.history || [])
    ];

    onUpdateProject({
      ...project,
      priority: nextPriority,
      history: updatedHistory
    });
  };

  const highlightText = (text: string, query?: string) => {
    if (!text) return '';
    if (!query || !query.trim()) return <span>{text}</span>;

    const trimmedQuery = query.trim();
    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark 
              key={index} 
              className="bg-amber-400/25 text-amber-300 px-0.5 rounded font-semibold border-b border-amber-500/25"
              style={{ backgroundClip: 'padding-box' }}
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  // Calculate dynamic progress
  const calculateProgress = () => {
    if (!project.initiatives || project.initiatives.length === 0) return 0;
    const total = project.initiatives.reduce((acc, init) => acc + init.progress, 0);
    return Math.round(total / project.initiatives.length);
  };

  const progress = calculateProgress();

  // Milestones counters
  const totalMilestones = project.milestones.length;
  const completedMilestonesCount = project.milestones.filter(m => m.completed).length;

  const upcomingMilestones = [...project.milestones]
    .filter(m => !m.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Timeline & Deadline Logic (Anchor date: 2026-07-18)
  const anchorDate = new Date('2026-07-18');
  const endDate = new Date(project.endDate);
  const diffTime = endDate.getTime() - anchorDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const getDeadlineText = () => {
    if (project.status === 'completed') return 'Completed';
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)}d`;
    } else if (diffDays === 0) {
      return 'Due Today!';
    } else if (diffDays === 1) {
      return 'Due Tomorrow';
    } else {
      return `${diffDays} days left`;
    }
  };

  const isOverdue = diffDays < 0 && project.status !== 'completed';

  // Color Palette Mapping
  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'amber':
        return {
          dot: 'bg-amber-400',
          text: 'text-amber-400',
          progressBar: 'bg-amber-400',
          hoverBorder: 'hover:border-amber-400/30'
        };
      case 'emerald':
        return {
          dot: 'bg-emerald-400',
          text: 'text-emerald-400',
          progressBar: 'bg-emerald-400',
          hoverBorder: 'hover:border-emerald-400/30'
        };
      case 'rose':
        return {
          dot: 'bg-rose-400',
          text: 'text-rose-400',
          progressBar: 'bg-rose-400',
          hoverBorder: 'hover:border-rose-400/30'
        };
      case 'blue':
        return {
          dot: 'bg-blue-400',
          text: 'text-blue-400',
          progressBar: 'bg-blue-400',
          hoverBorder: 'hover:border-blue-400/30'
        };
      case 'violet':
        return {
          dot: 'bg-violet-400',
          text: 'text-violet-400',
          progressBar: 'bg-violet-400',
          hoverBorder: 'hover:border-violet-400/30'
        };
      case 'white':
        return {
          dot: 'bg-white',
          text: 'text-white',
          progressBar: 'bg-white',
          hoverBorder: 'hover:border-white/30'
        };
      default:
        return {
          dot: 'bg-stone-500',
          text: 'text-stone-300',
          progressBar: '',
          hoverBorder: 'hover:border-white/[0.08]'
        };
    }
  };

  const colors = getColorClasses(project.color);

  // Category Styles
  const getCategoryStyles = (category: ProjectCategory) => {
    switch (category) {
      case 'Development':
        return { bg: 'bg-[#18181b]', text: 'text-stone-300', border: 'border-white/[0.06]' };
      case 'Design':
        return { bg: 'bg-[#27272a]', text: 'text-white font-medium', border: 'border-white/[0.12]' };
      case 'Marketing':
        return { bg: 'bg-[#18181b]', text: 'text-stone-300', border: 'border-white/[0.06]' };
      case 'Operations':
        return { bg: 'bg-[#18181b]', text: 'text-stone-300', border: 'border-white/[0.06]' };
      case 'Finance':
        return { bg: 'bg-[#18181b]', text: 'text-stone-300', border: 'border-white/[0.06]' };
      default:
        return { bg: 'bg-[#18181b]', text: 'text-stone-400', border: 'border-white/[0.04]' };
    }
  };

  const catStyles = getCategoryStyles(project.category);

  // Priority Styles
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { 
          label: 'Critical', 
          dot: 'bg-fuchsia-400 animate-pulse', 
          text: 'text-fuchsia-400 font-bold', 
          bg: 'bg-fuchsia-950/40', 
          border: 'border-fuchsia-500/30 shadow-[0_0_8px_rgba(217,70,239,0.15)]' 
        };
      case 'high':
        return { 
          label: 'High', 
          dot: 'bg-red-400', 
          text: 'text-red-400 font-semibold', 
          bg: 'bg-red-950/30', 
          border: 'border-red-500/25 shadow-[0_0_6px_rgba(248,113,113,0.1)]' 
        };
      case 'medium':
        return { 
          label: 'Medium', 
          dot: 'bg-amber-400', 
          text: 'text-amber-400 font-semibold', 
          bg: 'bg-amber-950/20', 
          border: 'border-amber-500/20' 
        };
      case 'low':
      default:
        return { 
          label: 'Low', 
          dot: 'bg-stone-500', 
          text: 'text-stone-400 font-medium', 
          bg: 'bg-stone-900/60', 
          border: 'border-white/[0.04]' 
        };
    }
  };

  const prioStyles = getPriorityBadge(project.priority);

  const getAvatarColor = (name: string) => {
    const palette = [
      'bg-red-500/25 text-red-300 border-red-500/30',
      'bg-amber-500/25 text-amber-300 border-amber-500/30',
      'bg-emerald-500/25 text-emerald-300 border-emerald-500/30',
      'bg-blue-500/25 text-blue-300 border-blue-500/30',
      'bg-indigo-500/25 text-indigo-300 border-indigo-500/30',
      'bg-violet-500/25 text-violet-300 border-violet-500/30',
      'bg-pink-500/25 text-pink-300 border-pink-500/30',
      'bg-teal-500/25 text-teal-300 border-teal-500/30',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palette.length;
    return palette[index];
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : '?';
  };

  // Status Labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return { 
          label: 'Planning', 
          color: 'text-blue-400 bg-blue-950/20 border-blue-500/20',
          dot: 'bg-blue-400'
        };
      case 'active':
        return { 
          label: 'Active', 
          color: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20',
          dot: 'bg-emerald-400 animate-pulse'
        };
      case 'on-hold':
        return { 
          label: 'On Hold', 
          color: 'text-stone-400 bg-stone-900/40 border-stone-800/40',
          dot: 'bg-stone-500'
        };
      case 'completed':
        return { 
          label: 'Completed', 
          color: 'text-indigo-400 bg-indigo-950/20 border-indigo-500/20',
          dot: 'bg-indigo-400'
        };
      case 'archived':
        return { 
          label: 'Archived', 
          color: 'text-stone-500 bg-stone-900/10 border-stone-800/40 opacity-70',
          dot: 'bg-stone-600'
        };
      default:
        return { 
          label: status, 
          color: 'text-stone-400 bg-stone-900 border-white/[0.04]',
          dot: 'bg-stone-400'
        };
    }
  };

  const statusLabel = getStatusLabel(project.status);

  // Get progress bar color (monochrome/stone-themed or custom accent)
  const getProgressBarColor = () => {
    if (colors.progressBar) return colors.progressBar;
    if (project.status === 'completed') return 'bg-white';
    if (progress >= 80) return 'bg-stone-300';
    if (progress >= 40) return 'bg-stone-400';
    return 'bg-stone-600';
  };

  const handleQuickAddSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!quickMilestoneTitle.trim() || !quickMilestoneDate) return;

    if (onUpdateProject) {
      const newMile: MilestoneType = {
        id: `mile-${Date.now()}`,
        title: quickMilestoneTitle.trim(),
        date: quickMilestoneDate,
        completed: false,
        initiativeId: quickMilestoneInitiativeId || undefined,
        weight: quickMilestoneInitiativeId ? quickMilestoneWeight : undefined
      };

      const updatedMilestones = [...project.milestones, newMile].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const updatedHistory: ProjectActivity[] = [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'milestone_added',
          message: `Milestone added: "${newMile.title}" (Dashboard Quick Add)`,
          details: `Target Date: ${newMile.date}${quickMilestoneInitiativeId ? ` | Linked to initiative` : ''}`
        },
        ...(project.history || [])
      ];

      onUpdateProject({
        ...project,
        milestones: updatedMilestones,
        history: updatedHistory
      });
    }

    setQuickMilestoneTitle('');
    setQuickMilestoneInitiativeId('');
    setQuickMilestoneWeight(25);
    setIsQuickAdding(false);
  };

  // Priority strip colors on the left of the card
  const getPriorityStripColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 shadow-[1px_0_8px_rgba(239,68,68,0.3)]';
      case 'high':
        return 'bg-orange-500 shadow-[1px_0_8px_rgba(249,115,22,0.3)]';
      case 'medium':
        return 'bg-blue-500 shadow-[1px_0_8px_rgba(59,130,246,0.2)]';
      case 'low':
      default:
        return 'bg-stone-600';
    }
  };

  const priorityStripColor = getPriorityStripColor(project.priority);

  if (isQuickEditing) {
    return (
      <div 
        id={`project-card-edit-${project.id}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full text-left bg-[#111111] border border-amber-500/30 rounded-xl p-4 pl-5 transition-all duration-300 flex flex-col gap-3 relative focus:outline-none focus:ring-1 focus:ring-stone-600 select-text"
      >
        <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] ${priorityStripColor}`} />
        
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" /> Quick Edit Project
          </span>
          <span className="text-[8px] font-mono text-stone-500 uppercase">
            ID: {project.id}
          </span>
        </div>

        <div className="space-y-3.5">
          {/* Project Name */}
          <div className="space-y-1">
            <label className="text-[8px] text-stone-400 font-bold font-mono uppercase tracking-wider block">Project Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-[#161616] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500 font-sans"
              placeholder="Enter project name..."
              required
            />
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] text-stone-400 font-bold font-mono uppercase tracking-wider block">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as ProjectCategory)}
                className="w-full bg-[#161616] border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-stone-500"
              >
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] text-stone-400 font-bold font-mono uppercase tracking-wider block">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as ProjectPriority)}
                className="w-full bg-[#161616] border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-stone-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[8px] text-stone-400 font-bold font-mono uppercase tracking-wider block">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
              className="w-full bg-[#161616] border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-stone-500"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.04]">
          <button
            type="button"
            onClick={() => {
              setIsQuickEditing(false);
            }}
            className="px-3 py-1 rounded-lg bg-[#161616] border border-white/[0.04] text-stone-400 text-[10px] hover:text-stone-200 font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editName.trim()) return;

              const updatedHistory: ProjectActivity[] = [
                {
                  id: `act-${Date.now()}-quick-edit`,
                  timestamp: new Date().toISOString(),
                  type: 'project_edited',
                  message: `Project updated via Quick Edit`,
                  details: `Name: ${editName} | Category: ${editCategory} | Priority: ${editPriority} | Status: ${editStatus}`
                },
                ...(project.history || [])
              ];

              onUpdateProject({
                ...project,
                name: editName.trim(),
                category: editCategory,
                priority: editPriority,
                status: editStatus,
                history: updatedHistory
              });

              setIsQuickEditing(false);
            }}
            className="px-3.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl w-full" id={`swipeable-wrapper-${project.id}`}>
      {/* UNDERNEATH LAYER: Swipe Actions */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex items-stretch z-0 bg-stone-950 border border-white/[0.04] rounded-xl overflow-hidden select-none"
        style={{ width: '260px' }}
      >
        {/* Pin Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onTogglePinProject) {
              onTogglePinProject(project.id);
            }
            setIsSwipedOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 bg-stone-900/40 hover:bg-stone-850 transition-colors duration-200 border-r border-white/[0.02] ${
            project.pinned ? 'text-amber-500' : 'text-stone-400'
          }`}
          title={project.pinned ? 'Unpin Project' : 'Pin Project'}
        >
          <Pin className={`w-3.5 h-3.5 ${project.pinned ? 'text-amber-500 fill-amber-500/15' : 'text-stone-400/80'}`} />
          <span className="text-[8px] font-bold uppercase tracking-wider">{project.pinned ? 'Unpin' : 'Pin'}</span>
        </button>

        {/* Duplicate Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onDuplicateProject) {
              onDuplicateProject(project);
            }
            setIsSwipedOpen(false);
          }}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-stone-900/60 text-stone-400 hover:bg-stone-850 hover:text-white transition-colors duration-200 border-r border-white/[0.02]"
          title="Duplicate Project"
        >
          <Copy className="w-3.5 h-3.5 text-stone-400/80" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Duplicate</span>
        </button>

        {/* Quick Edit Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleStartQuickEdit();
          }}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-stone-900/60 text-stone-400 hover:bg-stone-850 hover:text-white transition-colors duration-200 border-r border-white/[0.02]"
          title="Quick Edit Project"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500/80" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Quick Edit</span>
        </button>

        {/* Archive Button */}
        <button
          type="button"
          onClick={handleQuickArchive}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-amber-950/15 text-amber-500/80 hover:bg-amber-950/30 hover:text-amber-400 transition-colors duration-200"
          title={project.status === 'archived' ? 'Unarchive Project' : 'Archive Project'}
        >
          <Archive className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[8px] font-bold uppercase tracking-wider">
            {project.status === 'archived' ? 'Restore' : 'Archive'}
          </span>
        </button>
      </div>

      {/* TOP LAYER: Draggable Project Card */}
      <motion.div
        id={`project-card-${project.id}`}
        drag="x"
        dragConstraints={{ left: -260, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.02 }}
        dragMomentum={false}
        animate={{ x: isSwipedOpen ? -260 : 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        onDragEnd={(_event, info) => {
          if (info.offset.x < -45) {
            setIsSwipedOpen(true);
          } else if (info.offset.x > 45) {
            setIsSwipedOpen(false);
          }
        }}
        onClick={(e) => {
          if (isSwipedOpen) {
            e.stopPropagation();
            setIsSwipedOpen(false);
          } else {
            onClick();
          }
        }}
        className={`w-full text-left bg-[#111111] hover:bg-[#151515] border border-white/[0.04] ${colors.hoverBorder} rounded-xl p-4 pl-5 transition-all duration-300 flex flex-col gap-3 group relative focus:outline-none focus:ring-1 focus:ring-stone-600 cursor-pointer overflow-hidden z-10 select-none`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            if (isSwipedOpen) {
              setIsSwipedOpen(false);
            } else {
              onClick();
            }
          }
        }}
        whileTap={isSwipedOpen ? {} : { scale: 0.98 }}
        whileHover={isSwipedOpen ? {} : { scale: 1.002 }}
      >
      {/* Left Priority Strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] ${priorityStripColor}`} />
      {/* Upper Category, Priority & Status Row */}
      <div className="flex items-center justify-between gap-2 w-full text-xs relative">
        {/* Category & Priority Pill on the Left */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${catStyles.bg} ${catStyles.text} ${catStyles.border}`}>
            {project.category}
          </span>
          <button
            type="button"
            onClick={handleCyclePriority}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer ${prioStyles.bg} ${prioStyles.text} ${prioStyles.border || 'border-transparent'}`}
            title="Priority (Click to cycle Low -> Medium -> High -> Critical)"
          >
            <span className={`w-1 h-1 rounded-full ${prioStyles.dot}`} />
            {prioStyles.label}
          </button>
        </div>

        {/* Status Pill and Context Actions on the Right */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span 
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-semibold border ${statusLabel.color}`}
            title={`Status: ${statusLabel.label} (${progress}% overall completion)`}
          >
            <svg className="w-3 h-3 transform -rotate-90 shrink-0" viewBox="0 0 12 12">
              <circle
                cx="6"
                cy="6"
                r="4.5"
                className="stroke-current/15 fill-none"
                strokeWidth="1.5"
              />
              <circle
                cx="6"
                cy="6"
                r="4.5"
                className={`stroke-current fill-none transition-all duration-500 ${
                  statusLabel.dot.includes('animate-pulse') ? 'animate-pulse' : ''
                }`}
                strokeWidth="1.5"
                strokeDasharray={2 * Math.PI * 4.5}
                strokeDashoffset={(2 * Math.PI * 4.5) - (progress / 100) * (2 * Math.PI * 4.5)}
                strokeLinecap="round"
              />
            </svg>
            {statusLabel.label}
          </span>

          {/* Context Menu Dropdown Trigger */}
          {onUpdateProject && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(prev => !prev);
                }}
                className={`p-1 rounded transition-all duration-200 cursor-pointer ${
                  isMenuOpen 
                    ? 'bg-stone-850 text-white border border-white/[0.08]' 
                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900 border border-transparent'
                }`}
                title="Project Menu"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {isMenuOpen && (
                <>
                  {/* Invisible backdrop to dismiss menu on click outside */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }} 
                  />
                  
                  {/* Dropdown Panel */}
                  <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-stone-950 border border-white/[0.08] p-1.5 z-50 shadow-2xl animate-in fade-in duration-100 select-none">
                    <div className="px-2 py-1 mb-1 text-[8px] uppercase tracking-[0.15em] text-stone-500 font-bold border-b border-white/[0.03] font-mono">
                      Quick Actions
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        handleCyclePriority(e);
                      }}
                      className="w-full text-left px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold text-stone-300 hover:text-white hover:bg-stone-900 rounded-lg transition-all flex items-center justify-between group cursor-pointer"
                      title="Cycle Priority (Low -> Medium -> High -> Critical)"
                    >
                      <span className="flex items-center gap-1.5">
                        <ArrowUpDown className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-300 transition-colors" />
                        Cycle Priority
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold ${prioStyles.bg} ${prioStyles.text}`}>
                        {prioStyles.label}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsQuickAdding(prev => !prev);
                        setIsSchedulingReminder(false);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold text-stone-300 hover:text-white hover:bg-stone-900 rounded-lg transition-all flex items-center gap-1.5 group cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-300 transition-colors" />
                      Add Milestone
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSchedulingReminder(prev => !prev);
                        setIsQuickAdding(false);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold text-stone-300 hover:text-white hover:bg-stone-900 rounded-lg transition-all flex items-center gap-1.5 group cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-300 transition-colors" />
                      Set Reminder
                    </button>

                    <div className="border-t border-white/[0.03] mt-1 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onClick();
                        }}
                        className="w-full text-left px-2 py-1.5 text-[9px] uppercase tracking-wider font-bold text-stone-500 hover:text-stone-300 hover:bg-stone-900/40 rounded transition-all cursor-pointer text-center"
                      >
                        Open Details
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title & Description Row with Progress Ring */}
      <div className="flex items-start justify-between gap-4 select-none">
        <div className="flex flex-col gap-1 flex-1">
          <h3 className="font-serif font-light text-base text-white group-hover:text-stone-200 transition-colors leading-snug flex items-center gap-2 flex-wrap">
            {project.pinned && (
              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500/15 shrink-0 transform rotate-45" title="Pinned Initiative" />
            )}
            {project.color && (
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0 animate-pulse`} />
            )}
            <span>{highlightText(project.name, searchQuery)}</span>
          </h3>
          
          {/* Visual Progress Bar beneath Title */}
          <div className="w-full h-[3px] bg-stone-900/80 rounded-full overflow-hidden my-1.5" id={`title-progress-bar-container-${project.id}`}>
            <div 
              id={`title-progress-bar-fill-${project.id}`}
              className={`h-full ${getProgressBarColor()} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed font-sans">
            {highlightText(project.description, searchQuery)}
          </p>
        </div>
        
        {/* Progress Ring visual indicator */}
        <div className="shrink-0 pt-0.5">
          <svg className="w-8 h-8 transform -rotate-90" title={`${progress}% Complete`}>
            {/* Background circle */}
            <circle
              cx="16"
              cy="16"
              r="10"
              className="stroke-stone-900 fill-none"
              strokeWidth="2"
            />
            {/* Progress circle */}
            <circle
              cx="16"
              cy="16"
              r="10"
              className={`${project.status === 'completed' ? 'stroke-stone-200' : colors.dot.replace('bg-', 'stroke-')} fill-none transition-all duration-500`}
              strokeWidth="2"
              strokeDasharray={2 * Math.PI * 10}
              strokeDashoffset={(2 * Math.PI * 10) - (progress / 100) * (2 * Math.PI * 10)}
              strokeLinecap="round"
            />
            {/* Center Text inside the SVG */}
            <text
              x="16"
              y="16"
              dominantBaseline="central"
              textAnchor="middle"
              className="fill-stone-400 font-mono text-[7.5px] font-bold"
              transform="rotate(90 16 16)"
            >
              {progress}
            </text>
          </svg>
        </div>
      </div>

      {/* Project Tags Pills */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 select-none pt-0.5 pb-1">
          {project.tags.map(tag => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] text-[9px] text-stone-400 font-mono transition-colors hover:text-stone-300"
            >
              #{highlightText(tag, searchQuery)}
            </span>
          ))}
        </div>
      )}

      {/* Progress Track */}
      <div className="flex flex-col gap-1.5 mt-1 select-none">
        <div className="flex justify-between items-center text-xs">
          <span className="text-stone-500 font-mono text-[9px] uppercase tracking-wider">Progress</span>
          <span className="text-stone-300 font-semibold font-mono text-[10px]">{progress}%</span>
        </div>
        <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${getProgressBarColor()} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quick Note / Latest Activity Preview */}
      {(project.notes || project.quickNotes || (project.history && project.history.length > 0)) && (
        <div className="mt-2.5 p-2 rounded-lg bg-stone-950/30 border border-white/[0.03] space-y-2 text-[11px] font-sans">
          {project.quickNotes && (
            <div className="flex items-start gap-2 bg-amber-500/5 p-1.5 rounded border border-amber-500/10">
              <StickyNote className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[8px] text-amber-500 uppercase tracking-wider font-mono font-bold block mb-0.5">Transient Memo</span>
                <p className="text-amber-100/90 line-clamp-2 leading-relaxed italic">
                  "{highlightText(project.quickNotes, searchQuery)}"
                </p>
              </div>
            </div>
          )}

          {project.quickNotes && (project.notes || (project.history && project.history.length > 0)) && (
            <div className="border-t border-white/[0.02] h-px" />
          )}

          {project.notes && (
            <div className="flex items-start gap-2">
              <StickyNote className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[8px] text-stone-500 uppercase tracking-wider font-mono font-bold block mb-0.5">Project Notes</span>
                <p className="text-stone-300 line-clamp-2 leading-relaxed">
                  {highlightText(project.notes, searchQuery)}
                </p>
              </div>
            </div>
          )}
          
          {(project.notes || project.quickNotes) && project.history && project.history.length > 0 && (
            <div className="border-t border-white/[0.02] h-px" />
          )}

          {project.history && project.history.length > 0 && (
            <div className="flex items-start gap-2">
              <Activity className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <span className="text-[8px] text-stone-500 uppercase tracking-wider font-mono font-bold">Latest Activity</span>
                  <span className="text-[8px] text-stone-600 font-mono">
                    {(() => {
                      try {
                        const date = new Date(project.history[0].timestamp);
                        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                      } catch {
                        return '';
                      }
                    })()}
                  </span>
                </div>
                <p className="text-stone-300 line-clamp-1 leading-relaxed">
                  {highlightText(project.history[0].message, searchQuery)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checklist / Milestone Meta Counts */}
      <div className="flex items-center justify-between border-t border-white/[0.04] pt-2.5 mt-1 select-none">
        <div className="flex items-center gap-4 text-[10px] text-stone-500 font-mono">
          <div className="flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-stone-600" />
            <span>{project.initiatives.length} Initiatives</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Milestone className="w-3.5 h-3.5 text-stone-600" />
            <span>
              {completedMilestonesCount}/{totalMilestones} Milestones
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        {onUpdateProject && (
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Set Reminder Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsSchedulingReminder(prev => !prev);
                setIsQuickAdding(false);
                setIsPreviewExpanded(false);
              }}
              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 border ${
                project.reminderDateTime
                  ? 'text-amber-400 bg-amber-950/20 border-amber-500/30'
                  : 'text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/[0.05]'
              }`}
            >
              {project.reminderDateTime ? (
                <>
                  <BellRing className="w-3 h-3 text-amber-400 animate-pulse" />
                  Active
                </>
              ) : (
                <>
                  <Bell className="w-3 h-3 text-stone-500" />
                  Set Reminder
                </>
              )}
            </button>

            {/* Quick Add Milestone Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsQuickAdding(prev => !prev);
                setIsSchedulingReminder(false);
                setIsPreviewExpanded(false);
              }}
              className="text-[9px] uppercase tracking-wider font-bold text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 border border-white/[0.05]"
            >
              {isQuickAdding ? 'Cancel' : '+ Quick Add'}
            </button>

            {/* Expand to Preview Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsPreviewExpanded(prev => !prev);
                setIsQuickAdding(false);
                setIsSchedulingReminder(false);
              }}
              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 border ${
                isPreviewExpanded
                  ? 'text-amber-400 bg-amber-950/20 border-amber-500/30'
                  : 'text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/[0.05]'
              }`}
              title="Toggle upcoming milestones preview"
            >
              {isPreviewExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 text-amber-400" />
                  Hide Preview
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 text-stone-500" />
                  Preview
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Milestone Preview Panel */}
      {isPreviewExpanded && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-black/40 border border-white/[0.06] rounded-xl p-3 space-y-2 mt-1 transition-all select-text cursor-default"
        >
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5 mb-1.5">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Milestone className="w-3.5 h-3.5 text-amber-500/80" /> Upcoming Milestones
            </span>
            <span className="text-[8px] font-mono text-stone-500 uppercase">
              Next 3 Checkpoints
            </span>
          </div>

          {upcomingMilestones.length === 0 ? (
            <div className="text-center py-2">
              <p className="text-[10px] text-stone-500 italic">No upcoming milestones remaining.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {upcomingMilestones.map((m) => {
                const isMilestoneOverdue = new Date(m.date).getTime() < new Date('2026-07-18').getTime();
                return (
                  <div 
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-1.5 rounded bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                      <span className="text-xs text-stone-350 font-sans truncate" title={m.title}>
                        {highlightText(m.title, searchQuery)}
                      </span>
                    </div>
                    <span className={`text-[9px] font-mono shrink-0 px-1.5 py-0.5 rounded ${
                      isMilestoneOverdue 
                        ? 'text-red-400 bg-red-950/20 font-bold border border-red-500/10' 
                        : 'text-stone-500 bg-stone-900/40'
                    }`}>
                      {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inline Quick Add Form */}
      {isQuickAdding && onUpdateProject && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-black/40 border border-white/[0.06] rounded-xl p-3 space-y-2.5 mt-1 transition-all select-text"
        >
          <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider font-mono">
            Quick Add Milestone
          </div>
          <input
            type="text"
            placeholder="Milestone checkpoint title..."
            value={quickMilestoneTitle}
            onChange={(e) => setQuickMilestoneTitle(e.target.value)}
            className="w-full bg-[#121212] border border-white/[0.06] rounded-md px-2.5 py-1 text-xs text-stone-200 placeholder-stone-650 focus:outline-none focus:border-stone-500 font-sans"
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] text-stone-500 font-mono block">Link to Initiative</label>
              <select
                value={quickMilestoneInitiativeId}
                onChange={(e) => setQuickMilestoneInitiativeId(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.06] rounded-md px-2 py-0.5 text-[11px] text-stone-300 focus:outline-none focus:border-stone-500"
              >
                <option value="">None (Standalone)</option>
                {project.initiatives.map(init => (
                  <option key={init.id} value={init.id}>
                    {init.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-stone-500 font-mono block">Weight / Impact (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={quickMilestoneWeight}
                onChange={(e) => setQuickMilestoneWeight(Math.max(1, Math.min(100, parseInt(e.target.value) || 0)))}
                disabled={!quickMilestoneInitiativeId}
                className="w-full bg-[#121212] border border-white/[0.06] rounded-md px-2 py-0.5 text-[11px] text-stone-300 focus:outline-none focus:border-stone-500 font-mono disabled:opacity-40"
              />
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[8px] text-stone-500 font-mono block">Target Date</label>
              <input
                type="date"
                value={quickMilestoneDate}
                onChange={(e) => setQuickMilestoneDate(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.06] rounded-md px-2 py-0.5 text-xs text-stone-300 focus:outline-none focus:border-stone-500"
                required
              />
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setQuickMilestoneTitle('');
                  setIsQuickAdding(false);
                }}
                className="px-2 py-1 rounded bg-[#161616] border border-white/[0.04] text-stone-400 text-[10px] hover:text-stone-200 font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickAddSubmit}
                className="px-2.5 py-1 rounded bg-white text-stone-950 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer hover:bg-stone-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Set Reminder Form */}
      {isSchedulingReminder && onUpdateProject && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-black/40 border border-white/[0.06] rounded-xl p-3.5 space-y-3 mt-1 transition-all select-text"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> Schedule Deadline Reminder
            </span>
            {project.reminderDateTime && (
              <button
                type="button"
                onClick={() => {
                  const updatedHistory: ProjectActivity[] = [
                    {
                      id: `act-${Date.now()}-rem-cleared`,
                      timestamp: new Date().toISOString(),
                      type: 'project_edited',
                      message: '⏰ Scheduled deadline reminder cleared',
                    },
                    ...(project.history || [])
                  ];
                  onUpdateProject({
                    ...project,
                    reminderDateTime: undefined,
                    reminderSent: undefined,
                    history: updatedHistory
                  });
                  setIsSchedulingReminder(false);
                }}
                className="text-[8px] uppercase tracking-wider font-bold text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer"
                title="Clear Reminder"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <p className="text-[10px] text-stone-500 leading-normal">
            By default, we set this to the project's deadline date. You can choose any custom date and time.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] text-stone-500 font-bold font-mono uppercase tracking-wider block">Reminder Date</label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.06] rounded-md px-2 py-1 text-xs text-stone-300 focus:outline-none focus:border-stone-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-stone-500 font-bold font-mono uppercase tracking-wider block">Reminder Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.06] rounded-md px-2 py-1 text-xs text-stone-300 focus:outline-none focus:border-stone-500"
                required
              />
            </div>
          </div>

          {project.reminderDateTime && (
            <div className="bg-[#141414] border border-amber-500/10 p-2 rounded text-[10px] text-amber-400/95 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Currently scheduled: {project.reminderDateTime.replace('T', ' at ')}
              </span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setIsSchedulingReminder(false)}
              className="px-2 py-1 rounded bg-[#161616] border border-white/[0.04] text-stone-400 text-[10px] hover:text-stone-200 font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!reminderDate || !reminderTime) return;
                const finalDateTime = `${reminderDate}T${reminderTime}`;
                
                // Request notification permission safely
                if (typeof window !== 'undefined' && 'Notification' in window) {
                  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                    Notification.requestPermission();
                  }
                }

                const updatedHistory: ProjectActivity[] = [
                  {
                    id: `act-${Date.now()}-rem-set`,
                    timestamp: new Date().toISOString(),
                    type: 'project_edited',
                    message: `⏰ Scheduled deadline reminder for ${reminderDate} at ${reminderTime}`,
                  },
                  ...(project.history || [])
                ];

                onUpdateProject({
                  ...project,
                  reminderDateTime: finalDateTime,
                  reminderSent: false,
                  history: updatedHistory
                });

                setIsSchedulingReminder(false);
              }}
              className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-stone-950 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Schedule
            </button>
          </div>
        </div>
      )}

      {/* Footer Row: Days Left + Owner */}
      <div className="flex items-center justify-between text-xs text-stone-500 border-t border-white/[0.04] pt-2.5">
        <div className="flex items-center gap-1.5">
          {isOverdue ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-stone-500" />
          )}
          <span className={`font-medium text-[11px] ${isOverdue ? 'text-red-400 font-semibold' : 'text-stone-400'}`}>
            {getDeadlineText()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Stack of overlapping collaborator avatars */}
          {project.collaborators && project.collaborators.length > 0 && (
            <div className="flex -space-x-1.5 overflow-hidden">
              {project.collaborators.map((collab) => {
                const initials = getInitials(collab);
                const colorClasses = getAvatarColor(collab);
                return (
                  <div
                    key={collab}
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-bold font-mono border border-[#0c0c0c] ${colorClasses} select-none transition-transform hover:-translate-y-0.5 hover:z-10`}
                    title={collab}
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-stone-950/60 py-0.5 px-2 rounded border border-white/[0.04]">
            <User className="w-3 h-3 text-stone-600" />
            <span className="text-[9px] text-stone-400 truncate max-w-[120px] font-mono">
              {highlightText(project.owner.split(' ')[0], searchQuery)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
    </div>
  );
}
