import React, { useState, useEffect } from 'react';
import { Project, ProjectCategory, ProjectStatus, ProjectPriority, Initiative, Milestone } from '../types';
import { X, Save, AlertTriangle, Calendar, User, Layers, Tag, Check, Users } from 'lucide-react';

interface AddProjectModalProps {
  projectToEdit?: Project | null;
  onClose: () => void;
  onSubmit: (project: Project) => void;
}

const CATEGORIES: ProjectCategory[] = ['Development', 'Design', 'Marketing', 'Operations', 'Finance'];
const PRIORITIES: ProjectPriority[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: ProjectStatus[] = ['planning', 'active', 'on-hold', 'completed', 'archived'];

const COLORS_LIST = [
  { value: 'white', label: 'White', dotClass: 'bg-white' },
  { value: 'amber', label: 'Amber', dotClass: 'bg-amber-400' },
  { value: 'emerald', label: 'Emerald', dotClass: 'bg-emerald-400' },
  { value: 'rose', label: 'Rose', dotClass: 'bg-rose-400' },
  { value: 'blue', label: 'Blue', dotClass: 'bg-blue-400' },
  { value: 'violet', label: 'Violet', dotClass: 'bg-violet-400' },
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

  // Auto-save state variables
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftTime, setDraftTime] = useState<string>('');
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Keep a mutable ref of the latest form state to avoid stale closure in the setInterval timer
  const latestStateRef = React.useRef({
    name, description, category, status, priority, startDate, endDate, owner, color, notes, quickNotes, selectedTags, collaborators
  });

  React.useEffect(() => {
    latestStateRef.current = {
      name, description, category, status, priority, startDate, endDate, owner, color, notes, quickNotes, selectedTags, collaborators
    };
  }, [name, description, category, status, priority, startDate, endDate, owner, color, notes, quickNotes, selectedTags, collaborators]);

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
    } else {
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
        collaborators: collaborators
      };
      onSubmit(updatedProject);
    } else {
      // Seeding initiatives and milestones
      const { initiatives, milestones } = getPreseededInitiativesAndMilestones(category, startDate, endDate);
      
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
        initiatives,
        milestones,
        color,
        notes: notes.trim(),
        quickNotes: quickNotes.trim(),
        tags: selectedTags,
        collaborators: collaborators
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
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
              Accent Flair Color
            </label>
            <div className="flex items-center gap-2.5">
              {COLORS_LIST.map((col) => (
                <button
                  type="button"
                  key={col.value}
                  onClick={() => setColor(col.value)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
                    color === col.value
                      ? 'border-white bg-stone-900 scale-105 shadow-md'
                      : 'border-white/[0.08] bg-[#121212] hover:border-white/[0.2]'
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
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/[0.08] text-[10px] text-stone-300 font-mono"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                      className="text-stone-500 hover:text-stone-200 focus:outline-none cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Preset Tags Suggestions */}
            <div className="space-y-1">
              <span className="text-[8px] text-stone-600 font-bold uppercase tracking-wider font-mono">Preset Suggestions:</span>
              <div className="flex flex-wrap gap-1.5">
                {['urgent', 'work', 'personal', 'client', 'internal', 'research', 'marketing', 'technical'].map((preset) => {
                  const isSelected = selectedTags.includes(preset);
                  return (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => handleTogglePresetTag(preset)}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition-all border ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 font-bold'
                          : 'bg-[#121212] border-white/[0.04] text-stone-500 hover:text-stone-300'
                      }`}
                    >
                      #{preset}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Collaborators Section */}
          <div className="space-y-2.5">
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-stone-600" /> Collaborators & Team
            </label>

            {/* Collaborator Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add team member (e.g. Elena Rostova)..."
                value={collaboratorInput}
                onChange={(e) => setCollaboratorInput(e.target.value)}
                onKeyDown={handleCollaboratorInputKeyDown}
                className="flex-1 bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500 font-sans"
              />
              <button
                type="button"
                onClick={() => handleAddCollaborator()}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* Selected Collaborators Display */}
            {collaborators.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-stone-950/40 rounded-lg border border-white/[0.04]">
                {collaborators.map(person => (
                  <span
                    key={person}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/[0.08] text-[10px] text-stone-300 font-sans"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                    {person}
                    <button
                      type="button"
                      onClick={() => handleRemoveCollaborator(person)}
                      className="text-stone-500 hover:text-stone-200 focus:outline-none cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
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
