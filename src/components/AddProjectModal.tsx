import React, { useState, useEffect } from 'react';
import { Project, ProjectCategory, ProjectStatus, ProjectPriority, Initiative, Milestone, ProjectGoal } from '../types';
import { X, Save, AlertTriangle, Calendar, User, Layers, Tag, Check, Users, Target, Sparkles } from 'lucide-react';
import { getTagStyle } from '../utils/tagUtils';
import { normalizeGoals } from '../utils/goalUtils';
import { getInitials, getAvatarColor } from '../utils/avatarUtils';
import { COLOR_OPTIONS, generateColorPalette } from '../utils/colorUtils';

interface AddProjectModalProps {
  projectToEdit?: Project | null;
  onClose: () => void;
  onSubmit: (project: Project) => void;
}

const CATEGORIES: ProjectCategory[] = ['Development', 'Design', 'Marketing', 'Operations', 'Finance'];
const PRIORITIES: ProjectPriority[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: ProjectStatus[] = ['planning', 'active', 'on-hold', 'completed', 'archived'];

interface ProjectTemplate {
  id: string;
  name: string;
  icon: string;
  category: ProjectCategory;
  priority: ProjectPriority;
  description: string;
  tags: string[];
  goals: string[];
  initiatives: Array<{ title: string; completed?: boolean; progress?: number }>;
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'web-app',
    name: 'Web App Launch',
    icon: '⚡',
    category: 'Development',
    priority: 'high',
    description: 'Full-stack web application development setup with architecture scaffolding, API endpoints, and QA testing.',
    tags: ['web', 'release', 'dev'],
    goals: [
      'Achieve 99.9% uptime on production infrastructure',
      'Complete security & penetration audit',
      'Onboard 500 active beta users within 14 days'
    ],
    initiatives: [
      { title: 'Define repository architecture & scaffolding', completed: true, progress: 100 },
      { title: 'Develop core API controllers and database models', completed: false, progress: 35 },
      { title: 'Integrate automated test suite and CI/CD pipelines', completed: false, progress: 0 }
    ]
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    icon: '📣',
    category: 'Marketing',
    priority: 'medium',
    description: 'Multi-channel acquisition campaign with content creation, social media ads, and lead conversion funnels.',
    tags: ['marketing', 'growth', 'campaign'],
    goals: [
      'Generate 2,500 qualified lead signups',
      'Achieve 3.5% click-through rate across ad channels',
      'Publish 6 high-value blog articles & whitepapers'
    ],
    initiatives: [
      { title: 'Design promo graphics and landing page copy', completed: false, progress: 50 },
      { title: 'Setup email automation drip sequences', completed: false, progress: 10 },
      { title: 'Launch search and paid social campaigns', completed: false, progress: 0 }
    ]
  },
  {
    id: 'brand-redesign',
    name: 'Brand & UI Redesign',
    icon: '🎨',
    category: 'Design',
    priority: 'high',
    description: 'Complete visual identity overhaul including component design tokens, typography pairing, and user testing.',
    tags: ['design', 'ui-ux', 'branding'],
    goals: [
      'Build unified Figma design token library',
      'Ensure WCAG AA compliance across all UI components',
      'Improve user aesthetic satisfaction rating by 30%'
    ],
    initiatives: [
      { title: 'Conduct competitor visual audit & moodboard creation', completed: true, progress: 100 },
      { title: 'Craft high-fidelity UI wireframes and micro-interactions', completed: false, progress: 40 },
      { title: 'Validate component contrast and mobile responsiveness', completed: false, progress: 0 }
    ]
  },
  {
    id: 'systems-audit',
    name: 'Systems Operations Audit',
    icon: '⚙️',
    category: 'Operations',
    priority: 'medium',
    description: 'Operational audit to reduce tool redundancy, optimize team workflows, and standardize documentation.',
    tags: ['ops', 'audit', 'workflow'],
    goals: [
      'Reduce redundant software subscription costs by 20%',
      'Maintain SLA support response time under 2 hours',
      'Standardize onboarding documentation across teams'
    ],
    initiatives: [
      { title: 'Audit current software tooling & unused seat licenses', completed: false, progress: 60 },
      { title: 'Draft updated team Standard Operating Procedures (SOPs)', completed: false, progress: 15 },
      { title: 'Conduct workflow bottleneck review with team leads', completed: false, progress: 0 }
    ]
  },
  {
    id: 'quarterly-finance',
    name: 'Q3 Financial Review',
    icon: '📊',
    category: 'Finance',
    priority: 'high',
    description: 'Quarterly financial ledger reconciliation, budget forecasting, and stakeholder reporting.',
    tags: ['finance', 'budget', 'q-review'],
    goals: [
      'Reconcile 100% of departmental ledger accounts',
      'Maintain 6-month cash runway margin buffer',
      'Deliver final Q3 financial health report to board'
    ],
    initiatives: [
      { title: 'Audit department expenditures and vendor contracts', completed: true, progress: 100 },
      { title: 'Construct cash flow forecast models', completed: false, progress: 30 },
      { title: 'Finalize board-ready financial deck', completed: false, progress: 0 }
    ]
  }
];

