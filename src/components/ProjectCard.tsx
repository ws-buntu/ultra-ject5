import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Project, ProjectCategory, ProjectStatus, Milestone as MilestoneType, ProjectActivity, ProjectPriority } from '../types';
import { Calendar, User, Milestone, ClipboardList, AlertCircle, AlertTriangle, Clock, Plus, Bell, BellRing, Trash2, StickyNote, Activity, MoreVertical, ArrowUpDown, ChevronDown, ChevronUp, Archive, SlidersHorizontal, Pin, Copy, BarChart3, Target, UserPlus, Mail, Send, X, Check, Zap, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import ProjectDeepDiveModal from './ProjectDeepDiveModal';
import { getTagStyle } from '../utils/tagUtils';
import { normalizeGoals } from '../utils/goalUtils';
import { getInitials, getAvatarColor } from '../utils/avatarUtils';
import { getColorClasses } from '../utils/colorUtils';
import { calculateMomentumScore, getMomentumBadge } from '../utils/momentumUtils';

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
  const [reminderDate, setReminderDate] = useState(project.reminderDateTime ? project.reminderDateTime.split('T')[0] : project.endDate);
  const [reminderTime, setReminderTime] = useState(project.reminderDateTime ? project.reminderDateTime.split('T')[1] : '09:00');
  const [earlyWarningEnabled, setEarlyWarningEnabled] = useState(project.earlyWarningEnabled ?? true);

  useEffect(() => {
    if (project.reminderDateTime) {
      setReminderDate(project.reminderDateTime.split('T')[0] || project.endDate);
      setReminderTime(project.reminderDateTime.split('T')[1] || '09:00');
    } else {
      setReminderDate(project.endDate);
      setReminderTime('09:00');
    }
    setEarlyWarningEnabled(project.earlyWarningEnabled ?? true);
  }, [project.reminderDateTime, project.endDate, project.earlyWarningEnabled]);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);

  const [isSwipedOpen, setIsSwipedOpen] = useState(false);
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editCategory, setEditCategory] = useState<ProjectCategory>(project.category);
  const [editPriority, setEditPriority] = useState<ProjectPriority>(project.priority);
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status);

  // Collaborator Invite State & Handler
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState('');

  // Built-in Stopwatch Timer State & Handlers
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);
  const [stopwatchInitiativeId, setStopwatchInitiativeId] = useState<string>(
    project.initiatives && project.initiatives.length > 0 ? project.initiatives[0].id : ''
  );
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [stopwatchToast, setStopwatchToast] = useState<string | null>(null);

  // Active Stopwatch Ticker Effect
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const formatStopwatchTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleLogStopwatchTime = () => {
    if (stopwatchSeconds <= 0) return;

    const chosenInit = project.initiatives ? project.initiatives.find(i => i.id === stopwatchInitiativeId) : undefined;
    const hours = Math.floor(stopwatchSeconds / 3600);
    const mins = Math.floor((stopwatchSeconds % 3600) / 60);
    const secs = stopwatchSeconds % 60;
    
    let durationFormatted = '';
    if (hours > 0) durationFormatted += `${hours}h `;
    if (mins > 0 || hours > 0) durationFormatted += `${mins}m `;
    durationFormatted += `${secs}s`;

    const initiativeName = chosenInit ? `Initiative: "${chosenInit.title}"` : 'General Project Task';
    
    const newActivity: ProjectActivity = {
      id: `act-${Date.now()}-time`,
      timestamp: new Date().toISOString(),
      type: 'time_logged',
      message: `Logged ${durationFormatted} focused time on ${initiativeName}`,
      details: `Tracked using built-in Stopwatch (${formatStopwatchTime(stopwatchSeconds)})`
    };

    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        history: [newActivity, ...(project.history || [])]
      });
    }

    setStopwatchToast(`Logged ${durationFormatted} to Project History!`);
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);
    setTimeout(() => {
      setStopwatchToast(null);
    }, 3500);
  };

  const handleInviteCollaborator = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = inviteEmailInput.trim();
    if (!email) return;

    if (!email.includes('@') || email.length < 5) {
      setInviteFeedback('Please enter a valid email address');
      setTimeout(() => setInviteFeedback(''), 3000);
      return;
    }

    const currentCollabs = project.collaborators || [];
    if (currentCollabs.some(c => c.toLowerCase() === email.toLowerCase())) {
      setInviteFeedback('Email is already a collaborator');
      setTimeout(() => setInviteFeedback(''), 3000);
      return;
    }

    const updatedCollabs = [...currentCollabs, email];
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        collaborators: updatedCollabs,
        history: [
          {
            id: `act-${Date.now()}-invite`,
            timestamp: new Date().toISOString(),
            type: 'project_edited',
            message: `Invited collaborator email: ${email}`,
            details: `Added ${email} to project team`
          },
          ...(project.history || [])
        ]
      });
    }

    setInviteEmailInput('');
    setInviteFeedback(`Invited ${email}!`);
    setTimeout(() => {
      setInviteFeedback('');
      setIsInviteOpen(false);
    }, 1800);
  };

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

    // Trigger subtle tactile feedback
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate([25, 20, 25]);
      } catch {}
    }

    const nextStatus = project.status === 'archived' ? 'active' : 'archived';
    const updatedHistory: ProjectActivity[] = [
      {
        id: `act-${Date.now()}-archive`,
        timestamp: new Date().toISOString(),
        type: 'project_edited',
        message: nextStatus === 'archived' ? 'Project archived' : 'Project unarchived',
        details: nextStatus === 'archived' ? 'Archived via Quick Archive action' : 'Unarchived via Quick Archive action'
      },
      ...(project.history || [])
    ];

    onUpdateProject({
      ...project,
      status: nextStatus,
      history: updatedHistory
    });

    // Provide immediate feedback toast
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ultra_jects_toast', {
          detail: {
            id: `quick-archive-${Date.now()}-${project.id}`,
            projectId: project.id,
            projectName: project.name,
            type: 'reminder',
            message: nextStatus === 'archived'
              ? `"${project.name}" has been moved to archive.`
              : `"${project.name}" has been restored to active initiatives.`
          }
        })
      );
    }

    setIsSwipedOpen(false);
  };

  const handleCyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateProject) return;

    // Trigger haptic vibration feedback if supported
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(30);
      } catch {
        // Silently handle environment missing vibration support
      }
    }

    const priorities: ProjectPriority[] = ['low', 'medium', 'high', 'critical'];
    const currentIndex = priorities.indexOf(project.priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    const nextPriority = priorities[nextIndex];

    const updatedHistory: ProjectActivity[] = [
      {
        id: `act-${Date.now()}-prio-cycle`,
        timestamp: new Date().toISOString(),
        type: 'project_edited',
        message: `Priority changed to ${nextPriority.charAt(0).toUpperCase() + nextPriority.slice(1)} (Quick Edit)`,
        details: `Cycled priority directly from ${project.priority.toUpperCase()} to ${nextPriority.toUpperCase()} on card`
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
          part.toLowerCase() === trimmedQuery.toLowerCase() ? (
            <mark 
              key={index} 
              className="bg-amber-400/35 text-amber-200 px-1 py-0.5 rounded font-bold border-b border-amber-400/50 shadow-sm inline-block"
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

  // Calculate dynamic progress & initiative completion
  const totalInitiativesCount = project.initiatives ? project.initiatives.length : 0;
  const completedInitiativesCount = project.initiatives ? project.initiatives.filter(i => i.completed || i.progress >= 100).length : 0;
  
  // Calculate average completion percentage across all internal initiatives for this project
  const avgInitiativeProgress = totalInitiativesCount > 0 
    ? Math.round(
        project.initiatives.reduce((acc, init) => {
          const val = init.completed ? 100 : Math.min(100, Math.max(0, init.progress || 0));
          return acc + val;
        }, 0) / totalInitiativesCount
      )
    : 0;

  const progress = avgInitiativeProgress;

  // Goals counters
  const cardGoals = normalizeGoals(project.goals);
  const completedGoalsCount = cardGoals.filter(g => g.completed).length;
  const goalProgressPercent = cardGoals.length > 0 ? Math.round((completedGoalsCount / cardGoals.length) * 100) : 0;

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
  const momentumScore = calculateMomentumScore(project);
  const momentumBadge = getMomentumBadge(momentumScore);

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
    <div className="project-card-wrapper relative overflow-hidden rounded-xl w-full" id={`swipeable-wrapper-${project.id}`}>
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
      {/* Color-Coded Top Accent Visual Identifier Stripe */}
      <div className={`absolute top-0 left-0 right-0 h-[4px] ${colors.stripe} opacity-95 group-hover:opacity-100 transition-all duration-300 rounded-t-xl ${colors.glow}`} id={`color-accent-stripe-${project.id}`} title={`Visual Identifier Accent: ${project.color || 'default'}`} />
      
      {/* Left Priority Strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] ${priorityStripColor}`} />
      {/* Upper Category, Priority & Status Row */}
      <div className="flex items-center justify-between gap-2 w-full text-xs relative">
        {/* Category, Priority & Momentum Pill on the Left */}
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${catStyles.bg} ${catStyles.text} ${catStyles.border}`}>
            {highlightText(project.category, searchQuery)}
          </span>
          <button
            type="button"
            onClick={handleCyclePriority}
            className={`group/prio flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all duration-200 hover:scale-105 hover:brightness-120 active:scale-95 cursor-pointer shadow-sm ${prioStyles.bg} ${prioStyles.text} ${prioStyles.border || 'border-transparent'}`}
            title={`Priority: ${prioStyles.label} — Click to cycle priority (Low -> Medium -> High -> Critical)`}
            id={`quick-priority-btn-${project.id}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${prioStyles.dot}`} />
            <span>{prioStyles.label}</span>
            <ArrowUpDown className="w-2.5 h-2.5 opacity-60 group-hover/prio:opacity-100 transition-opacity ml-0.5 text-stone-300" />
          </button>
          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${momentumBadge.colorClass}`}
            title={`Momentum Score: ${momentumScore}/100 (${momentumBadge.label} — factors in deadline proximity, initiative progress %, and priority level)`}
          >
            <Zap className={`w-2.5 h-2.5 ${momentumBadge.iconColor}`} />
            <span>{momentumScore}</span>
          </span>
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

          {/* Subtle Quick Archive Action Button */}
          {onUpdateProject && (
            <button
              type="button"
              onClick={handleQuickArchive}
              className={`quick-archive-btn group/archive px-2 py-0.5 rounded text-[9px] font-mono font-medium transition-all duration-200 cursor-pointer flex items-center gap-1 border select-none ${
                project.status === 'archived'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-stone-400 hover:text-amber-400 border-white/[0.06] hover:border-amber-500/30'
              }`}
              title={project.status === 'archived' ? 'Restore initiative (one-tap)' : 'Quick Archive initiative (one-tap)'}
              aria-label={project.status === 'archived' ? 'Restore initiative' : 'Quick archive initiative'}
            >
              <Archive className={`w-3 h-3 transition-colors ${project.status === 'archived' ? 'text-amber-400' : 'text-stone-400 group-hover/archive:text-amber-400'}`} />
              <span className="uppercase tracking-wider text-[8px] font-bold">
                {project.status === 'archived' ? 'Restore' : 'Archive'}
              </span>
            </button>
          )}

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

                    <button
                      type="button"
                      onClick={(e) => {
                        handleQuickArchive(e);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold text-stone-300 hover:text-amber-400 hover:bg-stone-900 rounded-lg transition-all flex items-center justify-between group cursor-pointer"
                      title={project.status === 'archived' ? 'Restore initiative' : 'Archive initiative with one tap'}
                    >
                      <span className="flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 transition-colors" />
                        {project.status === 'archived' ? 'Restore Project' : 'Archive Project'}
                      </span>
                      <span className="text-[8px] font-mono text-stone-500 group-hover:text-amber-400/80">1-Tap</span>
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
              <span title="Pinned Initiative">
                <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500/15 shrink-0 transform rotate-45" />
              </span>
            )}
            {project.color && (
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0 animate-pulse`} />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeepDiveOpen(true);
              }}
              className="text-left font-serif font-light text-base text-white hover:text-amber-400 hover:underline underline-offset-4 transition-colors cursor-pointer flex items-center gap-1.5 group/title"
              title="Click to view Deep Dive Statistics (Days active, avg completion speed, contributor distribution)"
              id={`deep-dive-trigger-${project.id}`}
            >
              <span>{highlightText(project.name, searchQuery)}</span>
              <BarChart3 className="w-3.5 h-3.5 text-stone-500 opacity-60 group-hover/title:opacity-100 group-hover/title:text-amber-400 transition-all shrink-0 ml-0.5" />
            </button>
          </h3>
          
          {/* Visual Progress Bar beneath Title with Initiatives Average Completion % */}
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mt-1 mb-0.5">
            <span className="flex items-center gap-1 font-medium text-stone-400">
              <span className="text-stone-500 text-[9px] uppercase tracking-wider font-bold">Initiative Progress</span>
              <span className="text-amber-400 font-bold ml-0.5">{completedInitiativesCount}</span>
              <span className="text-stone-600">/</span>
              <span className="text-stone-300 font-semibold">{totalInitiativesCount}</span>
            </span>
            <span className="text-[10px] font-bold text-amber-300/90 font-mono" title="Average completion percentage across internal initiatives">
              {avgInitiativeProgress}% avg
            </span>
          </div>

          <div 
            className="w-full h-[4px] bg-stone-900/80 rounded-full overflow-hidden mb-1.5 border border-white/[0.04]" 
            id={`title-progress-bar-container-${project.id}`}
            title={`Average Initiative Completion: ${avgInitiativeProgress}% (${completedInitiativesCount}/${totalInitiativesCount} fully completed)`}
          >
            <div 
              id={`title-progress-bar-fill-${project.id}`}
              className={`h-full ${getProgressBarColor()} rounded-full transition-all duration-500`}
              style={{ width: `${avgInitiativeProgress}%` }}
            />
          </div>

          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed font-sans">
            {highlightText(project.description, searchQuery)}
          </p>
        </div>
        
        {/* Progress Ring visual indicator */}
        <div 
          className="shrink-0 pt-0.5"
          title={`Average Initiative Completion: ${avgInitiativeProgress}% across ${totalInitiativesCount} initiatives`}
        >
          <svg className="w-8 h-8 transform -rotate-90">
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
              className={`${project.status === 'completed' || avgInitiativeProgress === 100 ? 'stroke-emerald-400' : colors.dot.replace('bg-', 'stroke-')} fill-none transition-all duration-500`}
              strokeWidth="2"
              strokeDasharray={2 * Math.PI * 10}
              strokeDashoffset={(2 * Math.PI * 10) - (avgInitiativeProgress / 100) * (2 * Math.PI * 10)}
              strokeLinecap="round"
            />
            {/* Center Text inside the SVG */}
            <text
              x="16"
              y="16"
              dominantBaseline="central"
              textAnchor="middle"
              className="fill-stone-300 font-mono text-[7.5px] font-bold"
              transform="rotate(90 16 16)"
            >
              {avgInitiativeProgress}%
            </text>
          </svg>
        </div>
      </div>

      {/* Project Tags Pills */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 select-none pt-0.5 pb-1">
          {project.tags.map(tag => {
            const style = getTagStyle(tag);
            return (
              <span
                key={tag}
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border text-[9.5px] font-mono font-medium shadow-sm transition-all duration-200 ${style}`}
              >
                <span className="opacity-60 text-[8.5px] font-bold">#</span>
                {highlightText(tag, searchQuery)}
              </span>
            );
          })}
        </div>
      )}

      {/* Project Goals Summary Badge */}
      {cardGoals.length > 0 && (
        <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 bg-stone-950/60 p-1.5 px-2 rounded-lg border border-white/[0.04] mt-0.5 select-none">
          <span className="flex items-center gap-1.5 text-stone-300">
            <Target className="w-3 h-3 text-amber-400" />
            <span className="font-sans font-medium text-[10px] text-stone-300">Goals</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-semibold">
              {completedGoalsCount}/{cardGoals.length}
            </span>
            <span className="text-amber-400 font-bold">
              ({goalProgressPercent}%)
            </span>
          </div>
        </div>
      )}

      {/* Progress Track */}
      <div className="flex flex-col gap-1.5 mt-1 select-none">
        <div className="flex justify-between items-center text-xs">
          <span className="text-stone-500 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5">
            Initiatives Completion
            <span className="text-stone-400 font-mono font-semibold text-[9px]">({completedInitiativesCount}/{totalInitiativesCount})</span>
          </span>
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
            {/* Stopwatch Timer Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsStopwatchOpen(prev => !prev);
                setIsQuickAdding(false);
                setIsSchedulingReminder(false);
                setIsPreviewExpanded(false);
              }}
              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 border ${
                isStopwatchRunning || stopwatchSeconds > 0 || isStopwatchOpen
                  ? 'text-emerald-400 bg-emerald-950/30 border-emerald-500/40'
                  : 'text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/[0.05]'
              }`}
              title="Built-in Stopwatch Timer to track initiative time"
              id={`stopwatch-trigger-btn-${project.id}`}
            >
              <Timer className={`w-3 h-3 ${isStopwatchRunning ? 'text-emerald-400 animate-pulse' : 'text-stone-400'}`} />
              {isStopwatchRunning || stopwatchSeconds > 0 ? (
                <span className="font-mono">{formatStopwatchTime(stopwatchSeconds)}</span>
              ) : (
                'Stopwatch'
              )}
            </button>

            {/* Set Reminder Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsSchedulingReminder(prev => !prev);
                setIsQuickAdding(false);
                setIsStopwatchOpen(false);
                setIsPreviewExpanded(false);
              }}
              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 border ${
                project.reminderDateTime || project.earlyWarningEnabled
                  ? 'text-amber-400 bg-amber-950/20 border-amber-500/30'
                  : 'text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/[0.05]'
              }`}
            >
              {project.reminderDateTime || project.earlyWarningEnabled ? (
                <>
                  <BellRing className="w-3 h-3 text-amber-400 animate-pulse" />
                  {project.earlyWarningEnabled ? 'Active (24h Alert)' : 'Active'}
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
                setIsStopwatchOpen(false);
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
                setIsStopwatchOpen(false);
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

      {/* Stopwatch Timer Drawer Panel */}
      {isStopwatchOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-[#121212] to-[#0d0d0d] border border-emerald-500/30 rounded-xl p-3.5 space-y-3 mt-1.5 transition-all select-text shadow-lg"
          id={`stopwatch-panel-${project.id}`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Timer className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-bold text-stone-200 uppercase tracking-wider font-mono">
                Initiative Stopwatch Timer
              </span>
            </div>
            {isStopwatchRunning && (
              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                TIMING ACTIVE
              </span>
            )}
          </div>

          {/* Toast Banner */}
          {stopwatchToast && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 animate-bounce">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span>{stopwatchToast}</span>
            </div>
          )}

          {/* Initiative Selection */}
          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
              Track Time For Initiative:
            </label>
            <select
              value={stopwatchInitiativeId}
              onChange={(e) => setStopwatchInitiativeId(e.target.value)}
              className="w-full bg-[#181818] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
            >
              {project.initiatives && project.initiatives.length > 0 ? (
                project.initiatives.map((init) => (
                  <option key={init.id} value={init.id}>
                    {init.title} {init.completed ? '(Completed)' : `(${init.progress}%)`}
                  </option>
                ))
              ) : (
                <option value="">General Project Task</option>
              )}
            </select>
          </div>

          {/* Digital Timer Counter Display */}
          <div className="bg-black/60 border border-white/[0.05] rounded-xl p-3 flex flex-col items-center justify-center space-y-1">
            <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest font-bold">
              Elapsed Time
            </span>
            <span className="text-3xl font-mono font-bold tracking-widest text-emerald-400 tabular-nums">
              {formatStopwatchTime(stopwatchSeconds)}
            </span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              {/* Start / Pause */}
              <button
                type="button"
                onClick={() => setIsStopwatchRunning(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isStopwatchRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-md'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-stone-950 shadow-md'
                }`}
              >
                {isStopwatchRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Start
                  </>
                )}
              </button>

              {/* Reset */}
              <button
                type="button"
                onClick={() => {
                  setIsStopwatchRunning(false);
                  setStopwatchSeconds(0);
                }}
                disabled={stopwatchSeconds === 0}
                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 text-xs font-mono font-medium flex items-center gap-1 border border-white/[0.05] transition-all cursor-pointer"
                title="Reset stopwatch counter"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-400" /> Reset
              </button>
            </div>

            {/* Log to History */}
            <button
              type="button"
              onClick={handleLogStopwatchTime}
              disabled={stopwatchSeconds === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 disabled:opacity-40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
              title="Log tracked time session to project history"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> Log Session
            </button>
          </div>
        </div>
      )}

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

      {/* Inline Set Reminder & Early Warning Form */}
      {isSchedulingReminder && onUpdateProject && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-black/50 border border-white/[0.08] rounded-xl p-3.5 space-y-3 mt-1 transition-all select-text shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> Deadline Reminder & Alerts
            </span>
            {(project.reminderDateTime || project.earlyWarningEnabled) && (
              <button
                type="button"
                onClick={() => {
                  const updatedHistory: ProjectActivity[] = [
                    {
                      id: `act-${Date.now()}-rem-cleared`,
                      timestamp: new Date().toISOString(),
                      type: 'project_edited',
                      message: '⏰ Scheduled deadline reminder and early warning cleared',
                    },
                    ...(project.history || [])
                  ];
                  onUpdateProject({
                    ...project,
                    reminderDateTime: undefined,
                    reminderSent: undefined,
                    earlyWarningEnabled: false,
                    earlyWarningSent: false,
                    history: updatedHistory
                  });
                  setIsSchedulingReminder(false);
                }}
                className="text-[8px] uppercase tracking-wider font-bold text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer"
                title="Clear Reminder and Alerts"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <p className="text-[10px] text-stone-400 leading-normal">
            Configure deadline reminders and toggle <span className="text-amber-400 font-semibold">24-hour early warnings</span> to trigger high-priority alert toasts.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] text-stone-400 font-bold font-mono uppercase tracking-wider block">Target Date</label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-stone-400 font-bold font-mono uppercase tracking-wider block">Target Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>
          </div>

          {/* 24-Hour Early Warning Notification Toggle */}
          <div className="bg-[#141414] border border-white/[0.06] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${earlyWarningEnabled ? 'bg-amber-400/20 text-amber-400' : 'bg-stone-800 text-stone-500'}`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-200 block font-mono">
                    24-Hour Early Warning
                  </span>
                  <span className="text-[9px] text-stone-500 leading-tight block">
                    Trigger custom toast notification 24 hours prior to deadline
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setEarlyWarningEnabled(!earlyWarningEnabled)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none flex items-center cursor-pointer ${
                  earlyWarningEnabled ? 'bg-amber-400' : 'bg-stone-800'
                }`}
                title="Toggle 24-Hour Early Warning Notification"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-stone-950 shadow-md transform transition-transform duration-200 ${
                    earlyWarningEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {earlyWarningEnabled && (
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                <span className="text-[9px] text-amber-400/90 font-mono flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  Alerts 24h before: {reminderDate} at {reminderTime}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(
                        new CustomEvent('ultra_jects_toast', {
                          detail: {
                            id: `early-warn-test-${Date.now()}-${project.id}`,
                            projectId: project.id,
                            projectName: project.name,
                            type: 'early_warning',
                            deadlineText: `${reminderDate} at ${reminderTime}`,
                            message: `The deadline for "${project.name}" is in 24 hours (${reminderDate} at ${reminderTime})! Time to finalize deliverables and review checkpoints.`
                          }
                        })
                      );
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                  title="Simulate and test 24h early warning toast"
                >
                  Test Toast
                </button>
              </div>
            )}
          </div>

          {(project.reminderDateTime || project.earlyWarningEnabled) && (
            <div className="bg-[#141414] border border-amber-500/15 p-2 rounded text-[10px] text-amber-400/95 font-mono flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  {project.reminderDateTime ? project.reminderDateTime.replace('T', ' at ') : project.endDate}
                </span>
              </div>
              {project.earlyWarningEnabled && (
                <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold uppercase tracking-wider">
                  ⚡ 24h Alert On
                </span>
              )}
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
                    message: `⏰ Scheduled deadline reminder for ${reminderDate} at ${reminderTime} with 24h Early Warning ${earlyWarningEnabled ? 'ENABLED' : 'DISABLED'}`,
                  },
                  ...(project.history || [])
                ];

                onUpdateProject({
                  ...project,
                  reminderDateTime: finalDateTime,
                  reminderSent: false,
                  earlyWarningEnabled: earlyWarningEnabled,
                  earlyWarningSent: false,
                  history: updatedHistory
                });

                setIsSchedulingReminder(false);
              }}
              className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-stone-950 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Save Schedule
            </button>
          </div>
        </div>
      )}

      {/* Footer Row: Deadline + Team Summary Avatars */}
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

        {/* Visual Team Summary: Owner Avatar + Collaborator Avatar Stack + Invite Button */}
        <div className="flex items-center gap-2 relative" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center -space-x-1.5 overflow-visible">
            {/* Owner Avatar Badge */}
            <div
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/60 select-none z-10 transition-transform hover:-translate-y-0.5 hover:z-30 cursor-help"
              title={`Owner: ${project.owner}`}
            >
              {getInitials(project.owner)}
            </div>

            {/* Collaborators Stack */}
            {project.collaborators && project.collaborators.length > 0 && (
              <>
                {project.collaborators.slice(0, 3).map((collab) => (
                  <div
                    key={collab}
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-bold font-mono border border-[#0c0c0c] ${getAvatarColor(collab)} select-none transition-transform hover:-translate-y-0.5 hover:z-30 cursor-help`}
                    title={`Collaborator: ${collab}`}
                  >
                    {getInitials(collab)}
                  </div>
                ))}
                {project.collaborators.length > 3 && (
                  <div
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[7.5px] font-bold font-mono bg-stone-900 text-stone-400 border border-stone-700 select-none transition-transform hover:-translate-y-0.5 hover:z-30 cursor-help"
                    title={`+${project.collaborators.length - 3} more collaborators: ${project.collaborators.slice(3).join(', ')}`}
                  >
                    +{project.collaborators.length - 3}
                  </div>
                )}
              </>
            )}

            {/* Invite Collaborator Trigger */}
            {onUpdateProject && (
              <button
                type="button"
                onClick={() => setIsInviteOpen(prev => !prev)}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-400 border border-stone-700 hover:border-amber-500/50 transition-all cursor-pointer ml-1.5 z-20 shadow-sm"
                title="Invite collaborator by email"
              >
                <UserPlus className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline Collaborator Invite Form Popup */}
      {isInviteOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="mt-2 p-2.5 rounded-xl bg-stone-950/95 border border-amber-500/30 shadow-2xl space-y-2 text-xs animate-in fade-in duration-150 select-text"
        >
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-amber-400" /> Invite Collaborator
            </span>
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="text-stone-500 hover:text-stone-300 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <form onSubmit={handleInviteCollaborator} className="flex gap-1.5 pt-0.5">
            <input
              type="email"
              placeholder="e.g. alex@company.com"
              value={inviteEmailInput}
              onChange={(e) => setInviteEmailInput(e.target.value)}
              className="flex-1 bg-stone-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 font-sans"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inviteEmailInput.trim()}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 disabled:opacity-40 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Send className="w-3 h-3" /> Invite
            </button>
          </form>

          {inviteFeedback && (
            <p className={`text-[10px] font-mono ${inviteFeedback.includes('Invited') ? 'text-emerald-400 font-semibold' : 'text-amber-400'}`}>
              {inviteFeedback}
            </p>
          )}
        </div>
      )}
    </motion.div>

    {/* Project Deep Dive Analytics Modal */}
    {isDeepDiveOpen && (
      <ProjectDeepDiveModal
        project={project}
        onClose={() => setIsDeepDiveOpen(false)}
      />
    )}
    </div>
  );
}
