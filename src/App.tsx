import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ProjectCategory, ProjectStatus, ProjectActivity } from './types';
import { INITIAL_PROJECTS } from './initialData';
import PhoneFrame from './components/PhoneFrame';
import ProjectCard from './components/ProjectCard';
import ProjectModal from './components/ProjectModal';
import AddProjectModal from './components/AddProjectModal';
import MilestonesTimeline from './components/MilestonesTimeline';
import AnalyticsView from './components/AnalyticsView';
import ExportModal from './components/ExportModal';
import DailyFocus from './components/DailyFocus';
import { 
  Plus, Search, FolderKanban, SlidersHorizontal, 
  MapPin, Milestone, BarChart3, Bell, BellRing, AlertTriangle, Clock, X, Database, User, Archive,
  Check, Settings, Smartphone, Zap, Sun, Moon
} from 'lucide-react';
import { calculateMomentumScore } from './utils/momentumUtils';
import { getProjectDeadline, getEarlyWarningTimestamp, formatDeadlineDisplay } from './utils/deadlineUtils';

export default function App() {
  // Lazy state loader for persistent offline projects data
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ultra_jects5_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => ({
            ...p,
            name: p.name || 'Untitled Project',
            description: p.description || '',
            category: p.category || 'Development',
            status: p.status || 'planning',
            priority: p.priority || 'medium',
            startDate: p.startDate || '2026-07-18',
            endDate: p.endDate || '2026-09-30',
            owner: p.owner || 'Project Lead',
            initiatives: Array.isArray(p.initiatives) ? p.initiatives : [],
            milestones: Array.isArray(p.milestones) ? p.milestones : [],
            history: Array.isArray(p.history) ? p.history : [],
            goals: Array.isArray(p.goals) ? p.goals : [],
            tags: Array.isArray(p.tags) ? p.tags : [],
            collaborators: Array.isArray(p.collaborators) ? p.collaborators : []
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved projects', e);
      }
    }
    return INITIAL_PROJECTS;
  });

  // Navigation tab State: 'projects' | 'timeline' | 'analytics'
  const [activeTab, setActiveTab] = useState<'projects' | 'timeline' | 'analytics'>('projects');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'Name' | 'Deadline' | 'Priority' | 'Momentum'>('Deadline');
  const [autoSortMomentum, setAutoSortMomentum] = useState<boolean>(false);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [searchArchivedOnly, setSearchArchivedOnly] = useState<boolean>(false);

  // Extract all team members across all projects dynamically
  const allTeamMembers = React.useMemo(() => {
    const members = new Set<string>();
    projects.forEach(p => {
      if (p.collaborators) {
        p.collaborators.forEach(c => {
          if (c.trim()) members.add(c.trim());
        });
      }
      if (p.owner) {
        const cleanOwner = p.owner.split('(')[0].trim();
        if (cleanOwner) members.add(cleanOwner);
      }
    });
    return Array.from(members).sort();
  }, [projects]);

  // Modals management
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportInitialProject, setExportInitialProject] = useState<Project | null>(null);

  // Sync projects state change to localStorage
  useEffect(() => {
    localStorage.setItem('ultra_jects5_projects', JSON.stringify(projects));
  }, [projects]);

  // Keep selectedProject state current if the overall projects list changes (e.g. adding tasks inside the modal)
  useEffect(() => {
    if (selectedProject) {
      const refreshed = projects.find(p => p.id === selectedProject.id);
      if (refreshed) {
        setSelectedProject(refreshed);
      } else {
        setSelectedProject(null);
      }
    }
  }, [projects]);

  // Active in-app notification toasts
  const [activeReminders, setActiveReminders] = useState<{
    id: string;
    projectId?: string;
    projectName: string;
    message: string;
    type?: 'reminder' | 'early_warning';
    deadlineText?: string;
  }[]>([]);

  // Listen for custom toast notification triggers across components (e.g., test triggers or immediate alerts)
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveReminders(prev => [
          ...prev,
          {
            id: customEvent.detail.id || `custom-toast-${Date.now()}`,
            projectId: customEvent.detail.projectId,
            projectName: customEvent.detail.projectName || 'Project',
            message: customEvent.detail.message || 'Notification triggered',
            type: customEvent.detail.type || 'early_warning',
            deadlineText: customEvent.detail.deadlineText
          }
        ]);
      }
    };
    window.addEventListener('ultra_jects_toast', handleToastEvent);
    return () => window.removeEventListener('ultra_jects_toast', handleToastEvent);
  }, []);

  // Background scheduler to poll and check reminders & 24h early warnings every 5 seconds
  useEffect(() => {
    const checkScheduledReminders = () => {
      const now = new Date();
      let hasUpdates = false;

      const updatedProjects = projects.map(p => {
        let updatedProject = { ...p };
        let projectModified = false;

        const deadline = getProjectDeadline(p);
        const deadlineTimeMs = deadline.getTime();

        // 1. Check 24-Hour Early Warning Notification (toggled on, not yet sent, project active)
        if (p.earlyWarningEnabled && !p.earlyWarningSent && p.status !== 'completed' && p.status !== 'archived') {
          const earlyWarningTimeMs = getEarlyWarningTimestamp(deadline);
          // Trigger when current time reaches 24 hours before the actual deadline (within a 48h active window)
          if (now.getTime() >= earlyWarningTimeMs && now.getTime() <= deadlineTimeMs + 48 * 60 * 60 * 1000) {
            const formattedDeadline = formatDeadlineDisplay(deadline);

            // Trigger browser notification
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                try {
                  new Notification(`⚡ 24h Early Warning: ${p.name}`, {
                    body: `The deadline for "${p.name}" is in 24 hours (${formattedDeadline})! Check your milestones.`,
                    icon: '/favicon.ico'
                  });
                } catch (err) {
                  console.error('Browser Notification error:', err);
                }
              }
            }

            // Trigger custom early warning floating toast
            setActiveReminders(prev => [
              ...prev,
              {
                id: `early-warn-${Date.now()}-${p.id}`,
                projectId: p.id,
                projectName: p.name,
                type: 'early_warning',
                deadlineText: formattedDeadline,
                message: `The deadline for "${p.name}" is approaching in 24 hours (${formattedDeadline}). Time to review pending milestones and wrap up deliverables.`
              }
            ]);

            // Append to project activity log
            const updatedHistory: ProjectActivity[] = [
              {
                id: `act-${Date.now()}-early-warning-fired`,
                timestamp: new Date().toISOString(),
                type: 'project_edited',
                message: `⚠️ 24-Hour Early Warning notification triggered for deadline (${formattedDeadline})`
              },
              ...(p.history || [])
            ];

            updatedProject = {
              ...updatedProject,
              earlyWarningSent: true,
              history: updatedHistory
            };
            projectModified = true;
          }
        }

        // 2. Check scheduled deadline reminder (at exact target time)
        if (p.reminderDateTime && !p.reminderSent && p.status !== 'completed' && p.status !== 'archived') {
          const remTime = new Date(p.reminderDateTime);
          if (now.getTime() >= remTime.getTime()) {
            const formattedTime = p.reminderDateTime.replace('T', ' at ');
            // Trigger browser notification
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                try {
                  new Notification(`Ultra-Ject 5: Deadline Reminder`, {
                    body: `The deadline reminder for "${p.name}" has been reached!`,
                    icon: '/favicon.ico'
                  });
                } catch (err) {
                  console.error('Browser Notification error:', err);
                }
              }
            }

            // Trigger floating Toast
            setActiveReminders(prev => [
              ...prev,
              {
                id: `rem-toast-${Date.now()}-${p.id}`,
                projectId: p.id,
                projectName: p.name,
                type: 'reminder',
                deadlineText: formattedTime,
                message: `The scheduled deadline reminder for your initiative "${p.name}" has triggered! Time to review final checkpoints.`
              }
            ]);

            // Append to project activity log
            const updatedHistory: ProjectActivity[] = [
              {
                id: `act-${Date.now()}-reminder-fired`,
                timestamp: new Date().toISOString(),
                type: 'project_edited',
                message: '⏰ Scheduled deadline reminder triggered successfully',
              },
              ...(updatedProject.history || p.history || [])
            ];

            updatedProject = {
              ...updatedProject,
              reminderSent: true,
              history: updatedHistory
            };
            projectModified = true;
          }
        }

        if (projectModified) {
          hasUpdates = true;
          return updatedProject;
        }
        return p;
      });

      if (hasUpdates) {
        setProjects(updatedProjects);
      }
    };

    const timer = setInterval(checkScheduledReminders, 5000);
    // Initial check
    checkScheduledReminders();

    return () => clearInterval(timer);
  }, [projects]);

  // Handle Project Submissions (Add or Edit)
  const handleProjectSubmit = (newOrUpdatedProj: Project) => {
    const existing = projects.find(p => p.id === newOrUpdatedProj.id);
    if (existing) {
      const updatedHistory: ProjectActivity[] = [...(existing.history || [])];

      // Check status change
      if (existing.status !== newOrUpdatedProj.status) {
        updatedHistory.unshift({
          id: `act-${Date.now()}-status`,
          timestamp: new Date().toISOString(),
          type: 'status_change',
          message: `Project status updated to ${newOrUpdatedProj.status.toUpperCase()}`,
          details: `Changed from ${existing.status.toUpperCase()}`
        });
      }

      // Record edit action
      updatedHistory.unshift({
        id: `act-${Date.now()}-edit`,
        timestamp: new Date().toISOString(),
        type: 'project_edited',
        message: 'Project details updated via Metadata Engine',
      });

      newOrUpdatedProj.history = updatedHistory;
      setProjects(prev => prev.map(p => p.id === newOrUpdatedProj.id ? newOrUpdatedProj : p));
    } else {
      // It's a new project! Let's initialize history.
      const initialHistory: ProjectActivity[] = [
        {
          id: `act-${Date.now()}-created`,
          timestamp: new Date().toISOString(),
          type: 'project_created',
          message: 'Initiative launched and deployed',
          details: `Category: ${newOrUpdatedProj.category}, Lead Owner: ${newOrUpdatedProj.owner}`
        }
      ];
      newOrUpdatedProj.history = initialHistory;
      setProjects(prev => [...prev, newOrUpdatedProj]);
    }
    setShowAddModal(false);
    setProjectToEdit(null);
  };

  const handleUpdateProjectDirect = (updatedProj: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
  };

  const handleDuplicateProject = (projectToDuplicate: Project) => {
    const cloneInitiatives = (projectToDuplicate.initiatives || []).map(init => ({
      ...init,
      id: `init-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }));

    const cloneMilestones = (projectToDuplicate.milestones || []).map(mile => ({
      ...mile,
      id: `mile-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }));

    const duplicatedProj: Project = {
      ...projectToDuplicate,
      id: `proj-${Date.now()}`,
      name: `${projectToDuplicate.name} (Copy)`,
      initiatives: cloneInitiatives,
      milestones: cloneMilestones,
      history: [
        {
          id: `act-${Date.now()}-created`,
          timestamp: new Date().toISOString(),
          type: 'project_created',
          message: `Initiative duplicated from "${projectToDuplicate.name}"`,
          details: `Duplicated via quick swipe action`
        }
      ]
    };

    setProjects(prev => [...prev, duplicatedProj]);
  };

  const handleTogglePinProject = (projectId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const nextPinned = !p.pinned;
        const updatedHistory: ProjectActivity[] = [
          {
            id: `act-${Date.now()}-pin`,
            timestamp: new Date().toISOString(),
            type: 'project_edited',
            message: nextPinned ? 'Project pinned' : 'Project unpinned',
            details: nextPinned ? 'Pinned for rapid tracking' : 'Unpinned from priority dock'
          },
          ...(p.history || [])
        ];
        return {
          ...p,
          pinned: nextPinned,
          history: updatedHistory
        };
      }
      return p;
    }));
  };

  const handleImportBackup = (importedProjects: Project[], mode: 'overwrite' | 'merge') => {
    if (mode === 'overwrite') {
      setProjects(importedProjects);
    } else {
      setProjects(prev => {
        const mergedMap = new Map<string, Project>();
        prev.forEach(p => mergedMap.set(p.id, p));
        importedProjects.forEach(p => mergedMap.set(p.id, p));
        return Array.from(mergedMap.values());
      });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setSelectedProject(null);
  };

  const triggerEditProject = () => {
    if (selectedProject) {
      setProjectToEdit(selectedProject);
      setShowAddModal(true);
    }
  };

  // --- FILTER & SORT PARSING ---
  const filteredProjects = projects.filter(project => {
    // Search query match
    const matchesSearch = 
      (project.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.owner || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.initiatives || []).some(init => (init.title || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.milestones || []).some(mile => (mile.title || '').toLowerCase().includes(searchQuery.toLowerCase()));

    // Category filter match
    const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;

    // Collaborator filter match
    const matchesCollaborator = selectedCollaborator === 'All' || 
      project.owner.toLowerCase().includes(selectedCollaborator.toLowerCase()) ||
      project.collaborators?.some(c => c.toLowerCase() === selectedCollaborator.toLowerCase());

    // Search scope match: when searchArchivedOnly is true, restrict to archived projects
    const matchesArchiveScope = !searchArchivedOnly || project.status === 'archived';

    return matchesSearch && matchesCategory && matchesCollaborator && matchesArchiveScope;
  });

  const activeProjects = filteredProjects.filter(project => {
    if (searchArchivedOnly) return false;
    const isNotArchived = project.status !== 'archived';
    const matchesStatus = selectedStatus === 'All' || project.status === selectedStatus;
    return isNotArchived && matchesStatus;
  }).sort((a, b) => {
    // Pinned projects always float to the top
    const pinA = a.pinned ? 1 : 0;
    const pinB = b.pinned ? 1 : 0;
    if (pinB !== pinA) {
      return pinB - pinA;
    }

    if (autoSortMomentum || sortBy === 'Momentum') {
      const scoreA = calculateMomentumScore(a);
      const scoreB = calculateMomentumScore(b);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }

    if (sortBy === 'Name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'Deadline') {
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
    if (sortBy === 'Priority') {
      const priorityWeight = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };
      const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
      const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
    return 0;
  });

  const archivedProjects = filteredProjects.filter(project => {
    return project.status === 'archived';
  }).sort((a, b) => {
    if (autoSortMomentum || sortBy === 'Momentum') {
      const scoreA = calculateMomentumScore(a);
      const scoreB = calculateMomentumScore(b);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }

    if (sortBy === 'Name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'Deadline') {
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
    if (sortBy === 'Priority') {
      const priorityWeight = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };
      const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
      const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
    return 0;
  });

  // Count overdue milestones across all projects (Date: 2026-07-18)
  const anchorDate = new Date('2026-07-18');
  const getOverdueCount = () => {
    let count = 0;
    projects.forEach(p => {
      // Exclude archived projects' milestones from overdue notifications
      if (p.status === 'archived') return;
      (p.milestones || []).forEach(m => {
        if (!m.completed && new Date(m.date).getTime() < anchorDate.getTime()) {
          count++;
        }
      });
    });
    return count;
  };

  const totalOverdueMilestones = getOverdueCount();

  // Count pending (incomplete) milestones across non-archived projects
  const getPendingMilestonesCount = () => {
    let count = 0;
    projects.forEach(p => {
      if (p.status === 'archived') return;
      (p.milestones || []).forEach(m => {
        if (!m.completed) {
          count++;
        }
      });
    });
    return count;
  };

  const pendingMilestonesCount = getPendingMilestonesCount();

  // Calculate high-fidelity metrics for the Sophisticated Dark header
  const activeInitiativesCount = projects.filter(p => p.status === 'active').length;
  
  // Persistent Navigation Preferences State
  const [swipeEnabled, setSwipeEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('nav_pref_swipe_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [autoHideEnabled, setAutoHideEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('nav_pref_autohide_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('nav_pref_haptic_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // App Theme Mode State: 'dark' (default) | 'light' (high-contrast light mode)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app_theme_mode');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('nav_pref_swipe_enabled', String(swipeEnabled));
  }, [swipeEnabled]);

  useEffect(() => {
    localStorage.setItem('nav_pref_autohide_enabled', String(autoHideEnabled));
  }, [autoHideEnabled]);

  useEffect(() => {
    localStorage.setItem('nav_pref_haptic_enabled', String(hapticEnabled));
  }, [hapticEnabled]);

  useEffect(() => {
    localStorage.setItem('app_theme_mode', themeMode);
  }, [themeMode]);

  // Safe helper to trigger subtle haptic vibration on mobile with custom patterns
  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (!hapticEnabled) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore errors from browser security sandboxes
      }
    }
  };

  // State and ref for managing scroll-to-hide behavior of bottom navigation bar
  const [showBottomBar, setShowBottomBar] = useState(true);
  const lastScrollTopRef = React.useRef(0);

  // Monitor scroll direction in the capture phase to auto-hide the bottom nav bar
  useEffect(() => {
    if (!autoHideEnabled) {
      setShowBottomBar(true);
      return;
    }

    setShowBottomBar(true);
    lastScrollTopRef.current = 0;

    const container = document.getElementById('app-container');
    if (!container) return;

    const handleScroll = (e: Event) => {
      if (!autoHideEnabled) {
        setShowBottomBar(true);
        return;
      }

      const target = e.target as HTMLElement;
      if (!target || typeof target.scrollTop === 'undefined') return;

      // Ensure we are targeting an active scrollable list element
      const isScrollable = target.classList.contains('overflow-y-auto') || target.id === 'analytics-view';
      if (!isScrollable) return;

      const currentScrollTop = target.scrollTop;
      const difference = currentScrollTop - lastScrollTopRef.current;

      // Add a small threshold (8px) to prevent jitter and bounce sensitivity
      if (Math.abs(difference) > 8) {
        if (difference > 0 && currentScrollTop > 40) {
          // Scrolling down: slide out
          setShowBottomBar(false);
        } else {
          // Scrolling up: slide back in
          setShowBottomBar(true);
        }
        lastScrollTopRef.current = currentScrollTop;
      }
    };

    container.addEventListener('scroll', handleScroll, true);
    return () => {
      container.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeTab, autoHideEnabled]);

  // Immediately reveal bottom bar if autoHide is disabled
  useEffect(() => {
    if (!autoHideEnabled) {
      setShowBottomBar(true);
    }
  }, [autoHideEnabled]);

  // Custom long press detection for accessing Quick Settings context popup
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [quickSettingsSourceTab, setQuickSettingsSourceTab] = useState<'projects' | 'timeline' | 'analytics' | null>(null);
  
  const longPressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = React.useRef<number>(0);
  const isLongPressedRef = React.useRef<boolean>(false);

  const startPress = (tab: 'projects' | 'timeline' | 'analytics') => {
    pressStartTimeRef.current = Date.now();
    isLongPressedRef.current = false;
    
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressedRef.current = true;
      setQuickSettingsSourceTab(tab);
      setQuickSettingsOpen(true);
      triggerHaptic([40, 30]); // Double tactile pattern for long press menu trigger
    }, 550); // 550ms is perfect threshold to distinguish hold from tap
  };

  const endPress = (tab: 'projects' | 'timeline' | 'analytics') => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const duration = Date.now() - pressStartTimeRef.current;
    
    // Only register as a click / tap if we didn't cross the long-press threshold
    if (!isLongPressedRef.current && duration < 550) {
      setActiveTab(tab);
      triggerHaptic(tab === 'analytics' ? [10, 40, 10] : 10);
    }
    
    isLongPressedRef.current = false;
  };

  const cancelPress = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    isLongPressedRef.current = false;
  };

  // Calculate average velocity across non-archived projects
  const getAverageVelocity = () => {
    const nonArchived = projects.filter(p => p.status !== 'archived');
    if (nonArchived.length === 0) return 0;
    let totalProgress = 0;
    nonArchived.forEach(p => {
      const inits = p.initiatives || [];
      if (inits.length === 0) {
        totalProgress += p.status === 'completed' ? 100 : 0;
      } else {
        const pProg = inits.reduce((acc, i) => acc + (i.progress || 0), 0) / inits.length;
        totalProgress += pProg;
      }
    });
    return Math.round(totalProgress / nonArchived.length);
  };
  const averageVelocity = getAverageVelocity();

  // Reset all filters easily
  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedCollaborator !== 'All' || showArchived || searchArchivedOnly;
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedCollaborator('All');
    setShowArchived(false);
    setSearchArchivedOnly(false);
  };

  return (
    <PhoneFrame>
      <div 
        id="app-container" 
        className={`flex flex-col h-full min-h-0 relative text-stone-300 transition-colors duration-300 ${
          themeMode === 'light' ? 'light-mode bg-slate-50 text-slate-900' : 'bg-[#0a0a0a]'
        }`}
      >
        
        {/* Floating Toast Notification Bar */}
        {activeReminders.length > 0 && (
          <div className="absolute top-4 left-4 right-4 z-[9999] space-y-2 pointer-events-auto">
            {activeReminders.map(rem => {
              const isEarlyWarning = rem.type === 'early_warning';
              return (
                <div 
                  key={rem.id} 
                  className={`border rounded-xl p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.65)] flex items-start gap-3 backdrop-blur-md transition-all duration-300 ${
                    isEarlyWarning
                      ? 'bg-[#181105]/95 border-amber-400/60 shadow-amber-500/15'
                      : 'bg-stone-950/95 border-amber-500/30'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    isEarlyWarning ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {isEarlyWarning ? <AlertTriangle className="w-4 h-4 animate-bounce" /> : <Bell className="w-4 h-4 animate-bounce" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isEarlyWarning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-amber-400'
                      }`}>
                        {isEarlyWarning ? '⚡ 24-Hour Early Warning' : '⏰ Local Deadline Reminder'}
                      </span>
                      {rem.deadlineText && (
                        <span className="text-[9px] font-mono text-stone-400">
                          Due: {rem.deadlineText}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white font-medium leading-normal">
                      {rem.message}
                    </p>
                    {rem.projectId && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          onClick={() => {
                            const targetP = projects.find(p => p.id === rem.projectId);
                            if (targetP) {
                              setSelectedProject(targetP);
                              setActiveReminders(prev => prev.filter(r => r.id !== rem.id));
                            }
                          }}
                          className="text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider flex items-center gap-1 cursor-pointer underline decoration-amber-500/40"
                        >
                          View Initiative &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setActiveReminders(prev => prev.filter(r => r.id !== rem.id))}
                    className="p-1 text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                    title="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB VIEW 1: PROJECTS HUB */}
        {activeTab === 'projects' && (
          <div className="flex flex-col flex-1">
            
            {/* Header section with brand and quick summary notifications */}
            <div className="px-5 pt-6 pb-4 flex items-end justify-between border-b border-white/[0.04]">
              <div className="flex flex-col gap-0.5 select-none">
                <h1 className="font-serif font-light text-2xl text-white tracking-tight leading-none">
                  Ultra-Ject<span className="text-stone-500 italic font-normal">5</span>
                </h1>
                <p className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold">
                  Project Management Suite
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Export / Backup Hub trigger */}
                <button
                  onClick={() => {
                    setExportInitialProject(null);
                    setShowExportModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-[#121212] hover:bg-stone-800 border border-white/[0.05] text-stone-400 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                  title="Export & Backup Hub"
                >
                  <Database className="w-4 h-4" />
                </button>

                {/* Quick Settings & Theme Switcher trigger */}
                <button
                  id="quick-settings-header-btn"
                  onClick={() => {
                    setQuickSettingsSourceTab(activeTab);
                    setQuickSettingsOpen(true);
                    triggerHaptic(10);
                  }}
                  className="p-1.5 rounded-lg bg-[#121212] hover:bg-stone-800 border border-white/[0.05] text-stone-400 hover:text-amber-400 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                  title="Quick Settings & Preferences"
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                </button>

                {/* Alert Badge for Overdue Milestones */}
                {totalOverdueMilestones > 0 && (
                  <div className="relative">
                    <button 
                      onClick={() => setActiveTab('timeline')} 
                      className="p-1.5 rounded-lg bg-stone-900 border border-red-500/30 text-red-400 transition-all active:scale-95"
                      title={`${totalOverdueMilestones} Overdue Milestones`}
                    >
                      <Bell className="w-4 h-4 animate-pulse" />
                    </button>
                    <span className="absolute -top-1 -right-1 bg-red-500/90 text-white font-bold font-mono text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {totalOverdueMilestones}
                    </span>
                  </div>
                )}
                {/* Plus trigger to add new project */}
                <button
                  id="add-project-btn-primary"
                  onClick={() => {
                    setProjectToEdit(null);
                    setShowAddModal(true);
                  }}
                  className="bg-white hover:bg-stone-200 active:scale-95 text-stone-950 p-1.5 rounded-lg flex items-center justify-center transition-all focus:outline-none"
                >
                  <Plus className="w-4.5 h-4.5 font-bold" />
                </button>
              </div>
            </div>

            {/* HIGH-FIDELITY SUMMARY METRICS ROW (Matches the beautiful Sophisticated Dark layout patterns) */}
            <div className="grid grid-cols-3 px-5 py-3.5 border-b border-white/[0.04] bg-[#0d0d0d]">
              <div className="space-y-0.5">
                <span className="text-xl text-white font-light font-mono block leading-none">{activeInitiativesCount}</span>
                <p className="text-[8px] uppercase tracking-wider text-stone-500 font-semibold">Active</p>
              </div>
              <div className="space-y-0.5 border-l border-white/[0.04] pl-4">
                <span className="text-xl text-white font-light font-mono block leading-none">{averageVelocity}%</span>
                <p className="text-[8px] uppercase tracking-wider text-stone-500 font-semibold">Velocity</p>
              </div>
              <div className="space-y-0.5 border-l border-white/[0.04] pl-4">
                <span className={`text-xl font-light font-mono block leading-none ${totalOverdueMilestones > 0 ? 'text-red-400/90 underline decoration-1 underline-offset-2' : 'text-stone-400'}`}>
                  {String(totalOverdueMilestones).padStart(2, '0')}
                </span>
                <p className="text-[8px] uppercase tracking-wider text-stone-500 font-semibold">Critical</p>
              </div>
            </div>

            {/* Daily Focus Top Priority Goal Header Component */}
            <DailyFocus />

            {/* Quick Search Bar */}
            <div className="px-5 pt-3 pb-1.5">
              <div className="relative w-full">
                <Search className={`absolute left-3 top-2.5 w-3.5 h-3.5 ${searchArchivedOnly ? 'text-amber-400' : 'text-stone-600'}`} />
                <input
                  type="text"
                  placeholder={searchArchivedOnly ? "Search specifically in archived..." : "Search projects, subtasks..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full bg-[#121212] border rounded-lg pl-9 pr-8 py-2 text-xs text-stone-300 placeholder-stone-600 focus:outline-none transition-colors ${
                    searchArchivedOnly 
                      ? 'border-amber-500/40 focus:border-amber-500/70' 
                      : 'border-white/[0.06] focus:border-stone-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-stone-800 text-stone-500 hover:text-stone-300 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort, Auto-Sort Toggle & Collaborator Filters Row */}
            <div className="px-5 pb-2 flex gap-2 items-center select-none">
              {/* Sort Dropdown */}
              <div className="relative flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const val = e.target.value as 'Name' | 'Deadline' | 'Priority' | 'Momentum';
                    setSortBy(val);
                    if (val === 'Momentum') {
                      setAutoSortMomentum(true);
                    } else {
                      setAutoSortMomentum(false);
                    }
                  }}
                  className="w-full bg-[#121212] border border-white/[0.06] hover:border-white/[0.12] rounded-lg pl-8 pr-7 py-1.5 text-xs text-stone-400 hover:text-stone-200 focus:outline-none focus:border-stone-500 transition-all cursor-pointer font-sans appearance-none select-none"
                  title="Sort Projects"
                >
                  <option value="Deadline" className="bg-[#121212]">Sort: Deadline</option>
                  <option value="Name" className="bg-[#121212]">Sort: Name</option>
                  <option value="Priority" className="bg-[#121212]">Sort: Priority</option>
                  <option value="Momentum" className="bg-[#121212]">Sort: Momentum Score ⚡</option>
                </select>
                <SlidersHorizontal className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-stone-500 pointer-events-none" />
              </div>

              {/* Automated Momentum Sorting Toggle Switch */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !autoSortMomentum;
                  setAutoSortMomentum(nextState);
                  if (nextState) {
                    setSortBy('Momentum');
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  autoSortMomentum || sortBy === 'Momentum'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/5'
                    : 'bg-[#121212] border-white/[0.06] text-stone-500 hover:text-stone-300 hover:border-white/[0.12]'
                }`}
                title="Toggle Automated Sorting by Momentum Score (calculates deadline proximity, initiative progress %, and priority level)"
              >
                <Zap className={`w-3.5 h-3.5 ${autoSortMomentum || sortBy === 'Momentum' ? 'text-amber-400 fill-amber-400/20' : 'text-stone-500'}`} />
                <span className="hidden sm:inline">Auto-Sort</span>
              </button>

              {/* Collaborator Filter Dropdown */}
              <div className="relative flex-1">
                <select
                  value={selectedCollaborator}
                  onChange={(e) => setSelectedCollaborator(e.target.value)}
                  className="w-full bg-[#121212] border border-white/[0.06] hover:border-white/[0.12] rounded-lg pl-8 pr-7 py-1.5 text-xs text-stone-400 hover:text-stone-200 focus:outline-none focus:border-stone-500 transition-all cursor-pointer font-sans appearance-none select-none"
                  title="Filter by Collaborator"
                >
                  <option value="All" className="bg-[#121212]">All Members</option>
                  {allTeamMembers.map(member => (
                    <option key={member} value={member} className="bg-[#121212]">
                      {member}
                    </option>
                  ))}
                </select>
                <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-stone-500 pointer-events-none" />
              </div>
            </div>

            {/* Scrolling Horizontal Category Filter Pill Row */}
            <div className="px-5 pb-2">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {['All', 'Development', 'Design', 'Marketing', 'Operations', 'Finance'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 border transition-all ${
                      selectedCategory === cat
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-transparent border-white/[0.04] text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Segmented Pill Selector */}
            <div className="px-5 pb-3">
              <div className="flex bg-[#121212] p-0.5 rounded-lg border border-white/[0.06]">
                {['All', 'active', 'planning', 'on-hold', 'completed'].map((statusKey) => {
                  const label = statusKey === 'All' ? 'All Status' : statusKey === 'on-hold' ? 'On Hold' : statusKey;
                  const isActive = selectedStatus === statusKey;
                  return (
                    <button
                      key={statusKey}
                      onClick={() => setSelectedStatus(statusKey)}
                      className={`flex-1 py-1 text-[9px] uppercase tracking-wider font-bold rounded transition-all ${
                        isActive
                          ? 'bg-stone-800 text-white shadow-sm'
                          : 'text-stone-500 hover:text-stone-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Archive Toggle Row */}
            <div className="px-5 pb-3 flex items-center justify-between gap-2 select-none">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold font-mono">
                Initiative Stream
              </span>

              <div className="flex items-center gap-1.5">
                {showArchived && (
                  <button
                    onClick={() => setSearchArchivedOnly(!searchArchivedOnly)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                      searchArchivedOnly 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm' 
                        : 'bg-[#121212] border-white/[0.06] text-stone-500 hover:text-stone-300'
                    }`}
                    title="Restrict search to archived projects only"
                  >
                    <Search className="w-3 h-3 text-amber-400" />
                    {searchArchivedOnly ? 'Scope: Archived Only' : 'Scope: All'}
                  </button>
                )}

                <button
                  onClick={() => {
                    const nextVal = !showArchived;
                    setShowArchived(nextVal);
                    if (!nextVal) setSearchArchivedOnly(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                    showArchived 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                      : 'bg-[#121212] border-white/[0.04] text-stone-500 hover:text-stone-300'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  {showArchived ? 'Hide Archived' : 'Show Archived'}
                </button>
              </div>
            </div>

            {/* Project Cards Stream List */}
            <div className="flex-1 overflow-y-auto px-5 pb-20 space-y-4 no-scrollbar">
              {activeProjects.length === 0 && (!showArchived || archivedProjects.length === 0) ? (
                <div className="text-center py-12 border border-dashed border-white/[0.08] rounded-2xl bg-[#121212]/20 select-none">
                  <FolderKanban className="w-8 h-8 text-stone-800 mx-auto mb-2" />
                  <p className="text-xs text-stone-500 font-semibold">No initiatives match your query</p>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 text-xs bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 px-3 py-1 rounded-lg transition-all font-semibold"
                    >
                      Reset Active Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Active Initiatives Section */}
                  {activeProjects.length > 0 && (
                    <div className="space-y-3">
                      {showArchived && (
                        <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold font-mono pl-1 pt-1">
                          Active Initiatives ({activeProjects.length})
                        </div>
                      )}
                      {activeProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          searchQuery={searchQuery}
                          onClick={() => setSelectedProject(project)}
                          onUpdateProject={handleUpdateProjectDirect}
                          onDuplicateProject={handleDuplicateProject}
                          onTogglePinProject={handleTogglePinProject}
                        />
                      ))}
                    </div>
                  )}

                  {/* Empty active state notice if showing archived but no active initiatives */}
                  {showArchived && activeProjects.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-white/[0.05] rounded-xl text-[11px] text-stone-500 select-none">
                      No active initiatives found matching filters.
                    </div>
                  )}

                  {/* Archived Initiatives Section */}
                  {showArchived && archivedProjects.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="text-[10px] uppercase tracking-wider text-amber-500/80 font-bold font-mono pl-1 flex items-center gap-1.5 border-t border-white/[0.04] pt-4">
                        <Archive className="w-3.5 h-3.5" /> Archived Initiatives ({archivedProjects.length})
                      </div>
                      {archivedProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          searchQuery={searchQuery}
                          onClick={() => setSelectedProject(project)}
                          onUpdateProject={handleUpdateProjectDirect}
                          onDuplicateProject={handleDuplicateProject}
                          onTogglePinProject={handleTogglePinProject}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        )}

        {/* TAB VIEW 2: CHROMATIC TIMELINE */}
        {activeTab === 'timeline' && (
          <MilestonesTimeline 
            projects={projects} 
            onSelectProject={(proj) => {
              setSelectedProject(proj);
              setActiveTab('projects');
            }} 
          />
        )}

        {/* TAB VIEW 3: TELEMETRY ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsView projects={projects} />
        )}

        {/* BOTTOM NAVIGATION FIXED BAR */}
        <motion.div
          id="bottom-navigation-bar"
          drag={swipeEnabled ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_event, info) => {
            if (!swipeEnabled) return;
            const threshold = 30; // Swipe threshold in pixels
            const tabsOrder: ('projects' | 'timeline' | 'analytics')[] = ['projects', 'timeline', 'analytics'];
            const currentIndex = tabsOrder.indexOf(activeTab);
            
            if (info.offset.x < -threshold) {
              // Swiped Left -> Go to next tab (move right)
              if (currentIndex < tabsOrder.length - 1) {
                const nextTab = tabsOrder[currentIndex + 1];
                setActiveTab(nextTab);
                triggerHaptic(nextTab === 'analytics' ? [10, 40, 10] : 10);
              }
            } else if (info.offset.x > threshold) {
              // Swiped Right -> Go to previous tab (move left)
              if (currentIndex > 0) {
                const prevTab = tabsOrder[currentIndex - 1];
                setActiveTab(prevTab);
                triggerHaptic(prevTab === 'analytics' ? [10, 40, 10] : 10);
              }
            }
          }}
          animate={{ y: showBottomBar ? 0 : 80 }}
          transition={{ type: 'spring', stiffness: 350, damping: 32 }}
          className="absolute bottom-0 left-0 right-0 h-16 bg-[#0c0c0c] border-t border-white/[0.05] flex items-center justify-around px-2 py-1 select-none z-40 touch-none cursor-grab active:cursor-grabbing"
        >
          
          {/* Tab Button 1: Projects list */}
          <motion.button
            onMouseDown={() => startPress('projects')}
            onMouseUp={() => endPress('projects')}
            onMouseLeave={cancelPress}
            onTouchStart={() => startPress('projects')}
            onTouchEnd={() => endPress('projects')}
            onTouchCancel={cancelPress}
            onContextMenu={(e) => e.preventDefault()}
            whileTap={{ scale: 0.94, backgroundColor: "rgba(255, 255, 255, 0.06)" }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            aria-label="Initiatives view: View and search project initiatives. Long-press to open navigation preferences options menu."
            title="View Initiatives (Hold for Options)"
            aria-selected={activeTab === 'projects'}
            role="tab"
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all relative outline-none cursor-pointer ${
              activeTab === 'projects' ? 'text-white' : 'text-stone-600 hover:text-stone-400'
            }`}
          >
            {activeTab === 'projects' && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute inset-0 border border-amber-500/15 rounded-xl pointer-events-none"
                animate={{
                  backgroundColor: [
                    "rgba(245, 158, 11, 0.03)",
                    "rgba(245, 158, 11, 0.08)",
                    "rgba(245, 158, 11, 0.03)"
                  ],
                  borderColor: [
                    "rgba(245, 158, 11, 0.15)",
                    "rgba(251, 191, 36, 0.35)",
                    "rgba(245, 158, 11, 0.15)"
                  ],
                  boxShadow: [
                    "inset 0 1px 1px rgba(245,158,11,0.08), 0 0 10px rgba(245,158,11,0.06)",
                    "inset 0 1px 1px rgba(251,191,36,0.15), 0 0 16px rgba(251,191,36,0.15)",
                    "inset 0 1px 1px rgba(245,158,11,0.08), 0 0 10px rgba(245,158,11,0.06)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
            )}
            <motion.div
              animate={activeTab === 'projects' ? { x: [-6, 0], scale: 1.12 } : { x: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              className="relative z-10"
            >
              <div className="relative inline-block">
                <FolderKanban className="w-4.5 h-4.5 mb-0.5" />
                <Search className="absolute -bottom-0.5 -right-1.5 w-2.5 h-2.5 text-amber-500 stroke-[2.5]" />
              </div>
            </motion.div>
            <span className="text-[9px] font-bold uppercase tracking-wider relative z-10">Initiatives</span>
            {activeInitiativesCount > 0 && (
              <span className="absolute top-1 right-2 bg-amber-500 text-stone-950 text-[8.5px] font-mono font-bold h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center border border-[#0c0c0c] shadow-[0_0_6px_rgba(245,158,11,0.3)] z-20">
                {activeInitiativesCount}
              </span>
            )}
            {activeTab === 'projects' ? (
              <motion.div
                layoutId="activeTabIndicator"
                className="w-4 h-[2px] rounded-full mt-0.5 relative z-10"
                animate={{
                  backgroundColor: ["#f59e0b", "#fbbf24", "#f59e0b"],
                  boxShadow: [
                    "0 0 6px rgba(245,158,11,0.7)",
                    "0 0 12px rgba(251,191,36,1), 0 0 4px rgba(245,158,11,0.3)",
                    "0 0 6px rgba(245,158,11,0.7)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
            ) : (
              <div className="w-4 h-[2px] mt-0.5 bg-transparent" />
            )}
          </motion.button>
 
          {/* Tab Button 2: Road Checkpoints / Timeline */}
          <motion.button
            onMouseDown={() => startPress('timeline')}
            onMouseUp={() => endPress('timeline')}
            onMouseLeave={cancelPress}
            onTouchStart={() => startPress('timeline')}
            onTouchEnd={() => endPress('timeline')}
            onTouchCancel={cancelPress}
            onContextMenu={(e) => e.preventDefault()}
            whileTap={{ scale: 0.94, backgroundColor: "rgba(255, 255, 255, 0.06)" }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            aria-label="Milestones view: View timeline roadmap and checkpoints. Long-press to open navigation preferences options menu."
            title="View Milestones (Hold for Options)"
            aria-selected={activeTab === 'timeline'}
            role="tab"
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all relative outline-none cursor-pointer ${
              activeTab === 'timeline' ? 'text-white' : 'text-stone-600 hover:text-stone-400'
            }`}
          >
            {activeTab === 'timeline' && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute inset-0 border border-amber-500/15 rounded-xl pointer-events-none"
                animate={{
                  backgroundColor: [
                    "rgba(245, 158, 11, 0.03)",
                    "rgba(245, 158, 11, 0.08)",
                    "rgba(245, 158, 11, 0.03)"
                  ],
                  borderColor: [
                    "rgba(245, 158, 11, 0.15)",
                    "rgba(251, 191, 36, 0.35)",
                    "rgba(245, 158, 11, 0.15)"
                  ],
                  boxShadow: [
                    "inset 0 1px 1px rgba(245,158,11,0.08), 0 0 10px rgba(245,158,11,0.06)",
                    "inset 0 1px 1px rgba(251,191,36,0.15), 0 0 16px rgba(251,191,36,0.15)",
                    "inset 0 1px 1px rgba(245,158,11,0.08), 0 0 10px rgba(245,158,11,0.06)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
            )}
            <motion.div
              animate={activeTab === 'timeline' ? { x: [-6, 0], scale: 1.12 } : { x: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              className="relative z-10"
            >
              <Milestone className="w-4.5 h-4.5 mb-0.5" />
            </motion.div>
            <span className="text-[9px] font-bold uppercase tracking-wider relative z-10">Milestones</span>
            {pendingMilestonesCount > 0 && (
              <div className="absolute top-1 right-2 flex items-center justify-center z-20">
                {totalOverdueMilestones > 0 && (
                  <span className="absolute inset-0 rounded-full bg-red-500/60 animate-ping" />
                )}
                <span className={`relative text-[8.5px] font-mono font-bold h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center border border-[#0c0c0c] ${
                  totalOverdueMilestones > 0
                    ? 'bg-red-500 text-white shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                    : 'bg-stone-800 text-stone-300'
                }`}>
                  {pendingMilestonesCount}
                </span>
              </div>
            )}
            {activeTab === 'timeline' ? (
              <motion.div
                layoutId="activeTabIndicator"
                className="w-4 h-[2px] rounded-full mt-0.5 relative z-10"
                animate={{
                  backgroundColor: ["#f59e0b", "#fbbf24", "#f59e0b"],
                  boxShadow: [
                    "0 0 6px rgba(245,158,11,0.7)",
                    "0 0 12px rgba(251,191,36,1), 0 0 4px rgba(245,158,11,0.3)",
                    "0 0 6px rgba(245,158,11,0.7)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
            ) : (
              <div className="w-4 h-[2px] mt-0.5 bg-transparent" />
            )}
          </motion.button>
 
          {/* Tab Button 3: Analytics dashboard */}
          <motion.button
            onMouseDown={() => startPress('analytics')}
            onMouseUp={() => endPress('analytics')}
            onMouseLeave={cancelPress}
            onTouchStart={() => startPress('analytics')}
            onTouchEnd={() => endPress('analytics')}
            onTouchCancel={cancelPress}
            onContextMenu={(e) => e.preventDefault()}
            whileTap={{ scale: 0.94, backgroundColor: "rgba(255, 255, 255, 0.06)" }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            aria-label="Analytics view: View velocity, progress charts, and project statistics. Long-press to open navigation preferences options menu."
            title="View Analytics (Hold for Options)"
            aria-selected={activeTab === 'analytics'}
            role="tab"
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all relative outline-none cursor-pointer ${
              activeTab === 'analytics' ? 'text-white' : 'text-stone-600 hover:text-stone-400'
            }`}
          >
            {activeTab === 'analytics' && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute inset-0 border border-amber-500/15 rounded-xl pointer-events-none"
                animate={{
                  backgroundColor: [
                    "rgba(245, 158, 11, 0.03)",
                    "rgba(245, 158, 11, 0.08)",
                    "rgba(245, 158, 11, 0.03)"
                  ],
                  borderColor: [
                    "rgba(245, 158, 11, 0.15)",
                    "rgba(251, 191, 36, 0.35)",
                    "rgba(245, 158, 11, 0.15)"
                  ],
                  boxShadow: [
                    "inset 0 1px 1px rgba(245,158,11,0.08), 0 0 10px rgba(245,158,11,0.06)",
                    "inset 0 1px 1px rgba(251,191,36,0.15), 0 0 16px rgba(251,191,36,0.15)",
                    "inset 0 1px 1px rgba(245,158,11,0.08), 0 0 10px rgba(245,158,11,0.06)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
            )}
            <motion.div
              animate={activeTab === 'analytics' ? { x: [-6, 0], scale: 1.12 } : { x: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              className="relative z-10"
            >
              <BarChart3 className="w-4.5 h-4.5 mb-0.5" />
            </motion.div>
            <span className="text-[9px] font-bold uppercase tracking-wider relative z-10">Analytics</span>
            {activeTab === 'analytics' ? (
              <motion.div
                layoutId="activeTabIndicator"
                className="w-4 h-[2px] rounded-full mt-0.5 relative z-10"
                animate={{
                  backgroundColor: ["#f59e0b", "#fbbf24", "#f59e0b"],
                  boxShadow: [
                    "0 0 6px rgba(245,158,11,0.7)",
                    "0 0 12px rgba(251,191,36,1), 0 0 4px rgba(245,158,11,0.3)",
                    "0 0 6px rgba(245,158,11,0.7)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
            ) : (
              <div className="w-4 h-[2px] mt-0.5 bg-transparent" />
            )}
          </motion.button>
 
        </motion.div>

        {/* DETAILS BOTTOM-SHEET SLIDE OVER MODAL */}
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onUpdateProject={handleUpdateProjectDirect}
            onDeleteProject={handleDeleteProject}
            onEditProjectClick={triggerEditProject}
            onExportProject={(proj) => {
              setExportInitialProject(proj);
              setShowExportModal(true);
            }}
          />
        )}

        {/* CREATION & MODIFICATION FORM SHEET */}
        {showAddModal && (
          <AddProjectModal
            projectToEdit={projectToEdit}
            onClose={() => {
              setShowAddModal(false);
              setProjectToEdit(null);
            }}
            onSubmit={handleProjectSubmit}
          />
        )}

        {/* DATA EXPORT & BACKUP MODAL */}
        {showExportModal && (
          <ExportModal
            projects={projects}
            initialSelectedProject={exportInitialProject}
            onClose={() => {
              setShowExportModal(false);
              setExportInitialProject(null);
            }}
            onImportBackup={handleImportBackup}
          />
        )}

        {/* QUICK SETTINGS NAVIGATION OPTIONS POPUP */}
        <AnimatePresence>
          {quickSettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[#060606]/85 backdrop-blur-md z-50 flex items-center justify-center p-5"
            >
              <motion.div
                initial={{ y: 24, scale: 0.95, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 16, scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className="w-full max-w-[280px] bg-[#111111] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between bg-stone-900/40 select-none">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-200">Quick Settings & Preferences</span>
                  </div>
                  <button
                    onClick={() => {
                      setQuickSettingsOpen(false);
                      triggerHaptic(5);
                    }}
                    className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preferences List */}
                <div className="p-4 space-y-4 select-none">
                  <p className="text-[10px] text-stone-400 leading-normal bg-[#161616] p-2.5 rounded-xl border border-white/[0.02]">
                    Configuring preferences via <span className="text-amber-500 font-semibold">{quickSettingsSourceTab === 'projects' ? 'Initiatives' : quickSettingsSourceTab === 'timeline' ? 'Milestones' : 'Analytics'}</span> menu.
                  </p>

                  {/* Switch 0: App Theme Switcher */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]" id="quick-settings-theme-switcher">
                    <div className="flex flex-col gap-0.5 max-w-[140px]">
                      <span className="text-[11px] font-semibold text-stone-200 flex items-center gap-1.5">
                        {themeMode === 'light' ? (
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        Appearance
                      </span>
                      <span className="text-[9px] text-stone-500 leading-tight">
                        {themeMode === 'light' ? 'High-Contrast Light Mode' : 'Default Dark Mode'}
                      </span>
                    </div>
                    
                    {/* Theme Mode Toggle Pill Buttons */}
                    <div className="flex items-center p-0.5 bg-stone-900 border border-white/[0.08] rounded-lg gap-0.5">
                      <button
                        id="theme-toggle-dark-btn"
                        onClick={() => {
                          setThemeMode('dark');
                          triggerHaptic(10);
                        }}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                          themeMode === 'dark'
                            ? 'bg-amber-500 text-stone-950 shadow-sm'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                        title="Set to Default Dark Mode"
                      >
                        <Moon className="w-2.5 h-2.5" />
                        Dark
                      </button>
                      <button
                        id="theme-toggle-light-btn"
                        onClick={() => {
                          setThemeMode('light');
                          triggerHaptic(10);
                        }}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                          themeMode === 'light'
                            ? 'bg-amber-500 text-stone-950 shadow-sm'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                        title="Set to High-Contrast Light Mode"
                      >
                        <Sun className="w-2.5 h-2.5" />
                        Light
                      </button>
                    </div>
                  </div>

                  {/* Switch 1: Swipe Gestures */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5 max-w-[160px]">
                      <span className="text-[11px] font-semibold text-stone-200">Swipe Navigation</span>
                      <span className="text-[9px] text-stone-500 leading-tight">Swipe bottom bar left/right to change tabs</span>
                    </div>
                    <button
                      onClick={() => {
                        setSwipeEnabled(!swipeEnabled);
                        triggerHaptic(10);
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none flex items-center ${
                        swipeEnabled ? 'bg-amber-500' : 'bg-stone-800'
                      }`}
                    >
                      <motion.div
                        layout
                        className="w-4 h-4 rounded-full bg-stone-950 shadow-md"
                        animate={{ x: swipeEnabled ? 16 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Switch 2: Auto Hide on Scroll */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5 max-w-[160px]">
                      <span className="text-[11px] font-semibold text-stone-200">Auto-Hide on Scroll</span>
                      <span className="text-[9px] text-stone-500 leading-tight">Hide navigation bar when scrolling list views</span>
                    </div>
                    <button
                      onClick={() => {
                        setAutoHideEnabled(!autoHideEnabled);
                        triggerHaptic(10);
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none flex items-center ${
                        autoHideEnabled ? 'bg-amber-500' : 'bg-stone-800'
                      }`}
                    >
                      <motion.div
                        layout
                        className="w-4 h-4 rounded-full bg-stone-950 shadow-md"
                        animate={{ x: autoHideEnabled ? 16 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Switch 3: Tactile/Haptic Feedback */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5 max-w-[160px]">
                      <span className="text-[11px] font-semibold text-stone-200">Haptic Vibrations</span>
                      <span className="text-[9px] text-stone-500 leading-tight">Subtle tactile vibrations on tab changes & clicks</span>
                    </div>
                    <button
                      onClick={() => {
                        const nextVal = !hapticEnabled;
                        setHapticEnabled(nextVal);
                        if (nextVal) {
                          // Quick feedback to confirm enabling
                          if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                            try { navigator.vibrate(10); } catch (e) {}
                          }
                        }
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none flex items-center ${
                        hapticEnabled ? 'bg-amber-500' : 'bg-stone-800'
                      }`}
                    >
                      <motion.div
                        layout
                        className="w-4 h-4 rounded-full bg-stone-950 shadow-md"
                        animate={{ x: hapticEnabled ? 16 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Feature: 24h Early Warning Toast Demo */}
                  <div className="pt-3 border-t border-white/[0.04] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5 max-w-[160px]">
                        <span className="text-[11px] font-semibold text-stone-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          24h Early Warning
                        </span>
                        <span className="text-[9px] text-stone-500 leading-tight">Test and preview custom 24-hour deadline alert toast</span>
                      </div>
                      <button
                        onClick={() => {
                          const activeP = projects.find(p => p.status === 'active') || projects[0];
                          if (activeP) {
                            setActiveReminders(prev => [
                              ...prev,
                              {
                                id: `early-warn-demo-${Date.now()}`,
                                projectId: activeP.id,
                                projectName: activeP.name,
                                type: 'early_warning',
                                deadlineText: activeP.reminderDateTime?.replace('T', ' at ') || `${activeP.endDate} at 18:00`,
                                message: `The deadline for "${activeP.name}" is approaching in 24 hours! Prepare final deliverables and verify milestones.`
                              }
                            ]);
                            triggerHaptic([15, 40]);
                            setQuickSettingsOpen(false);
                          }
                        }}
                        className="px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Fire Toast
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-stone-950/60 border-t border-white/[0.04] flex items-center justify-between select-none">
                  <span className="text-[8px] text-stone-600 font-mono">WORKSPACE OPT V1.5</span>
                  <button
                    onClick={() => {
                      setQuickSettingsOpen(false);
                      triggerHaptic([10, 30]);
                    }}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 transition-colors text-stone-950 text-[9px] font-bold rounded-lg uppercase tracking-wide"
                  >
                    Save & Apply
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PhoneFrame>
  );
}