export default function AddProjectModal({ projectToEdit, onClose, onSubmit }: AddProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Development');
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [startDate, setStartDate] = useState('2026-07-18');
  const [endDate, setEndDate] = useState('2026-09-30');
  const [owner, setOwner] = useState('');
  const [color, setColor] = useState<string>('white');
  const [notes, setNotes] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [goalsList, setGoalsList] = useState<ProjectGoal[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [earlyWarningEnabled, setEarlyWarningEnabled] = useState(projectToEdit?.earlyWarningEnabled ?? true);

  // Project Templates State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateInitiatives, setTemplateInitiatives] = useState<Initiative[] | null>(null);
  const [templateToast, setTemplateToast] = useState<string>('');

  const handleSelectTemplate = (tpl: ProjectTemplate) => {
    setSelectedTemplateId(tpl.id);
    setName(tpl.name);
    setDescription(tpl.description);
    setCategory(tpl.category);
    setPriority(tpl.priority);
    setSelectedTags(tpl.tags);
    
    // Set goals from template
    const newGoals: ProjectGoal[] = tpl.goals.map((gText, idx) => ({
      id: `goal-tpl-${Date.now()}-${idx}`,
      text: gText,
      completed: false
    }));
    setGoalsList(newGoals);

    // Set initiatives from template
    const newInits: Initiative[] = tpl.initiatives.map((init, idx) => ({
      id: `init-tpl-${Date.now()}-${idx}`,
      title: init.title,
      completed: init.completed || false,
      progress: init.progress || 0
    }));
    setTemplateInitiatives(newInits);

    setTemplateToast(`Applied "${tpl.name}" template with pre-configured goals & initiatives!`);
    setTimeout(() => setTemplateToast(''), 3500);
  };

  const handleAddGoal = () => {
    const trimmed = goalInput.trim();
    if (trimmed) {
      const newGoal: ProjectGoal = {
        id: `goal-${Date.now()}`,
        text: trimmed,
        completed: false
      };
      setGoalsList([...goalsList, newGoal]);
      setGoalInput('');
    }
  };

  const handleGoalInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAddGoal();
    }
  };

  const handleToggleGoal = (id: string) => {
    setGoalsList(goalsList.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const handleRemoveGoal = (id: string) => {
    setGoalsList(goalsList.filter(g => g.id !== id));
  };

  // Auto-save state variables
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftTime, setDraftTime] = useState<string>('');
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Keep a mutable ref of the latest form state to avoid stale closure in the setInterval timer
  const latestStateRef = React.useRef({
    name, description, category, status, priority, startDate, endDate, owner, color, notes, quickNotes, selectedTags, collaborators, goalsList
  });

  React.useEffect(() => {
    latestStateRef.current = {
      name, description, category, status, priority, startDate, endDate, owner, color, notes, quickNotes, selectedTags, collaborators, goalsList
    };
  }, [name, description, category, status, priority, startDate, endDate, owner, color, notes, quickNotes, selectedTags, collaborators, goalsList]);

  // Handle Discarding saved draft
  const handleDiscardDraft = () => {
    const key = projectToEdit ? `draft_project_edit_${projectToEdit.id}` : 'draft_project_new';
    localStorage.removeItem(key);
    
    // Reset back to original values
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setDescription(projectToEdit.description || '');
      setCategory(projectToEdit.category || 'Development');
      setStatus(projectToEdit.status || 'planning');
      setPriority(projectToEdit.priority || 'medium');
      setStartDate(projectToEdit.startDate || '2026-07-18');
      setEndDate(projectToEdit.endDate || '2026-09-30');
      setOwner(projectToEdit.owner || '');
      setColor(projectToEdit.color || 'white');
      setNotes(projectToEdit.notes || '');
      setQuickNotes(projectToEdit.quickNotes || '');
      setSelectedTags(projectToEdit.tags || []);
      setCollaborators(projectToEdit.collaborators || []);
      setGoalsList(normalizeGoals(projectToEdit.goals || []));
    } else {
      setName('');
      setDescription('');
      setCategory('Development');
      setStatus('planning');
      setPriority('medium');
      setStartDate('2026-07-18');
      setEndDate('2026-09-30');
      setColor(generateColorPalette());
      setNotes('');
      setQuickNotes('');
      setSelectedTags([]);
      setCollaborators([]);
      setGoalsList([]);
    }
    setDraftLoaded(false);
  };

  // Handle Editing initialization & Loading Auto-saved draft
  useEffect(() => {
    const key = projectToEdit ? `draft_project_edit_${projectToEdit.id}` : 'draft_project_new';
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft) {
          setName(draft.name || '');
          setDescription(draft.description || '');
          setCategory(draft.category || 'Development');
          setStatus(draft.status || 'planning');
          setPriority(draft.priority || 'medium');
          setStartDate(draft.startDate || '2026-07-18');
          setEndDate(draft.endDate || '2026-09-30');
          setOwner(draft.owner || '');
          setColor(draft.color || 'white');
          setNotes(draft.notes || '');
          setQuickNotes(draft.quickNotes || '');
          setSelectedTags(draft.selectedTags || []);
          setCollaborators(draft.collaborators || []);
          setGoalsList(normalizeGoals(draft.goalsList || draft.goals || []));
          
          setDraftLoaded(true);
          if (draft.timestamp) {
            const timeStr = new Date(draft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setDraftTime(timeStr);
          }
          return;
        }
      } catch (err) {
        console.error('Error loading auto-saved draft', err);
      }
    }

    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description);
      setCategory(projectToEdit.category);
      setStatus(projectToEdit.status);
      setPriority(projectToEdit.priority);
      setStartDate(projectToEdit.startDate);
      setEndDate(projectToEdit.endDate);
      setOwner(projectToEdit.owner);
      setColor(projectToEdit.color || 'white');
      setNotes(projectToEdit.notes || '');
      setQuickNotes(projectToEdit.quickNotes || '');
      setSelectedTags(projectToEdit.tags || []);
      setCollaborators(projectToEdit.collaborators || []);
      setGoalsList(normalizeGoals(projectToEdit.goals || []));
      setEarlyWarningEnabled(projectToEdit.earlyWarningEnabled ?? true);
    } else {
      // Default to current local date
      setName('');
      setDescription('');
      setCategory('Development');
      setStatus('planning');
      setPriority('medium');
      setStartDate('2026-07-18');
      setEndDate('2026-09-30');
      setColor('white');
      setNotes('');
      setQuickNotes('');
      setSelectedTags([]);
      setCollaborators([]);
      setGoalsList([]);
      setEarlyWarningEnabled(true);
    }
    setDraftLoaded(false);
  }, [projectToEdit]);

  // Periodic Auto-Save timer running every 5 seconds
  useEffect(() => {
    const key = projectToEdit ? `draft_project_edit_${projectToEdit.id}` : 'draft_project_new';

    const intervalId = setInterval(() => {
      const current = latestStateRef.current;
      
      // Check if fields are empty to prevent saving an un-interacted empty creation form
      const isNewEmpty = !projectToEdit && 
        !current.name.trim() && 
        !current.description.trim() && 
        !current.owner.trim() && 
        !current.notes.trim() && 
        !current.quickNotes.trim() && 
        current.selectedTags.length === 0 && 
        current.collaborators.length === 0;

      let hasChanges = false;
      if (projectToEdit) {
        hasChanges = 
          current.name !== (projectToEdit.name || '') ||
          current.description !== (projectToEdit.description || '') ||
          current.category !== projectToEdit.category ||
          current.status !== projectToEdit.status ||
          current.priority !== projectToEdit.priority ||
          current.startDate !== projectToEdit.startDate ||
          current.endDate !== projectToEdit.endDate ||
          current.owner !== (projectToEdit.owner || '') ||
          current.color !== (projectToEdit.color || 'white') ||
          current.notes !== (projectToEdit.notes || '') ||
          current.quickNotes !== (projectToEdit.quickNotes || '') ||
          JSON.stringify(current.selectedTags) !== JSON.stringify(projectToEdit.tags || []) ||
          JSON.stringify(current.collaborators) !== JSON.stringify(projectToEdit.collaborators || []);
      } else {
        hasChanges = !isNewEmpty;
      }

      if (hasChanges) {
        const payload = {
          ...current,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(payload));
        
        setShowAutoSaveIndicator(true);
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(timeNow);
        
        const timeoutId = setTimeout(() => {
          setShowAutoSaveIndicator(false);
        }, 1500);
        
        return () => clearTimeout(timeoutId);
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [projectToEdit]);

  // Pre-seed subtasks depending on category
  const getPreseededInitiativesAndMilestones = (cat: ProjectCategory, start: string, end: string) => {
    let initiatives: Initiative[] = [];
    let milestones: Milestone[] = [];

    const midDate = new Date(new Date(start).getTime() + (new Date(end).getTime() - new Date(start).getTime()) / 2)
      .toISOString().split('T')[0];

    switch (cat) {
      case 'Development':
        initiatives = [
          { id: `init-p-1`, title: 'Define repository architecture & scaffolding', progress: 100, completed: true },
          { id: `init-p-2`, title: 'Develop core API controllers and data schemas', progress: 30, completed: false },
          { id: `init-p-3`, title: 'Integrate verification suites & unit tests', progress: 0, completed: false }
        ];
        milestones = [
          { id: `mile-p-1`, title: 'Alpha API Ready', date: midDate, completed: false, notes: 'Milestone auto-seeded by category.' },
          { id: `mile-p-2`, title: 'Integrations Code Frozen', date: end, completed: false, notes: 'Submits for staging testing.' }
        ];
        break;
      case 'Design':
        initiatives = [
          { id: `init-p-1`, title: 'Produce interface wireframes and typography pairing', progress: 80, completed: false },
          { id: `init-p-2`, title: 'Conduct user research and layout validation surveys', progress: 10, completed: false }
        ];
        milestones = [
          { id: `mile-p-1`, title: 'Wireframes Finalization', date: midDate, completed: false, notes: 'Presentation to key product owners.' }
        ];
        break;
      case 'Marketing':
        initiatives = [
          { id: `init-p-1`, title: 'Analyze target audience metrics and search volumes', progress: 60, completed: false },
          { id: `init-p-2`, title: 'Coordinate content schedule with creative writers', progress: 0, completed: false }
        ];
        milestones = [
          { id: `mile-p-1`, title: 'Audience Report Signed Off', date: midDate, completed: false, notes: 'Strategy approval.' }
        ];
        break;
      case 'Operations':
        initiatives = [
          { id: `init-p-1`, title: 'Audit current systems tooling & redundant costs', progress: 40, completed: false },
          { id: `init-p-2`, title: 'Draft standardized employee training material', progress: 10, completed: false }
        ];
        milestones = [
          { id: `mile-p-1`, title: 'Systems Cost Savings Audit', date: midDate, completed: false, notes: 'Initial expense reduction targets met.' }
        ];
        break;
      case 'Finance':
        initiatives = [
          { id: `init-p-1`, title: 'Reconcile ledger accounts & credit line bounds', progress: 100, completed: true },
          { id: `init-p-2`, title: 'Draft projected margin trends & cash runway limits', progress: 20, completed: false }
        ];
        milestones = [
          { id: `mile-p-1`, title: 'Q3 Financial Health Statement', date: end, completed: false, notes: 'Submitted to stakeholders.' }
        ];
        break;
    }

    return { initiatives, milestones };
  };

  const handleTogglePresetTag = (tag: string) => {
    const cleanedTag = tag.toLowerCase().trim().replace(/^#/, '');
    if (selectedTags.includes(cleanedTag)) {
      setSelectedTags(selectedTags.filter(t => t !== cleanedTag));
    } else {
      setSelectedTags([...selectedTags, cleanedTag]);
    }
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleaned = customTagInput.toLowerCase().trim().replace(/^#/, '');
    if (cleaned && !selectedTags.includes(cleaned)) {
      setSelectedTags([...selectedTags, cleaned]);
    }
    setCustomTagInput('');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAddCustomTag();
    }
  };

  const handleAddCollaborator = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const nameToTrim = collaboratorInput.trim();
    if (nameToTrim && !collaborators.includes(nameToTrim)) {
      setCollaborators([...collaborators, nameToTrim]);
    }
    setCollaboratorInput('');
  };

  const handleCollaboratorInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAddCollaborator();
    }
  };

  const handleRemoveCollaborator = (name: string) => {
    setCollaborators(collaborators.filter(c => c !== name));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !owner.trim()) return;

    // Delete saved draft upon successful submission
    const key = projectToEdit ? `draft_project_edit_${projectToEdit.id}` : 'draft_project_new';
    localStorage.removeItem(key);

    if (projectToEdit) {
      // Keep old initiatives and milestones
      const updatedProject: Project = {
        ...projectToEdit,
        name: name.trim(),
        description: description.trim(),
        category,
        status,
        priority,
        startDate,
        endDate,
        owner: owner.trim(),
        color,
        notes: notes.trim(),
        quickNotes: quickNotes.trim(),
        tags: selectedTags,
        collaborators: collaborators,
        goals: goalsList,
        earlyWarningEnabled: earlyWarningEnabled
      };
      onSubmit(updatedProject);
    } else {
      // Seeding initiatives and milestones
      const { initiatives: defaultInits, milestones } = getPreseededInitiativesAndMilestones(category, startDate, endDate);
      const finalInitiatives = (templateInitiatives && templateInitiatives.length > 0) ? templateInitiatives : defaultInits;
      
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        category,
        status,
        priority,
        startDate,
        endDate,
        owner: owner.trim(),
        initiatives: finalInitiatives,
        milestones,
        color,
        notes: notes.trim(),
        quickNotes: quickNotes.trim(),
        tags: selectedTags,
        collaborators: collaborators,
        goals: goalsList,
        earlyWarningEnabled: earlyWarningEnabled
      };
      onSubmit(newProject);
    }
  };

  return (
    <div id="add-project-modal" className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end">
      
      {/* Background close click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content */}
      <div className="relative bg-[#0c0c0c] border-t border-white/[0.06] rounded-t-3xl max-h-[92%] flex flex-col shadow-2xl z-10">
        
        {/* Notch click handle */}
        <div className="w-12 h-1 bg-stone-800 rounded-full mx-auto my-3" onClick={onClose} />

        {/* Header */}
        <div className="px-6 pb-4 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-stone-500 font-semibold uppercase tracking-[0.25em] font-sans">
              {projectToEdit ? 'Metadata Engine' : 'Creative Builder'}
            </span>
            <h2 className="font-serif font-light text-xl text-white">
              {projectToEdit ? 'Edit Initiative Details' : 'Launch New Initiative'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-[#121212] hover:bg-stone-800 border border-white/[0.05] text-stone-500 hover:text-stone-300 transition-all focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4.5 no-scrollbar">
          
          {/* Draft Restoration Banner */}
          {draftLoaded && (
            <div className="bg-[#1c1c1c] border border-[#ffb020]/20 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-300 animate-in fade-in slide-in-from-top-2 duration-200 select-none">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Unsaved draft restored (from {draftTime || 'recently'}).
                </span>
              </div>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-amber-500/25 shrink-0"
              >
                Discard Draft
              </button>
            </div>
          )}

          {/* Preset Project Templates Selector */}
          {!projectToEdit && (
            <div className="space-y-2 bg-[#121212] p-3 rounded-xl border border-white/[0.06] select-none">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick-Start Templates
                </label>
                {selectedTemplateId && (
                  <span className="text-[9px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Template Applied
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-500 font-sans">
                Select a preset configuration to automatically prefill initiatives, goals, and metadata:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {PROJECT_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/40 shadow-lg'
                          : 'bg-stone-900/60 hover:bg-stone-800/80 border-white/[0.06] text-stone-300 hover:border-stone-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold font-sans flex items-center gap-1.5 truncate">
                          <span>{tpl.icon}</span>
                          <span className="truncate">{tpl.name}</span>
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[9.5px] text-stone-400 font-mono line-clamp-1">
                        {tpl.goals.length} goals • {tpl.initiatives.length} initiatives
                      </p>
                    </button>
                  );
                })}
              </div>

              {templateToast && (
                <div className="text-[10px] text-amber-300 font-mono font-medium pt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                  <span>{templateToast}</span>
                </div>
              )}
            </div>
          )}

          {/* Project Title */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
              Initiative Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Platform Checkout Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3.5 py-2 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 font-sans"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
              Scope Description *
            </label>
            <textarea
              placeholder="Provide a clear description of the project deliverables, targets, and scope boundaries..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3.5 py-2 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 resize-none font-sans"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
              Additional Notes (Long-form)
            </label>
            <textarea
              placeholder="Store any auxiliary links, reminders, or general references for this project..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3.5 py-2 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 resize-none font-sans"
            />
          </div>

          {/* Quick Notes */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-amber-500/90 uppercase tracking-wider font-mono block flex items-center gap-1">
              Quick Notes (Transient Memo)
            </label>
            <input
              type="text"
              placeholder="e.g. Sync with team on Monday, double-check API spec..."
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              className="w-full bg-[#121212] border border-amber-500/10 rounded-lg px-3.5 py-2 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-amber-500/30 font-sans"
            />
          </div>

          {/* Lead Owner */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
              Lead Owner *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-stone-600" />
              <input
                type="text"
                placeholder="e.g. Alex Chen (Tech Lead)"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.06] rounded-lg pl-9 pr-3.5 py-2 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 font-sans"
                required
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-2 select-none">
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                    category === cat
                      ? 'bg-white text-stone-950 border-white shadow-sm'
                      : 'bg-[#121212] border-white/[0.06] text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Selector */}
          <div className="space-y-2 select-none">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
                Accent Flair Color
              </label>
              <button
                type="button"
                onClick={() => setColor(generateColorPalette([], name || Date.now().toString()))}
                className="text-[9px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                title="Auto-assign unique accent color from palette"
              >
                <Sparkles className="w-2.5 h-2.5" /> Auto-Assign Color
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((col) => (
                <button
                  type="button"
                  key={col.value}
                  onClick={() => setColor(col.value)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                    color === col.value
                      ? 'border-white bg-stone-900 scale-110 shadow-md'
                      : 'border-white/[0.08] bg-[#121212] hover:border-white/[0.25]'
                  }`}
                  title={col.label}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${col.dotClass} flex items-center justify-center`}>
                    {color === col.value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0c0c0c]" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags / Custom Labels Multi-select & Input */}
          <div className="space-y-2.5">
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-stone-600" /> Tags & Custom Labels
            </label>
            
            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom tag (e.g. priority-one)..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1 bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 font-sans"
              />
              <button
                type="button"
                onClick={() => handleAddCustomTag()}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-stone-950/40 rounded-lg border border-white/[0.04]">
                {selectedTags.map(tag => {
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
                        onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                        className="ml-0.5 opacity-70 hover:opacity-100 focus:outline-none cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Preset Tags Suggestions */}
            <div className="space-y-1">
              <span className="text-[8px] text-stone-600 font-bold uppercase tracking-wider font-mono">Preset Suggestions:</span>
              <div className="flex flex-wrap gap-1.5">
                {['urgent', 'review', 'client', 'work', 'personal', 'internal', 'research', 'marketing', 'technical'].map((preset) => {
                  const isSelected = selectedTags.includes(preset);
                  const style = getTagStyle(preset);
                  return (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => handleTogglePresetTag(preset)}
                      className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono transition-all border ${
                        isSelected
                          ? `${style} font-bold ring-1 ring-amber-400/30 shadow-sm`
                          : 'bg-[#121212] border-white/[0.04] text-stone-500 hover:text-stone-300 hover:border-white/10'
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

          {/* Collaborators Section */}
          <div className="space-y-2.5">
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-stone-600" /> Collaborators & Team Invitations
            </label>

            {/* Collaborator Input */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter collaborator email (e.g. alex@company.com)..."
                value={collaboratorInput}
                onChange={(e) => setCollaboratorInput(e.target.value)}
                onKeyDown={handleCollaboratorInputKeyDown}
                className="flex-1 bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 font-sans"
              />
              <button
                type="button"
                onClick={() => handleAddCollaborator()}
                className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                + Invite
              </button>
            </div>

            {/* Selected Collaborators Display */}
            {collaborators.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-stone-950/40 rounded-lg border border-white/[0.04]">
                {collaborators.map(person => (
                  <span
                    key={person}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#161616] border border-white/[0.08] text-xs text-stone-200 font-sans shadow-sm"
                  >
                    <span className={`w-4 h-4 rounded-full text-[8px] font-mono font-bold flex items-center justify-center shrink-0 ${getAvatarColor(person)}`}>
                      {getInitials(person)}
                    </span>
                    <span className="truncate max-w-[160px]">{person}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCollaborator(person)}
                      className="text-stone-500 hover:text-stone-200 focus:outline-none cursor-pointer p-0.5 ml-0.5"
                      title="Remove collaborator"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Project Goals Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-500" /> Project Goals
              </label>
              {goalsList.length > 0 && (
                <span className="text-[9px] font-mono text-stone-400">
                  {goalsList.filter(g => g.completed).length}/{goalsList.length} Completed
                </span>
              )}
            </div>

            {/* Goal Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add key project objective or target..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={handleGoalInputKeyDown}
                className="flex-1 bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 font-sans"
              />
              <button
                type="button"
                onClick={handleAddGoal}
                className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                + Goal
              </button>
            </div>

            {/* Goals Checklist Display */}
            {goalsList.length > 0 && (
              <div className="space-y-1.5 p-2 bg-stone-950/40 rounded-lg border border-white/[0.04]">
                {goalsList.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded bg-white/5 border border-white/[0.06] text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleGoal(g.id)}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left focus:outline-none cursor-pointer"
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                        g.completed ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold' : 'border-stone-700 text-transparent'
                      }`}>
                        {g.completed ? <Check className="w-2.5 h-2.5" /> : null}
                      </span>
                      <span className={`truncate font-sans ${g.completed ? 'line-through text-stone-500' : 'text-stone-200'}`}>
                        {g.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(g.id)}
                      className="text-stone-500 hover:text-stone-200 focus:outline-none cursor-pointer p-0.5 shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grid fields: Priority & Status */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-stone-500 font-sans"
              >
                {PRIORITIES.map((prio) => (
                  <option key={prio} value={prio}>
                    {prio.charAt(0).toUpperCase() + prio.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-stone-500 font-sans"
              >
                {STATUSES.map((stat) => (
                  <option key={stat} value={stat}>
                    {stat === 'on-hold' ? 'On Hold' : stat === 'archived' ? 'Archived' : stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timeline bounds */}
          <div className="grid grid-cols-2 gap-3.5 pb-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-600" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-stone-500 font-sans"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-600" /> Target Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-stone-500 font-sans"
                required
              />
            </div>
          </div>

          {/* 24-Hour Early Warning Toggle */}
          <div className="bg-[#121212] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${earlyWarningEnabled ? 'bg-amber-400/20 text-amber-400' : 'bg-stone-800 text-stone-500'}`}>
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-stone-200 block font-mono">
                  24-Hour Early Warning Notification
                </span>
                <span className="text-[10px] text-stone-500 block leading-tight">
                  Trigger priority alert toast 24 hours prior to project deadline ({endDate})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEarlyWarningEnabled(!earlyWarningEnabled)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none flex items-center cursor-pointer shrink-0 ${
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

          {/* Auto-seeding notice */}
          {!projectToEdit && (
            <div className="bg-[#121212] border border-white/[0.04] rounded-xl p-3 flex items-start gap-2.5 text-[11px] leading-normal text-stone-400 select-none">
              <Check className="w-4 h-4 text-white shrink-0 mt-0.5 bg-white/10 p-0.5 rounded-full" />
              <p className="font-sans">
                <strong className="text-white">Smart Scaffold Active:</strong> Since this is a new project, we will automatically seed relevant sub-tasks & milestones designed specifically for the <strong>{category}</strong> category!
              </p>
            </div>
          )}

          {/* Spacer */}
          <div className="h-4" />
        </form>

        {/* Footer actions */}
        <div className="p-4 bg-[#0a0a0a] border-t border-white/[0.04] space-y-2">
          {/* Auto-save status indicator */}
          <div className="flex justify-between items-center text-[10px] text-stone-500 px-1 font-mono select-none">
            <span>* Indicates required field</span>
            {showAutoSaveIndicator ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                Auto-saved draft
              </span>
            ) : lastSavedTime ? (
              <span className="text-stone-600">
                Draft auto-saved at {lastSavedTime}
              </span>
            ) : (
              <span className="text-stone-600">
                Draft auto-saves every 5s
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-white hover:bg-stone-200 active:scale-[0.98] text-stone-950 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {projectToEdit ? 'Save Modifications' : 'Initialize & Deploy Initiative'}
          </button>
        </div>

      </div>
    </div>
  );
}
