import React, { useState, useEffect } from 'react';
import { Project, Initiative, Milestone, ProjectStatus, ProjectPriority, ProjectActivity, ProjectGoal } from '../types';
import ActivityLog from './ActivityLog';
import ProjectNotesTab from './ProjectNotesTab';
import { getTagStyle } from '../utils/tagUtils';
import { normalizeGoals } from '../utils/goalUtils';
import { getInitials, getAvatarColor } from '../utils/avatarUtils';
import { 
  X, Plus, Trash2, Check, Clock, Calendar, 
  User, CheckSquare, Square, AlertCircle, AlertTriangle, Sparkles, 
  ChevronRight, Edit, AlertOctagon, CornerDownRight, Download, Share2,
  Activity, History, Milestone as MilestoneIcon, Percent, Tag, Users,
  Bold, Italic, Heading, List, Code, Link, Eye, FileText, Copy, StickyNote, BookOpen,
  Archive, ArchiveRestore, CheckCircle2, Target, BarChart3, Bell, Zap
} from 'lucide-react';
import { dispatchEarlyWarningToast } from '../utils/deadlineUtils';

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
  onUpdateProject: (updatedProject: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onEditProjectClick: () => void;
  onExportProject?: (project: Project) => void;
}

const RichTextRenderer = ({ content }: { content: string }) => {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');
  const elements: React.JSX.Element[] = [];
  
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentListItems: string[] = [];

  const flushList = (key: string | number) => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="my-2.5 space-y-1.5 font-sans text-xs text-stone-300">
          {currentListItems.map((item, i) => {
            const isChecked = item.startsWith('[x] ') || item.startsWith('[X] ');
            const isUnchecked = item.startsWith('[ ] ');
            if (isChecked || isUnchecked) {
              const textContent = item.substring(4);
              return (
                <li key={`li-${i}`} className="flex items-start gap-2 list-none">
                  <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded shrink-0 mt-0.5 border text-[9px] ${
                    isChecked 
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold' 
                      : 'bg-stone-900 border-stone-700 text-stone-500'
                  }`}>
                    {isChecked ? '✓' : ''}
                  </span>
                  <span className={isChecked ? 'line-through text-stone-500' : ''}>
                    {renderInline(textContent)}
                  </span>
                </li>
              );
            }
            return (
              <li key={`li-${i}`} className="list-disc ml-5">
                {renderInline(item)}
              </li>
            );
          })}
        </ul>
      );
      currentListItems = [];
    }
  };

  const renderInline = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let tempText = text;
    let index = 0;

    while (tempText.length > 0) {
      const boldIdx = tempText.indexOf('**');
      const italicIdx = tempText.indexOf('*');
      const codeIdx = tempText.indexOf('`');
      const linkIdx = tempText.indexOf('[');

      const indices = [
        { type: 'bold', index: boldIdx },
        { type: 'italic', index: italicIdx },
        { type: 'code', index: codeIdx },
        { type: 'link', index: linkIdx }
      ].filter(item => item.index !== -1);

      if (indices.length === 0) {
        tokens.push(<span key={`text-${index}`}>{tempText}</span>);
        break;
      }

      indices.sort((a, b) => a.index - b.index);
      const closest = indices[0];

      if (closest.index > 0) {
        tokens.push(<span key={`text-${index}`}>{tempText.substring(0, closest.index)}</span>);
        index++;
      }

      tempText = tempText.substring(closest.index);

      if (closest.type === 'bold') {
        const endBoldIdx = tempText.indexOf('**', 2);
        if (endBoldIdx !== -1) {
          const content = tempText.substring(2, endBoldIdx);
          tokens.push(<strong key={`bold-${index}`} className="font-bold text-stone-100">{renderInline(content)}</strong>);
          tempText = tempText.substring(endBoldIdx + 2);
        } else {
          tokens.push(<span key={`bold-err-${index}`}>**</span>);
          tempText = tempText.substring(2);
        }
      } else if (closest.type === 'italic') {
        const endItalicIdx = tempText.indexOf('*', 1);
        if (endItalicIdx !== -1) {
          const content = tempText.substring(1, endItalicIdx);
          tokens.push(<em key={`italic-${index}`} className="italic text-stone-200">{renderInline(content)}</em>);
          tempText = tempText.substring(endItalicIdx + 1);
        } else {
          tokens.push(<span key={`italic-err-${index}`}>*</span>);
          tempText = tempText.substring(1);
        }
      } else if (closest.type === 'code') {
        const endCodeIdx = tempText.indexOf('`', 1);
        if (endCodeIdx !== -1) {
          const content = tempText.substring(1, endCodeIdx);
          tokens.push(<code key={`code-${index}`} className="px-1.5 py-0.5 rounded bg-stone-900 border border-white/[0.08] font-mono text-[10px] text-emerald-400">{content}</code>);
          tempText = tempText.substring(endCodeIdx + 1);
        } else {
          tokens.push(<span key={`code-err-${index}`}>`</span>);
          tempText = tempText.substring(1);
        }
      } else if (closest.type === 'link') {
        const endBracketIdx = tempText.indexOf(']');
        const startParenIdx = tempText.indexOf('(', endBracketIdx);
        const endParenIdx = tempText.indexOf(')', startParenIdx);

        if (endBracketIdx !== -1 && startParenIdx === endBracketIdx + 1 && endParenIdx !== -1) {
          const linkText = tempText.substring(1, endBracketIdx);
          const linkUrl = tempText.substring(startParenIdx + 1, endParenIdx);
          tokens.push(
            <a 
              key={`link-${index}`} 
              href={linkUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-amber-400 underline decoration-amber-500/40 hover:text-amber-300 transition-colors font-semibold"
            >
              {linkText}
            </a>
          );
          tempText = tempText.substring(endParenIdx + 1);
        } else {
          tokens.push(<span key={`link-err-${index}`}>[</span>);
          tempText = tempText.substring(1);
        }
      }
      index++;
    }

    return tokens;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`codeblock-${i}`} className="p-3 rounded-xl bg-stone-950 border border-white/[0.04] font-mono text-[10.5px] text-stone-300 overflow-x-auto my-2.5 leading-relaxed">
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList(i);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      flushList(i);
      elements.push(<h1 key={`h1-${i}`} className="text-sm font-semibold text-stone-100 font-sans tracking-tight pt-2 pb-1 border-b border-white/[0.03] mb-1.5">{renderInline(line.substring(2))}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList(i);
      elements.push(<h2 key={`h2-${i}`} className="text-xs font-semibold text-stone-100 font-sans tracking-tight pt-2 pb-1">{renderInline(line.substring(3))}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      flushList(i);
      elements.push(<h3 key={`h3-${i}`} className="text-[11px] font-semibold text-stone-200 font-sans tracking-tight pt-2 pb-1">{renderInline(line.substring(4))}</h3>);
      continue;
    }

    if (line.startsWith('> ')) {
      flushList(i);
      elements.push(
        <blockquote key={`bq-${i}`} className="pl-3 border-l-2 border-amber-500/60 italic text-stone-400 font-sans text-xs my-2.5 bg-white/[0.01] py-1 pr-2 rounded-r">
          {renderInline(line.substring(2))}
        </blockquote>
      );
      continue;
    }

    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      currentListItems.push(trimmedLine.substring(2));
      continue;
    }

    if (trimmedLine === '') {
      flushList(i);
      elements.push(<div key={`space-${i}`} className="h-2" />);
    } else {
      flushList(i);
      elements.push(
        <p key={`p-${i}`} className="text-xs text-stone-300/90 leading-relaxed font-sans mb-1.5">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList('final');

  return <div className="space-y-1">{elements}</div>;
};

export default function ProjectModal({ 
  project, 
  onClose, 
  onUpdateProject, 
  onDeleteProject,
  onEditProjectClick,
  onExportProject
}: ProjectModalProps) {
  // Tabs: 'initiatives' | 'milestones' | 'activity' | 'summary' | 'notes'
  const [activeSubTab, setActiveSubTab] = useState<'initiatives' | 'milestones' | 'activity' | 'summary' | 'notes'>('summary');
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  // Input states for creating initiative
  const [newInitiativeTitle, setNewInitiativeTitle] = useState('');
  
  // Input states for creating milestone
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('2026-07-20');
  const [newMilestoneNotes, setNewMilestoneNotes] = useState('');
  const [newMilestoneInitiativeId, setNewMilestoneInitiativeId] = useState('');
  const [newMilestoneWeight, setNewMilestoneWeight] = useState<number>(25);
  
  // Confirm Delete safety
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Archive & Haptic state
  const [archiveToast, setArchiveToast] = useState<{ show: boolean; message: string; action: 'archive' | 'unarchive' } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Web Share API Toast state
  const [shareToast, setShareToast] = useState<{ show: boolean; message: string } | null>(null);

  const [isEditingTags, setIsEditingTags] = useState(false);
  const [modalCustomTagInput, setModalCustomTagInput] = useState('');

  const handleTogglePresetTagInModal = (tag: string) => {
    const cleanedTag = tag.toLowerCase().trim().replace(/^#/, '');
    const currentTags = project.tags || [];
    let updatedTags: string[];
    if (currentTags.includes(cleanedTag)) {
      updatedTags = currentTags.filter(t => t !== cleanedTag);
    } else {
      updatedTags = [...currentTags, cleanedTag];
    }
    
    onUpdateProject({
      ...project,
      tags: updatedTags,
      history: [
        {
          id: `act-${Date.now()}-tags`,
          timestamp: new Date().toISOString(),
          type: 'project_edited',
          message: `Tags updated: ${updatedTags.map(t => `#${t}`).join(', ') || 'None'}`
        },
        ...(project.history || [])
      ]
    });
  };

  const handleAddCustomTagInModal = () => {
    const cleaned = modalCustomTagInput.toLowerCase().trim().replace(/^#/, '');
    if (cleaned) {
      const currentTags = project.tags || [];
      if (!currentTags.includes(cleaned)) {
        const updatedTags = [...currentTags, cleaned];
        onUpdateProject({
          ...project,
          tags: updatedTags,
          history: [
            {
              id: `act-${Date.now()}-tags`,
              timestamp: new Date().toISOString(),
              type: 'project_edited',
              message: `Added tag #${cleaned}`
            },
            ...(project.history || [])
          ]
        });
      }
    }
    setModalCustomTagInput('');
  };

  const handleModalTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAddCustomTagInModal();
    }
  };

  const [isEditingCollaborators, setIsEditingCollaborators] = useState(false);
  const [modalCollaboratorInput, setModalCollaboratorInput] = useState('');

  const handleRemoveCollaboratorInModal = (collab: string) => {
    const currentCollabs = project.collaborators || [];
    const updatedCollabs = currentCollabs.filter(c => c !== collab);

    onUpdateProject({
      ...project,
      collaborators: updatedCollabs,
      history: [
        {
          id: `act-${Date.now()}-collab-remove`,
          timestamp: new Date().toISOString(),
          type: 'project_edited',
          message: `Removed collaborator: ${collab}`
        },
        ...(project.history || [])
      ]
    });
  };

  const handleAddCollaboratorInModal = () => {
    const name = modalCollaboratorInput.trim();
    if (name) {
      const currentCollabs = project.collaborators || [];
      if (!currentCollabs.includes(name)) {
        const updatedCollabs = [...currentCollabs, name];
        onUpdateProject({
          ...project,
          collaborators: updatedCollabs,
          history: [
            {
              id: `act-${Date.now()}-collab-add`,
              timestamp: new Date().toISOString(),
              type: 'project_edited',
              message: `Added collaborator: ${name}`
            },
            ...(project.history || [])
          ]
        });
      }
    }
    setModalCollaboratorInput('');
  };

  const handleModalCollaboratorInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAddCollaboratorInModal();
    }
  };

  // --- PROJECT GOALS STATE & HANDLERS ---
  const [newGoalInput, setNewGoalInput] = useState('');

  const normalizedGoals = normalizeGoals(project.goals);
  const completedGoalsCount = normalizedGoals.filter(g => g.completed).length;
  const goalProgressPercent = normalizedGoals.length > 0 
    ? Math.round((completedGoalsCount / normalizedGoals.length) * 100) 
    : 0;

  const handleToggleGoalInModal = (goalId: string) => {
    const current = normalizeGoals(project.goals);
    const target = current.find(g => g.id === goalId);
    if (!target) return;

    const nextCompleted = !target.completed;
    const updated = current.map(g => g.id === goalId ? { ...g, completed: nextCompleted } : g);

    onUpdateProject({
      ...project,
      goals: updated,
      history: [
        {
          id: `act-${Date.now()}-goal-toggle`,
          timestamp: new Date().toISOString(),
          type: 'project_edited',
          message: `Goal "${target.text}" marked as ${nextCompleted ? 'completed' : 'incomplete'}`
        },
        ...(project.history || [])
      ]
    });
  };

  const handleAddGoalInModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newGoalInput.trim();
    if (!trimmed) return;

    const current = normalizeGoals(project.goals);
    const newGoalObj: ProjectGoal = {
      id: `goal-${Date.now()}`,
      text: trimmed,
      completed: false
    };

    const updated = [...current, newGoalObj];
    setNewGoalInput('');

    onUpdateProject({
      ...project,
      goals: updated,
      history: [
        {
          id: `act-${Date.now()}-goal-add`,
          timestamp: new Date().toISOString(),
          type: 'project_edited',
          message: `Added goal "${trimmed}"`
        },
        ...(project.history || [])
      ]
    });
  };

  const handleRemoveGoalInModal = (goalId: string) => {
    const current = normalizeGoals(project.goals);
    const target = current.find(g => g.id === goalId);
    const updated = current.filter(g => g.id !== goalId);

    onUpdateProject({
      ...project,
      goals: updated,
      history: [
        {
          id: `act-${Date.now()}-goal-remove`,
          timestamp: new Date().toISOString(),
          type: 'project_edited',
          message: `Removed goal "${target?.text || 'Goal'}"`
        },
        ...(project.history || [])
      ]
    });
  };

  const anchorDate = new Date('2026-07-18');

  // Helper: Recalculate progress after modifications
  const syncProjectProgress = (updatedProject: Project) => {
    onUpdateProject(updatedProject);
  };

  // --- INITIATIVE ACTIONS ---
  const handleAddInitiative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInitiativeTitle.trim()) return;

    const newInit: Initiative = {
      id: `init-${Date.now()}`,
      title: newInitiativeTitle.trim(),
      progress: 0,
      completed: false
    };

    const updatedProject = {
      ...project,
      initiatives: [...project.initiatives, newInit]
    };

    syncProjectProgress(updatedProject);
    setNewInitiativeTitle('');
  };

  const handleToggleInitiative = (initId: string) => {
    const updatedInitiatives = project.initiatives.map(init => {
      if (init.id === initId) {
        const nextCompleted = !init.completed;
        return {
          ...init,
          completed: nextCompleted,
          progress: nextCompleted ? 100 : 0
        };
      }
      return init;
    });

    syncProjectProgress({
      ...project,
      initiatives: updatedInitiatives
    });
  };

  const handleProgressSliderChange = (initId: string, value: number) => {
    const updatedInitiatives = project.initiatives.map(init => {
      if (init.id === initId) {
        return {
          ...init,
          progress: value,
          completed: value === 100
        };
      }
      return init;
    });

    syncProjectProgress({
      ...project,
      initiatives: updatedInitiatives
    });
  };

  const handleDeleteInitiative = (initId: string) => {
    const updatedInitiatives = project.initiatives.filter(init => init.id !== initId);
    syncProjectProgress({
      ...project,
      initiatives: updatedInitiatives
    });
  };

  // --- MILESTONE ACTIONS ---
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !newMilestoneDate) return;

    const newMile: Milestone = {
      id: `mile-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      date: newMilestoneDate,
      completed: false,
      notes: newMilestoneNotes.trim() || undefined,
      initiativeId: newMilestoneInitiativeId || undefined,
      weight: newMilestoneInitiativeId ? newMilestoneWeight : undefined
    };

    // Sort milestones chronologically by date
    const updatedMilestones = [...project.milestones, newMile].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const updatedHistory: ProjectActivity[] = [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'milestone_added',
        message: `Milestone added: "${newMile.title}"`,
        details: `Target Date: ${newMile.date}${newMilestoneInitiativeId ? ` | Linked to initiative` : ''}`
      },
      ...(project.history || [])
    ];

    onUpdateProject({
      ...project,
      milestones: updatedMilestones,
      history: updatedHistory
    });

    setNewMilestoneTitle('');
    setNewMilestoneNotes('');
    setNewMilestoneInitiativeId('');
    setNewMilestoneWeight(25);
  };

  const handleToggleMilestone = (mileId: string) => {
    let toggledTitle = '';
    let isCompletedNow = false;
    let associatedInitId: string | undefined = undefined;

    const updatedMilestones = project.milestones.map(mile => {
      if (mile.id === mileId) {
        toggledTitle = mile.title;
        isCompletedNow = !mile.completed;
        associatedInitId = mile.initiativeId;
        return { ...mile, completed: isCompletedNow };
      }
      return mile;
    });

    let updatedInitiatives = [...project.initiatives];
    let customActivityMsg = '';
    
    if (associatedInitId) {
      const initId = associatedInitId;
      // Calculate sum of weights for completed milestones of this initiative
      const completedWeight = updatedMilestones
        .filter(m => m.initiativeId === initId && m.completed)
        .reduce((sum, m) => sum + (m.weight || 0), 0);

      const finalProgress = Math.min(100, Math.max(0, completedWeight));
      const targetInit = project.initiatives.find(i => i.id === initId);
      customActivityMsg = ` (Initiative "${targetInit?.title || ''}" progress updated to ${finalProgress}%)`;

      updatedInitiatives = updatedInitiatives.map(init => {
        if (init.id === initId) {
          return {
            ...init,
            progress: finalProgress,
            completed: finalProgress === 100
          };
        }
        return init;
      });
    }

    const updatedHistory: ProjectActivity[] = [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: isCompletedNow ? 'milestone_completed' : 'milestone_incomplete',
        message: isCompletedNow 
          ? `Milestone completed: "${toggledTitle}"${customActivityMsg}`
          : `Milestone marked incomplete: "${toggledTitle}"${customActivityMsg}`,
      },
      ...(project.history || [])
    ];

    onUpdateProject({
      ...project,
      milestones: updatedMilestones,
      initiatives: updatedInitiatives,
      history: updatedHistory
    });
  };

  const handleDeleteMilestone = (mileId: string) => {
    const deletedMile = project.milestones.find(mile => mile.id === mileId);
    const updatedMilestones = project.milestones.filter(mile => mile.id !== mileId);

    let updatedInitiatives = [...project.initiatives];
    let customActivityMsg = '';

    if (deletedMile?.initiativeId) {
      const initId = deletedMile.initiativeId;
      // Calculate sum of weights for completed milestones of this initiative
      const completedWeight = updatedMilestones
        .filter(m => m.initiativeId === initId && m.completed)
        .reduce((sum, m) => sum + (m.weight || 0), 0);

      const finalProgress = Math.min(100, Math.max(0, completedWeight));
      const targetInit = project.initiatives.find(i => i.id === initId);
      customActivityMsg = ` (Initiative "${targetInit?.title || ''}" progress updated to ${finalProgress}%)`;

      updatedInitiatives = updatedInitiatives.map(init => {
        if (init.id === initId) {
          return {
            ...init,
            progress: finalProgress,
            completed: finalProgress === 100
          };
        }
        return init;
      });
    }

    const updatedHistory: ProjectActivity[] = [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'milestone_deleted',
        message: `Milestone deleted: "${deletedMile?.title || 'Unknown Milestone'}"${customActivityMsg}`,
      },
      ...(project.history || [])
    ];

    onUpdateProject({
      ...project,
      milestones: updatedMilestones,
      initiatives: updatedInitiatives,
      history: updatedHistory
    });
  };

  // Activity helpers
  const formatActivityTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoString;
    }
  };

  const getRelativeTimeString = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      
      if (isNaN(past.getTime())) return '';

      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 10) return 'just now';
      if (diffSecs < 60) return `${diffSecs}s ago`;
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      const weeks = Math.floor(diffDays / 7);
      if (weeks < 4) return `${weeks}w ago`;
      
      const months = Math.floor(diffDays / 30);
      return `${months}mo ago`;
    } catch (e) {
      return '';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      case 'project_edited':
        return <Edit className="w-3.5 h-3.5 text-blue-400" />;
      case 'status_change':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'milestone_added':
        return <Plus className="w-3.5 h-3.5 text-stone-300" />;
      case 'milestone_completed':
        return <Check className="w-3.5 h-3.5 text-emerald-400" />;
      case 'milestone_incomplete':
        return <X className="w-3.5 h-3.5 text-stone-500" />;
      case 'milestone_deleted':
        return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-stone-400" />;
    }
  };

  // Calculations
  const calculateProgress = () => {
    if (!project.initiatives || project.initiatives.length === 0) return 0;
    const total = project.initiatives.reduce((acc, init) => {
      const val = init.completed ? 100 : Math.min(100, Math.max(0, init.progress || 0));
      return acc + val;
    }, 0);
    return Math.round(total / project.initiatives.length);
  };

  const overallProgress = calculateProgress();
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { label: 'Critical', dot: 'bg-fuchsia-400 animate-pulse', text: 'text-fuchsia-400 font-bold', bg: 'bg-fuchsia-950/30 border border-fuchsia-500/20' };
      case 'high':
        return { label: 'High', dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-950/20' };
      case 'medium':
        return { label: 'Medium', dot: 'bg-stone-500', text: 'text-stone-400', bg: 'bg-stone-900' };
      case 'low':
      default:
        return { label: 'Low', dot: 'bg-stone-600', text: 'text-stone-500', bg: 'bg-stone-950/40' };
    }
  };
  const prioStyles = getPriorityBadge(project.priority);

  const totalMilestones = project.milestones.length;
  const completedMilestones = project.milestones.filter(m => m.completed).length;
  const remainingMilestones = Math.max(0, totalMilestones - completedMilestones);

  const milestoneCompletionPercentage = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  const totalInitiatives = project.initiatives ? project.initiatives.length : 0;
  const completedInitiativesCount = project.initiatives 
    ? project.initiatives.filter(i => i.completed || i.progress >= 100).length 
    : 0;
  const remainingInitiatives = Math.max(0, totalInitiatives - completedInitiativesCount);
  const initiativeCompletionPercentage = totalInitiatives > 0
    ? Math.round((completedInitiativesCount / totalInitiatives) * 100)
    : 0;

  // Web Share API handler to share project details & progress text summary
  const handleShareProject = async () => {
    const shareTitle = `Project: ${project.name}`;
    const shareText = `📌 Project: ${project.name}\n🏷️ Category: ${project.category} | Status: ${project.status.toUpperCase()} | Priority: ${project.priority.toUpperCase()}\n📊 Overall Progress: ${overallProgress}%\n🎯 Milestones: ${completedMilestones}/${totalMilestones} Completed (${remainingMilestones} Remaining)\n⚡ Initiatives: ${completedInitiativesCount}/${totalInitiatives} Completed (${remainingInitiatives} Remaining)\n📅 Deadline: ${project.endDate}\n\nOverview: ${project.description || 'No description provided'}`;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share fail/cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setShareToast({ show: true, message: 'Project Summary & Statistics Copied to Clipboard!' });
      setTimeout(() => setShareToast(null), 3200);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const getClosestUpcomingMilestoneDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingMilestones = project.milestones.filter(m => !m.completed);
    if (upcomingMilestones.length === 0) return null;
    
    let minDays = Infinity;
    let closestMilestone: Milestone | null = null;
    let found = false;
    
    upcomingMilestones.forEach(m => {
      const mDate = new Date(m.date);
      mDate.setHours(0, 0, 0, 0);
      const diffTime = mDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < minDays) {
        minDays = diffDays;
        closestMilestone = m;
        found = true;
      }
    });
    
    return found ? { days: minDays, title: closestMilestone?.title } : null;
  };

  const getStatusBadgeStyle = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return { label: 'Active', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400' };
      case 'planning':
        return { label: 'Planning', bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', dot: 'bg-blue-400' };
      case 'on-hold':
        return { label: 'On Hold', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', dot: 'bg-amber-400' };
      case 'completed':
        return { label: 'Completed', bg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300', dot: 'bg-emerald-400' };
      case 'archived':
        return { label: 'Archived', bg: 'bg-stone-800 border-stone-700 text-amber-400', dot: 'bg-amber-400' };
      default:
        return { label: status, bg: 'bg-stone-900 border-stone-800 text-stone-400', dot: 'bg-stone-500' };
    }
  };
  const statusStyles = getStatusBadgeStyle(project.status);

  // Archive project handler with haptic feedback & confirmation
  const handleArchiveProject = () => {
    setIsArchiving(true);

    // Trigger Mobile/Touch Haptic Feedback Vibration Pattern if supported
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate([35, 45, 35, 55]);
      } catch {
        // Silently handle environment missing vibration support
      }
    }

    const isCurrentlyArchived = project.status === 'archived';
    const newStatus: ProjectStatus = isCurrentlyArchived ? 'active' : 'archived';

    const activityMsg = isCurrentlyArchived 
      ? `Project restored from archive to "${newStatus}"`
      : `Project archived (status changed to "archived")`;

    const updatedHistory: ProjectActivity[] = [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'status_change',
        message: activityMsg,
        details: isCurrentlyArchived 
          ? 'Project restored to active tracking.' 
          : 'Project moved to archive storage via dedicated modal action.'
      },
      ...(project.history || [])
    ];

    onUpdateProject({
      ...project,
      status: newStatus,
      history: updatedHistory
    });

    setArchiveToast({
      show: true,
      message: isCurrentlyArchived ? 'Project Restored from Archive' : 'Project Moved to Archive',
      action: isCurrentlyArchived ? 'unarchive' : 'archive'
    });

    setTimeout(() => {
      setIsArchiving(false);
    }, 600);

    setTimeout(() => {
      setArchiveToast(null);
    }, 3200);
  };

  const upcomingMilestoneInfo = getClosestUpcomingMilestoneDays();

  return (
    <div id="project-detail-panel" className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end transition-all duration-300">
      
      {/* Background click close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Bottom Sheet Body */}
      <div className="relative bg-[#0c0c0c] border-t border-white/[0.06] rounded-t-3xl max-h-[92%] flex flex-col shadow-2xl z-10 transition-transform duration-300 transform translate-y-0">
        
        {/* Top Handle / Grabber for mobile feel */}
        <div className="w-12 h-1 bg-stone-800 rounded-full mx-auto my-3" onClick={onClose} />

        {/* Modal Header */}
        <div className="px-6 pb-4 border-b border-white/[0.04] flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold font-sans">
                {project.category} Initiative
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${prioStyles.bg} ${prioStyles.text}`}>
                <span className={`w-1 h-1 rounded-full ${prioStyles.dot}`} />
                {prioStyles.label}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border ${statusStyles.bg}`}>
                <span className={`w-1 h-1 rounded-full ${statusStyles.dot}`} />
                {statusStyles.label}
              </span>
            </div>
            <h2 className="font-serif font-light text-xl text-white leading-tight mt-0.5">
              {project.name}
            </h2>
            {totalInitiatives > 0 && (
              <div className="flex items-center gap-2 mt-1.5" title={`Average Initiative Completion: ${overallProgress}% across ${totalInitiatives} initiatives`}>
                <div className="w-36 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-white/[0.06] shrink-0">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400 rounded-full transition-all duration-500" 
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  {overallProgress}% avg progress
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={handleShareProject} 
              className="px-2.5 py-1.5 rounded-lg bg-[#121212] hover:bg-stone-800 border border-white/[0.05] text-stone-300 hover:text-amber-400 transition-all focus:outline-none flex items-center gap-1.5 text-xs font-mono font-medium cursor-pointer"
              title="Share Project Summary via Web Share API or Copy to Clipboard"
              id="share-project-btn"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Share</span>
            </button>
            {onExportProject && (
              <button 
                onClick={() => onExportProject(project)} 
                className="p-1.5 rounded-lg bg-[#121212] hover:bg-stone-800 border border-white/[0.05] text-stone-500 hover:text-stone-300 transition-all focus:outline-none"
                title="Export this Brief"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg bg-[#121212] hover:bg-stone-800 border border-white/[0.05] text-stone-500 hover:text-stone-300 transition-all focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Web Share Toast Banner */}
        {shareToast && (
          <div className="mx-6 mt-3 bg-[#161616] border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-mono font-bold animate-pulse shadow-xl transition-all">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0 animate-bounce">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-stone-100">{shareToast.message}</span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Web Share API Ready
            </span>
          </div>
        )}

        {/* Archive Confirmation Haptic Toast Banner */}
        {archiveToast && (
          <div className="mx-6 mt-3 bg-[#161616] border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-mono font-bold animate-pulse shadow-xl transition-all">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0 animate-bounce">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-stone-100">{archiveToast.message}</span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Haptic Feedback Confirmed
            </span>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 no-scrollbar">

          {/* Project Statistics Summary Widget */}
          <div id="project-statistics-widget" className="bg-gradient-to-br from-[#131313] to-[#0d0d0d] border border-white/[0.06] rounded-xl p-4 space-y-3.5 shadow-md select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">
                  Project Statistics
                </h3>
              </div>
              <span className="text-[10px] font-mono text-stone-400 bg-stone-900 border border-white/[0.05] px-2 py-0.5 rounded font-medium">
                {completedMilestones + completedInitiativesCount} of {totalMilestones + totalInitiatives} Items Cleared
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              {/* Milestones Stats Breakdown */}
              <div className="bg-[#161616] border border-white/[0.04] rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                    <MilestoneIcon className="w-3 h-3 text-amber-400" /> Milestones
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {milestoneCompletionPercentage}%
                  </span>
                </div>

                <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-white/[0.04]">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500" 
                    style={{ width: `${milestoneCompletionPercentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
                  <div className="bg-stone-900/60 p-1.5 rounded border border-white/[0.03]">
                    <span className="text-[9px] text-emerald-400 font-bold block uppercase">Completed</span>
                    <span className="text-xs font-bold text-white">{completedMilestones}</span>
                  </div>
                  <div className="bg-stone-900/60 p-1.5 rounded border border-white/[0.03]">
                    <span className="text-[9px] text-stone-500 font-bold block uppercase">Remaining</span>
                    <span className="text-xs font-bold text-stone-300">{remainingMilestones}</span>
                  </div>
                </div>
              </div>

              {/* Initiatives Stats Breakdown */}
              <div className="bg-[#161616] border border-white/[0.04] rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                    <CheckSquare className="w-3 h-3 text-emerald-400" /> Initiatives (Avg Completion)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold" title="Average completion percentage across internal initiatives">
                    {overallProgress}% avg
                  </span>
                </div>

                <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-white/[0.04]" title={`Average Initiative Completion: ${overallProgress}%`}>
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
                  <div className="bg-stone-900/60 p-1.5 rounded border border-white/[0.03]">
                    <span className="text-[9px] text-emerald-400 font-bold block uppercase">Completed</span>
                    <span className="text-xs font-bold text-white">{completedInitiativesCount}</span>
                  </div>
                  <div className="bg-stone-900/60 p-1.5 rounded border border-white/[0.03]">
                    <span className="text-[9px] text-stone-500 font-bold block uppercase">Remaining</span>
                    <span className="text-xs font-bold text-stone-300">{remainingInitiatives}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Milestone Summary Card */}
          <div id="milestone-summary-card" className="bg-gradient-to-br from-[#141414] to-[#0f0f0f] border border-white/[0.06] rounded-xl p-4 space-y-3 shadow-md select-none">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold font-sans flex items-center gap-1">
                <MilestoneIcon className="w-3 h-3 text-stone-600" /> Milestone Overview
              </span>
              <span className="text-[10px] text-stone-400 font-mono font-medium">
                {completedMilestones} of {totalMilestones} cleared
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {/* Stat 1: Total Milestones */}
              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-2.5 text-center flex flex-col justify-center items-center gap-1">
                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold font-mono">
                  Total
                </span>
                <span className="text-xl font-light font-serif text-white">
                  {totalMilestones}
                </span>
                <span className="text-[8px] text-stone-600 font-sans">
                  milestone{totalMilestones !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Stat 2: Completion Rate */}
              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-2.5 text-center flex flex-col justify-center items-center gap-1">
                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold font-mono">
                  Progress
                </span>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-xl font-light font-serif text-white">
                    {milestoneCompletionPercentage}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">%</span>
                </div>
                <div className="w-10 h-1 bg-stone-900 rounded-full overflow-hidden mt-0.5">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                    style={{ width: `${milestoneCompletionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stat 3: Days Remaining */}
              <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-2.5 text-center flex flex-col justify-center items-center gap-1">
                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold font-mono">
                  Countdown
                </span>
                {upcomingMilestoneInfo ? (
                  <>
                    <span className="text-xl font-light font-serif text-amber-400">
                      {upcomingMilestoneInfo.days}
                    </span>
                    <span className="text-[8px] text-stone-500 font-sans truncate max-w-full px-0.5" title={upcomingMilestoneInfo.title}>
                      day{upcomingMilestoneInfo.days !== 1 ? 's' : ''} left
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-light font-serif text-stone-500 py-1">
                      {totalMilestones === 0 ? 'None Set' : 'All Clear'}
                    </span>
                    <span className="text-[8px] text-stone-600 font-sans">
                      {totalMilestones === 0 ? 'No milestones' : '0 pending'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Minor upcoming milestone tag if exists */}
            {upcomingMilestoneInfo && (
              <div className="text-[10px] text-stone-500 bg-white/[0.01] border border-white/[0.02] p-1.5 rounded-md flex items-center justify-between gap-2">
                <span className="text-[9px] uppercase tracking-wider text-stone-600 font-bold font-mono shrink-0">Next Up:</span>
                <span className="truncate text-stone-400 text-right font-sans font-medium">{upcomingMilestoneInfo.title}</span>
              </div>
            )}
          </div>
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-[#111111] border border-white/[0.04] rounded-xl p-3.5 text-xs">
            <div className="space-y-1">
              <span className="text-stone-500 font-semibold flex items-center gap-1 uppercase text-[9px] tracking-wider font-sans">
                <User className="w-3.5 h-3.5 text-stone-600" /> Lead Owner
              </span>
              <p className="text-stone-300 font-medium pl-4.5 font-mono truncate">{project.owner}</p>
            </div>
            <div className="space-y-1">
              <span className="text-stone-500 font-semibold flex items-center gap-1 uppercase text-[9px] tracking-wider font-sans">
                <Calendar className="w-3.5 h-3.5 text-stone-600" /> Target Date
              </span>
              <p className="text-stone-300 font-medium pl-4.5 font-mono">{project.endDate}</p>
            </div>
            <div className="col-span-2 pt-3.5 border-t border-white/[0.04] space-y-1.5 select-none">
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-stone-500 font-semibold font-sans">
                <span>Progress</span>
                <span className="text-white font-bold font-mono">{overallProgress}%</span>
              </div>
              <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-white transition-all duration-500" 
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Deadline Reminder & 24-Hour Early Warning Section */}
          <div className="bg-gradient-to-br from-[#141414] to-[#0d0d0d] border border-white/[0.08] rounded-xl p-4 space-y-3 shadow-md select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${project.earlyWarningEnabled ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-900 text-stone-500'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    Deadline Reminder & Alerts
                    {project.earlyWarningEnabled && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold uppercase tracking-wider">
                        ⚡ 24h Alert Active
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-stone-400 font-mono">
                    Target: <span className="text-stone-200 font-semibold">{project.reminderDateTime ? project.reminderDateTime.replace('T', ' at ') : `${project.endDate} (End of Day)`}</span>
                  </p>
                </div>
              </div>

              {/* 24h Early Warning Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !project.earlyWarningEnabled;
                  const updatedHistory: ProjectActivity[] = [
                    {
                      id: `act-${Date.now()}-early-warning-toggle`,
                      timestamp: new Date().toISOString(),
                      type: 'project_edited',
                      message: `24-Hour Early Warning notifications ${nextVal ? 'enabled' : 'disabled'}`,
                      details: `Target deadline: ${project.reminderDateTime ? project.reminderDateTime.replace('T', ' at ') : project.endDate}`
                    },
                    ...(project.history || [])
                  ];
                  onUpdateProject({
                    ...project,
                    earlyWarningEnabled: nextVal,
                    earlyWarningSent: false,
                    history: updatedHistory
                  });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-mono font-bold cursor-pointer ${
                  project.earlyWarningEnabled
                    ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-stone-900/80 text-stone-400 border-white/[0.08] hover:text-stone-200'
                }`}
                title="Toggle 24-Hour Early Warning Notification"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>24h Early Warning: {project.earlyWarningEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px]">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                {project.earlyWarningEnabled
                  ? 'Custom alert toast triggers automatically 24 hours prior to deadline'
                  : 'Early warning disabled. Toggle on to trigger custom toast 24h before deadline'}
              </span>
              <button
                type="button"
                onClick={() => dispatchEarlyWarningToast(project)}
                className="px-2 py-1 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                title="Simulate how the 24-hour early warning custom toast appears"
              >
                Test 24h Toast
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-1.5 select-none">
            <h4 className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold font-sans">Overview</h4>
            <p className="text-xs text-stone-400 leading-relaxed bg-[#111111] rounded-xl p-3 border border-white/[0.04] font-sans">
              {project.description}
            </p>
          </div>

          {/* Project Tags Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold font-sans flex items-center gap-1">
                <Tag className="w-3 h-3 text-stone-600" /> Project Tags
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingTags(!isEditingTags)}
                className="text-[9px] uppercase tracking-wider text-stone-500 hover:text-stone-300 font-mono font-bold flex items-center gap-1 select-none focus:outline-none cursor-pointer"
              >
                <Edit className="w-2.5 h-2.5" /> {isEditingTags ? 'Done' : 'Manage'}
              </button>
            </div>

            {/* Display / Edit Tags */}
            {isEditingTags ? (
              <div className="bg-[#111111] rounded-xl p-3 border border-white/[0.04] space-y-3">
                {/* Custom input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New tag..."
                    value={modalCustomTagInput}
                    onChange={(e) => setModalCustomTagInput(e.target.value)}
                    onKeyDown={handleModalTagInputKeyDown}
                    className="flex-1 bg-[#161616] border border-white/[0.06] rounded-lg px-2.5 py-1 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTagInModal}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {/* Selected pills in edit state with delete cross */}
                <div className="flex flex-wrap gap-1.5">
                  {(project.tags || []).length > 0 ? (
                    (project.tags || []).map(tag => {
                      const style = getTagStyle(tag);
                      return (
                        <span
                          key={tag}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium shadow-sm ${style}`}
                        >
                          <span className="opacity-60 text-[9px] font-bold">#</span>
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleTogglePresetTagInModal(tag)}
                            className="ml-0.5 opacity-70 hover:opacity-100 focus:outline-none cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-stone-600 italic">No tags selected. Click presets below to toggle.</span>
                  )}
                </div>

                {/* Preset presets in edit state */}
                <div className="space-y-1 pt-1.5 border-t border-white/[0.03]">
                  <span className="text-[8px] text-stone-600 font-bold uppercase tracking-wider font-mono">Preset Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['urgent', 'review', 'client', 'work', 'personal', 'internal', 'research', 'marketing', 'technical'].map((preset) => {
                      const isSelected = (project.tags || []).includes(preset);
                      const style = getTagStyle(preset);
                      return (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => handleTogglePresetTagInModal(preset)}
                          className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono transition-all border ${
                            isSelected
                              ? `${style} font-bold ring-1 ring-amber-400/30 shadow-sm`
                              : 'bg-[#161616] border-white/[0.05] text-stone-500 hover:text-stone-300 hover:border-white/10'
                          }`}
                        >
                          <span className="opacity-60 text-[9px]">#</span>
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 bg-[#111111] rounded-xl p-3 border border-white/[0.04] min-h-[42px] items-center">
                {(project.tags || []).length > 0 ? (
                  (project.tags || []).map(tag => {
                    const style = getTagStyle(tag);
                    return (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium shadow-sm ${style}`}
                      >
                        <span className="opacity-60 text-[9px] font-bold">#</span>
                        {tag}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-[10px] text-stone-600 italic">No tags added yet. Click 'Manage' to categorize this project!</span>
                )}
              </div>
            )}
          </div>

          {/* Project Collaborators Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold font-sans flex items-center gap-1">
                <Users className="w-3 h-3 text-stone-600" /> Project Collaborators
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingCollaborators(!isEditingCollaborators)}
                className="text-[9px] uppercase tracking-wider text-stone-500 hover:text-stone-300 font-mono font-bold flex items-center gap-1 select-none focus:outline-none cursor-pointer"
              >
                <Edit className="w-2.5 h-2.5" /> {isEditingCollaborators ? 'Done' : 'Manage'}
              </button>
            </div>

            {/* Display / Edit Collaborators */}
            {isEditingCollaborators ? (
              <div className="bg-[#111111] rounded-xl p-3 border border-white/[0.04] space-y-3">
                {/* Custom email input */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email to invite (e.g. alex@company.com)..."
                    value={modalCollaboratorInput}
                    onChange={(e) => setModalCollaboratorInput(e.target.value)}
                    onKeyDown={handleModalCollaboratorInputKeyDown}
                    className="flex-1 bg-[#161616] border border-white/[0.06] rounded-lg px-2.5 py-1 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleAddCollaboratorInModal}
                    className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    + Invite
                  </button>
                </div>

                {/* Selected collaborators with avatar badge and delete cross */}
                <div className="flex flex-wrap gap-2">
                  {(project.collaborators || []).length > 0 ? (
                    (project.collaborators || []).map(collab => (
                      <span
                        key={collab}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#161616] border border-white/[0.08] text-xs text-stone-200 font-sans shadow-sm"
                      >
                        <span className={`w-4 h-4 rounded-full text-[8px] font-mono font-bold flex items-center justify-center shrink-0 ${getAvatarColor(collab)}`}>
                          {getInitials(collab)}
                        </span>
                        <span className="truncate max-w-[160px]">{collab}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCollaboratorInModal(collab)}
                          className="text-stone-500 hover:text-stone-200 focus:outline-none cursor-pointer p-0.5 ml-0.5"
                          title="Remove collaborator"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-stone-600 italic">No collaborators added yet. Type an email address above and click 'Invite'.</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 bg-[#111111] rounded-xl p-3 border border-white/[0.04] min-h-[46px] items-center">
                {(project.collaborators || []).length > 0 ? (
                  (project.collaborators || []).map(collab => (
                    <span
                      key={collab}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#161616] border border-white/[0.06] text-xs text-stone-200 font-sans"
                    >
                      <span className={`w-4 h-4 rounded-full text-[8px] font-mono font-bold flex items-center justify-center shrink-0 ${getAvatarColor(collab)}`}>
                        {getInitials(collab)}
                      </span>
                      <span className="truncate max-w-[180px]">{collab}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-stone-600 italic">No collaborators added yet. Click 'Manage' to invite team members!</span>
                )}
              </div>
            )}
          </div>

          {/* Project Goals Section */}
          <div className="space-y-1.5" id={`project-goals-section-${project.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h4 className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold font-sans flex items-center gap-1">
                  <Target className="w-3 h-3 text-amber-400" /> Project Goals
                </h4>
                {normalizedGoals.length > 0 && (
                  <span className="text-[9px] font-mono font-semibold text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded border border-white/[0.06]">
                    {completedGoalsCount}/{normalizedGoals.length}
                  </span>
                )}
              </div>
              {normalizedGoals.length > 0 && (
                <span className="text-[9px] font-mono text-amber-400 font-bold">
                  {goalProgressPercent}%
                </span>
              )}
            </div>

            <div className="bg-[#111111] rounded-xl p-3 border border-white/[0.04] space-y-2.5">
              {/* Goal Progress Bar */}
              {normalizedGoals.length > 0 && (
                <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden border border-white/[0.04]">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500" 
                    style={{ width: `${goalProgressPercent}%` }}
                  />
                </div>
              )}

              {/* Goals Checklist Items */}
              <div className="space-y-1.5">
                {normalizedGoals.length > 0 ? (
                  normalizedGoals.map((goal) => (
                    <div 
                      key={goal.id}
                      className={`group flex items-center justify-between gap-2 p-2 rounded-lg border transition-all ${
                        goal.completed 
                          ? 'bg-emerald-950/10 border-emerald-500/20 text-stone-400' 
                          : 'bg-[#161616] border-white/[0.04] hover:border-white/10 text-stone-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleGoalInModal(goal.id)}
                        className="flex items-start gap-2.5 min-w-0 flex-1 text-left focus:outline-none cursor-pointer"
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          goal.completed 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold' 
                            : 'bg-stone-900 border-stone-700 text-transparent group-hover:border-stone-500'
                        }`}>
                          {goal.completed ? <Check className="w-3 h-3" /> : null}
                        </span>
                        <span className={`text-xs font-sans leading-snug break-words ${
                          goal.completed ? 'line-through text-stone-500' : 'text-stone-200 font-medium'
                        }`}>
                          {goal.text}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveGoalInModal(goal.id)}
                        className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-stone-300 focus:outline-none transition-opacity cursor-pointer p-1 shrink-0"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-stone-600 italic block py-0.5">
                    No project goals defined yet. Add key objectives below!
                  </span>
                )}
              </div>

              {/* Add Goal Input */}
              <form onSubmit={handleAddGoalInModal} className="flex gap-2 pt-1 border-t border-white/[0.03]">
                <input
                  type="text"
                  placeholder="Add a new project goal..."
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  className="flex-1 bg-[#161616] border border-white/[0.06] rounded-lg px-2.5 py-1 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={!newGoalInput.trim()}
                  className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 disabled:opacity-40 disabled:hover:bg-amber-500/15 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" /> Goal
                </button>
              </form>
            </div>
          </div>

          {/* Project Notes Section (Quick Preview linking to Notes tab) */}
          <div className="space-y-1.5" id={`project-notes-section-${project.id}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold font-sans flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-amber-500" />
                Project Notes & Scratchpad
              </h4>
              <button
                type="button"
                onClick={() => setActiveSubTab('notes')}
                className="text-[9px] text-amber-400 hover:text-amber-300 uppercase tracking-widest font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              >
                Open Scratchpad &rarr;
              </button>
            </div>
            <div 
              onClick={() => setActiveSubTab('notes')}
              className="group cursor-pointer bg-[#111111] hover:bg-[#141414] hover:border-amber-500/30 rounded-xl p-4 border border-white/[0.04] transition-all"
            >
              {project.notes?.trim() ? (
                <div className="space-y-2">
                  <div className="text-xs text-stone-300 font-sans line-clamp-3 leading-relaxed">
                    {project.notes}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
                    <span className="text-[9px] font-mono text-stone-500">
                      {project.notes.length} characters • Markdown formatted
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-400 group-hover:underline flex items-center gap-1">
                      Edit in Scratchpad &rarr;
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1">
                  <p className="text-xs text-stone-500 italic">No notes captured yet. Click here to open the rich Markdown scratchpad...</p>
                  <span className="text-[9px] font-mono text-amber-400/90 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    + Add Notes
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Segmented Sub Tabs */}
          <div className="flex p-0.5 bg-[#121212] rounded-lg border border-white/[0.06] flex-wrap gap-y-1">
            <button
              onClick={() => setActiveSubTab('summary')}
              className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all ${
                activeSubTab === 'summary' 
                  ? 'bg-stone-800 text-white shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveSubTab('initiatives')}
              className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all ${
                activeSubTab === 'initiatives' 
                  ? 'bg-stone-800 text-white shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Initiatives ({project.initiatives.length})
            </button>
            <button
              onClick={() => setActiveSubTab('milestones')}
              className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all ${
                activeSubTab === 'milestones' 
                  ? 'bg-stone-800 text-white shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Milestones ({completedMilestones}/{totalMilestones})
            </button>
            <button
              onClick={() => setActiveSubTab('notes')}
              className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'notes' 
                  ? 'bg-stone-800 text-white shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Notes {project.notes?.trim() ? '•' : ''}
            </button>
            <button
              onClick={() => setActiveSubTab('activity')}
              className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all ${
                activeSubTab === 'activity' 
                  ? 'bg-stone-800 text-white shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Activity ({(project.history || []).length})
            </button>
          </div>

          {/* TAB 0: SUMMARY CONTENT */}
          {activeSubTab === 'summary' && (
            <div className="space-y-5" id="summary-tab-content">
              
              {/* Performance Progression Area */}
              <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">Initiative Progression</span>
                    <h3 className="font-serif font-light text-base text-white">Task Completion Trend</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Overall Velocity: {overallProgress}%
                    </span>
                  </div>
                </div>

                {/* SVG Progress Graph */}
                {(() => {
                  const startMs = new Date(project.startDate).getTime();
                  const endMs = new Date(project.endDate).getTime();
                  const timeSpan = Math.max(1, endMs - startMs);

                  const width = 500;
                  const height = 180;
                  const paddingLeft = 35;
                  const paddingRight = 15;
                  const paddingTop = 15;
                  const paddingBottom = 25;

                  const chartWidth = width - paddingLeft - paddingRight;
                  const chartHeight = height - paddingTop - paddingBottom;

                  const getX = (timestamp: number) => {
                    const fraction = (timestamp - startMs) / timeSpan;
                    return paddingLeft + Math.max(0, Math.min(1, fraction)) * chartWidth;
                  };

                  const getY = (progress: number) => {
                    const fraction = progress / 100;
                    return paddingTop + (1 - fraction) * chartHeight;
                  };

                  const points = (() => {
                    const pts: Array<{ date: Date; progress: number; label: string; details?: string; isMilestone?: boolean }> = [];
                    
                    pts.push({ 
                      date: new Date(project.startDate), 
                      progress: 0, 
                      label: 'Project Kickoff' 
                    });

                    // Add completed milestones
                    const completedMiles = [...project.milestones]
                      .filter(m => m.completed)
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    completedMiles.forEach((m, idx) => {
                      let completionDate = new Date(m.date);
                      const historyMatch = (project.history || []).find(act => 
                        act.type === 'milestone_completed' && act.message.includes(`"${m.title}"`)
                      );
                      if (historyMatch) {
                        completionDate = new Date(historyMatch.timestamp);
                      }

                      const progressContribution = completedMiles.length > 0 
                        ? Math.round(((idx + 1) / completedMiles.length) * overallProgress)
                        : 0;

                      pts.push({
                        date: completionDate,
                        progress: progressContribution,
                        label: `Milestone: ${m.title}`,
                        details: `Completed on ${completionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                        isMilestone: true
                      });
                    });

                    // Sort pts
                    pts.sort((a, b) => a.date.getTime() - b.date.getTime());

                    // Add current state if last pt progress is less than overall progress
                    const lastPt = pts[pts.length - 1];
                    if (!lastPt || lastPt.progress < overallProgress) {
                      const today = new Date('2026-07-18');
                      pts.push({
                        date: today > new Date(project.startDate) ? today : new Date(project.endDate),
                        progress: overallProgress,
                        label: 'Current Level',
                        details: `${project.status.toUpperCase()} phase`
                      });
                    }

                    return pts.filter(p => !isNaN(p.date.getTime()));
                  })();

                  // Generate continuous trend line
                  const linePath = points.map((p, idx) => {
                    const x = getX(p.date.getTime());
                    const y = getY(p.progress);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ');

                  const areaPath = points.length > 0
                    ? `${linePath} L ${getX(points[points.length - 1].date.getTime())} ${getY(0)} L ${getX(points[0].date.getTime())} ${getY(0)} Z`
                    : '';

                  // Y ticks (0, 25, 50, 75, 100)
                  const yTicks = [0, 25, 50, 75, 100];
                  
                  // X ticks (start, 3 intervals, end)
                  const xTicks = [];
                  for (let i = 0; i <= 3; i++) {
                    xTicks.push(new Date(startMs + (timeSpan * i) / 3));
                  }

                  return (
                    <div className="relative">
                      {/* Responsive SVG wrapper */}
                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d97706" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines (Y-axis) */}
                        {yTicks.map((tick) => (
                          <g key={tick} className="opacity-40">
                            <line 
                              x1={paddingLeft} 
                              y1={getY(tick)} 
                              x2={width - paddingRight} 
                              y2={getY(tick)} 
                              stroke="#ffffff" 
                              strokeWidth="0.5" 
                              strokeDasharray="2,4"
                            />
                            <text 
                              x={paddingLeft - 8} 
                              y={getY(tick) + 3} 
                              fill="#78716c" 
                              fontSize="8" 
                              fontFamily="monospace" 
                              textAnchor="end"
                            >
                              {tick}%
                            </text>
                          </g>
                        ))}

                        {/* X-axis Line */}
                        <line 
                          x1={paddingLeft} 
                          y1={getY(0)} 
                          x2={width - paddingRight} 
                          y2={getY(0)} 
                          stroke="#ffffff" 
                          strokeWidth="0.75" 
                          className="opacity-15"
                        />

                        {/* X ticks */}
                        {xTicks.map((date, idx) => (
                          <text 
                            key={idx}
                            x={getX(date.getTime())} 
                            y={height - paddingBottom + 14} 
                            fill="#78716c" 
                            fontSize="8" 
                            fontFamily="monospace" 
                            textAnchor={idx === 0 ? 'start' : idx === xTicks.length - 1 ? 'end' : 'middle'}
                          >
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </text>
                        ))}

                        {/* Fill Area */}
                        {areaPath && (
                          <path d={areaPath} fill="url(#areaGrad)" />
                        )}

                        {/* Progress Line */}
                        {linePath && (
                          <path 
                            d={linePath} 
                            fill="none" 
                            stroke="#f59e0b" 
                            strokeWidth="2.25" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Milestone markers and timeline nodes */}
                        {points.map((p, idx) => {
                          const x = getX(p.date.getTime());
                          const y = getY(p.progress);
                          const isMilestone = p.isMilestone;

                          return (
                            <g 
                              key={idx} 
                              className="group cursor-pointer"
                              onMouseEnter={() => setHoveredPoint(p)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            >
                              {/* Glowing background on hover */}
                              <circle 
                                cx={x} 
                                cy={y} 
                                r="8" 
                                fill={isMilestone ? '#f59e0b' : '#ffffff'} 
                                className="opacity-0 group-hover:opacity-20 transition-all duration-150"
                              />
                              <circle 
                                cx={x} 
                                cy={y} 
                                r={isMilestone ? "4.5" : "3.5"} 
                                fill={isMilestone ? '#f59e0b' : '#0a0a0a'} 
                                stroke={isMilestone ? '#ffffff' : '#f59e0b'}
                                strokeWidth="1.5"
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* Tooltip */}
                      <div className="h-12 flex items-center justify-center">
                        {hoveredPoint ? (
                          <div className="bg-[#161616] border border-white/[0.08] px-3.5 py-1.5 rounded-lg text-center shadow-lg animate-fade-in max-w-sm">
                            <p className="text-stone-300 font-sans text-xs font-semibold leading-tight">
                              {hoveredPoint.label}
                            </p>
                            <p className="text-[10px] text-amber-400 font-mono mt-0.5">
                              {hoveredPoint.progress}% progress • {hoveredPoint.details || hoveredPoint.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        ) : (
                          <div className="text-[9px] uppercase tracking-wider font-mono text-stone-500 italic select-none">
                            Hover points above to inspect completion checkpoints
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Milestone Distribution over Time */}
              <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 space-y-3.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">Distribution Index</span>
                  <h3 className="font-serif font-light text-base text-white">Milestone Distribution Map</h3>
                </div>

                {project.milestones.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-white/[0.06] rounded-xl bg-white/[0.01]">
                    <p className="text-xs text-stone-500">No milestones registered on timeline.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Horizontal Visual Timeline Belt */}
                    <div className="relative pt-4 pb-2 px-1 select-none">
                      <div className="absolute top-[23px] left-0 right-0 h-0.5 bg-stone-900 rounded" />
                      
                      {(() => {
                        const startMs = new Date(project.startDate).getTime();
                        const endMs = new Date(project.endDate).getTime();
                        const span = Math.max(1, endMs - startMs);

                        return (
                          <div className="relative h-10 w-full">
                            {project.milestones.map((m) => {
                              const mTime = new Date(m.date).getTime();
                              const percent = Math.max(0, Math.min(100, ((mTime - startMs) / span) * 100));
                              const isOverdue = !m.completed && new Date(m.date).getTime() < new Date('2026-07-18').getTime();

                              return (
                                <div 
                                  key={m.id}
                                  className="absolute top-0 group/belt"
                                  style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
                                >
                                  {/* Dot */}
                                  <div className={`w-3.5 h-3.5 rounded-full border-2 bg-[#0c0c0c] transition-transform duration-150 group-hover/belt:scale-125 cursor-pointer flex items-center justify-center ${
                                    m.completed 
                                      ? 'border-emerald-400 bg-emerald-950/20 shadow-[0_0_8px_rgba(52,211,153,0.2)]' 
                                      : isOverdue 
                                        ? 'border-red-400 bg-red-950/20 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse' 
                                        : 'border-stone-600 hover:border-amber-400'
                                  }`} />
                                  
                                  {/* Date flag */}
                                  <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-stone-950/80 px-1 rounded text-[7px] font-mono font-bold text-stone-500 border border-white/[0.02]">
                                    {new Date(m.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                                  </div>

                                  {/* Floating details on hover */}
                                  <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#141414] border border-white/[0.08] px-2.5 py-1 rounded text-[9px] font-sans text-stone-200 shadow-xl opacity-0 group-hover/belt:opacity-100 transition-opacity z-20 whitespace-nowrap">
                                    {m.title} {m.weight ? `(${m.weight}%)` : ''}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Timeline Statistics Row */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-[#161616] p-3 rounded-xl border border-white/[0.02] flex items-center gap-3">
                        <Percent className="w-4 h-4 text-amber-500/80 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-stone-500 font-mono uppercase tracking-wider leading-none">Milestone Hit-Rate</p>
                          <p className="text-sm text-white font-serif font-light leading-snug mt-1">
                            {milestoneCompletionPercentage}% Completed
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#161616] p-3 rounded-xl border border-white/[0.02] flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-amber-500/80 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-stone-500 font-mono uppercase tracking-wider leading-none">Delivery Timeline</p>
                          <p className="text-sm text-white font-serif font-light leading-snug mt-1">
                            {(() => {
                              const start = new Date(project.startDate);
                              const end = new Date(project.endDate);
                              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                              return `${days} Days Span`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Comprehensive Summary Audit */}
              <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 space-y-3">
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">Status Verification</span>
                <div className="space-y-2.5 font-sans">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.03]">
                    <span className="text-stone-400">Total sub-initiatives</span>
                    <span className="text-white font-mono font-medium">{project.initiatives.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.03]">
                    <span className="text-stone-400">Total milestones scheduled</span>
                    <span className="text-white font-mono font-medium">{project.milestones.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.03]">
                    <span className="text-stone-400">Completed milestones</span>
                    <span className="text-emerald-400 font-mono font-bold">{completedMilestones}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-400">Pending & Overdue milestones</span>
                    <span className="text-stone-300 font-mono font-medium">
                      {project.milestones.length - completedMilestones}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 1: INITIATIVES CONTENT */}
          {activeSubTab === 'initiatives' && (
            <div className="space-y-4">
              
              {/* Quick Add Initiative Form */}
              <form onSubmit={handleAddInitiative} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New sub-initiative title..."
                  value={newInitiativeTitle}
                  onChange={(e) => setNewInitiativeTitle(e.target.value)}
                  className="flex-1 bg-[#121212] border border-white/[0.06] rounded-lg px-3.5 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500"
                />
                <button
                  type="submit"
                  className="bg-white hover:bg-stone-200 active:scale-95 text-stone-950 p-2 rounded-lg flex items-center justify-center transition-all focus:outline-none"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Initiatives List */}
              <div className="space-y-2.5">
                {project.initiatives.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-white/[0.08] rounded-xl bg-[#121212]/10">
                    <p className="text-xs text-stone-500">No initiatives added yet.</p>
                  </div>
                ) : (
                  project.initiatives.map((init) => (
                    <div 
                      key={init.id}
                      className="bg-[#111111] border border-white/[0.04] rounded-lg p-3 space-y-2.5 hover:border-white/[0.08] transition-all"
                    >
                      {/* Title / Toggle Row */}
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleInitiative(init.id)}
                          className="flex items-start gap-2.5 text-left flex-1 font-sans"
                        >
                          <span className="mt-0.5 text-stone-400 shrink-0">
                            {init.completed ? (
                              <CheckSquare className="w-4 h-4 fill-white/10 text-white" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-600" />
                            )}
                          </span>
                          <span className={`text-xs font-medium leading-normal ${init.completed ? 'line-through text-stone-600' : 'text-stone-200'}`}>
                            {init.title}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInitiative(init.id)}
                          className="text-stone-600 hover:text-red-400 p-0.5 rounded transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Slider Row */}
                      <div className="flex items-center gap-3 pl-6.5 select-none">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="10"
                          value={init.progress}
                          onChange={(e) => handleProgressSliderChange(init.id, parseInt(e.target.value))}
                          className="flex-1 h-1 bg-stone-850 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
                        />
                        <span className="text-[9px] font-mono font-bold text-stone-400 shrink-0 w-8 text-right">
                          {init.progress}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MILESTONES CONTENT */}
          {activeSubTab === 'milestones' && (
            <div className="space-y-4">
              
              {/* Quick Add Milestone Form */}
              <form onSubmit={handleAddMilestone} className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 space-y-3">
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">Create Milestone</span>
                <input
                  type="text"
                  placeholder="Milestone checkpoint title..."
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3.5 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-500 font-mono">Target Date</label>
                    <input
                      type="date"
                      value={newMilestoneDate}
                      onChange={(e) => setNewMilestoneDate(e.target.value)}
                      className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-stone-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-500 font-mono">Notes (Opt)</label>
                    <input
                      type="text"
                      placeholder="e.g. Needs sign-off"
                      value={newMilestoneNotes}
                      onChange={(e) => setNewMilestoneNotes(e.target.value)}
                      className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-stone-300 placeholder-stone-700 focus:outline-none focus:border-stone-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-500 font-mono">Link to Initiative</label>
                    <select
                      value={newMilestoneInitiativeId}
                      onChange={(e) => setNewMilestoneInitiativeId(e.target.value)}
                      className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-stone-500 cursor-pointer"
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
                    <label className="text-[9px] text-stone-500 font-mono">Weight / Progress Impact (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newMilestoneWeight}
                      onChange={(e) => setNewMilestoneWeight(Math.max(1, Math.min(100, parseInt(e.target.value) || 0)))}
                      className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-stone-500 font-mono disabled:opacity-40"
                      disabled={!newMilestoneInitiativeId}
                      placeholder="e.g. 25"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-stone-200 text-stone-950 py-2 rounded-lg font-bold text-xs transition-all active:scale-[0.98] focus:outline-none flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Milestone
                </button>
              </form>

              {/* Milestones Chronological Timeline */}
              <div className="relative border-l border-white/[0.05] pl-4 ml-2.5 py-1 space-y-4">
                {project.milestones.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-white/[0.08] rounded-xl bg-[#121212]/10 -ml-4">
                    <p className="text-xs text-stone-500">No milestones logged yet.</p>
                  </div>
                ) : (
                  project.milestones.map((mile) => {
                    const mDate = new Date(mile.date);
                    const isMileOverdue = !mile.completed && mDate.getTime() < anchorDate.getTime();
                    
                    return (
                      <div key={mile.id} className="relative group/mile">
                        
                        {/* Timeline Node Ring */}
                        <div className={`absolute -left-[24px] top-1 w-3 h-3 rounded-full border bg-[#0a0a0a] transition-all ${
                          mile.completed 
                            ? 'border-white bg-white' 
                            : isMileOverdue 
                              ? 'border-red-400 bg-red-950/40 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                              : 'border-stone-700'
                        }`} />

                        {/* Card Content */}
                        <div className="bg-[#111111] border border-white/[0.04] rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleMilestone(mile.id)}
                              className="flex items-start gap-2 text-left flex-1 font-sans"
                            >
                              <span className="text-xs font-serif font-light leading-snug text-white group-hover/mile:text-stone-300 transition-colors">
                                {mile.title}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMilestone(mile.id)}
                              className="text-stone-600 hover:text-red-400 p-0.5 rounded transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {mile.initiativeId && (
                            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-sans select-none pb-0.5">
                              <CornerDownRight className="w-3.5 h-3.5 text-stone-600" />
                              <span>Linked: <strong className="text-stone-300 font-medium">{project.initiatives.find(i => i.id === mile.initiativeId)?.title || 'Deleted Initiative'}</strong></span>
                              <span className="text-[9px] font-mono font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 text-amber-300">
                                Weight: {mile.weight || 0}%
                              </span>
                            </div>
                          )}

                          {/* Date and Overdue notice */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] text-stone-400 font-mono flex items-center gap-1 bg-[#121212] px-2 py-0.5 rounded border border-white/[0.04]">
                              <Calendar className="w-3 h-3 text-stone-500" /> {mile.date}
                            </span>
                            {mile.completed ? (
                              <span className="text-[8px] font-bold text-white bg-stone-850 px-1.5 py-0.5 rounded uppercase font-mono border border-white/[0.05]">
                                Met
                              </span>
                            ) : isMileOverdue ? (
                              <span className="text-[8px] font-bold text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded uppercase font-mono flex items-center gap-0.5 animate-pulse">
                                <AlertCircle className="w-2.5 h-2.5" /> Overdue
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold text-stone-500 bg-stone-900/40 px-1.5 py-0.5 rounded uppercase font-mono">
                                Pending
                              </span>
                            )}
                          </div>

                          {/* Notes if existing */}
                          {mile.notes && (
                            <p className="text-[11px] text-stone-500 bg-stone-950/30 p-2 rounded border-l border-stone-700 font-sans italic leading-relaxed">
                              {mile.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITY CONTENT */}
          {activeSubTab === 'activity' && (
            <ActivityLog history={project.history} projectName={project.name} />
          )}

          {/* TAB 4: NOTES CONTENT */}
          {activeSubTab === 'notes' && (
            <ProjectNotesTab 
              project={project} 
              onUpdateProject={onUpdateProject} 
            />
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#0a0a0a] border-t border-white/[0.04] flex items-center gap-3">
          
          {/* Main Action Toggles */}
          {!confirmDelete ? (
            <>
              <button
                type="button"
                onClick={handleArchiveProject}
                disabled={isArchiving}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer shadow-sm ${
                  project.status === 'archived'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-[#141414] hover:bg-[#1c1c1c] text-stone-300 border border-white/[0.08] hover:text-white'
                }`}
                title={project.status === 'archived' ? 'Restore Project from Archive' : 'Archive Project'}
              >
                {project.status === 'archived' ? (
                  <>
                    <ArchiveRestore className={`w-3.5 h-3.5 text-amber-400 ${isArchiving ? 'animate-spin' : ''}`} />
                    <span>Unarchive</span>
                  </>
                ) : (
                  <>
                    <Archive className={`w-3.5 h-3.5 text-amber-400 ${isArchiving ? 'animate-bounce' : ''}`} />
                    <span>Archive</span>
                  </>
                )}
              </button>

              <button
                onClick={onEditProjectClick}
                className="flex-1 bg-[#111111] hover:bg-[#151515] border border-white/[0.05] text-stone-200 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-1 focus:ring-stone-600"
              >
                <Edit className="w-3.5 h-3.5 text-stone-400" /> Edit Details
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="bg-red-950/10 hover:bg-red-950/20 text-red-400 border border-red-900/10 px-3 py-2 rounded-lg text-xs font-semibold transition-all focus:outline-none cursor-pointer"
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="w-full bg-red-950/20 border border-red-900/20 p-3 rounded-lg flex flex-col gap-2 select-none">
              <div className="flex items-start gap-2 text-xs">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-red-200">Delete Project?</p>
                  <p className="text-stone-500 text-[10px]">All initiatives & milestones will be permanently erased.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="flex-1 bg-red-500 text-white text-xs font-bold py-1.5 rounded-md transition-all"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 bg-stone-850 text-stone-300 text-xs font-semibold py-1.5 rounded-md transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
