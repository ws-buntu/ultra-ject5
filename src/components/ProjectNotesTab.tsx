import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Project, ProjectActivity } from '../types';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Code, Terminal, Quote,
  Link, Minus, Table, Sparkles, Copy, Check, Download,
  Trash2, RefreshCw, FileText, Eye, Edit3, Columns, Save,
  Clock, ArrowUpRight
} from 'lucide-react';

interface ProjectNotesTabProps {
  project: Project;
  onUpdateProject: (updatedProject: Project) => void;
}

export default function ProjectNotesTab({ project, onUpdateProject }: ProjectNotesTabProps) {
  const [notes, setNotes] = useState<string>(project.notes || '');
  const [editorMode, setEditorMode] = useState<'write' | 'preview' | 'split'>('write');
  const [copied, setCopied] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with project prop changes
  useEffect(() => {
    setNotes(project.notes || '');
    setIsSaved(true);
  }, [project.id, project.notes]);

  // Track unsaved state
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setIsSaved(false);
  };

  // Keyboard tab indentation support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = notes.substring(0, start) + '  ' + notes.substring(end);
      setNotes(newText);
      setIsSaved(false);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Insert markdown syntax helper
  const insertFormatting = (
    prefix: string,
    suffix: string = '',
    defaultPlaceholder: string = 'text',
    linePrefix: boolean = false
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);

    let replacement = '';
    let newCursorPos = start;

    if (linePrefix) {
      // Find start of current line
      const textBefore = notes.substring(0, start);
      const lastNewLine = textBefore.lastIndexOf('\n');
      const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
      
      const beforeLine = notes.substring(0, lineStart);
      const afterLineStart = notes.substring(lineStart);
      
      const newText = beforeLine + prefix + afterLineStart;
      setNotes(newText);
      setIsSaved(false);
      newCursorPos = start + prefix.length;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
      return;
    }

    const contentToWrap = selectedText || defaultPlaceholder;
    replacement = `${prefix}${contentToWrap}${suffix}`;
    const newText = notes.substring(0, start) + replacement + notes.substring(end);
    setNotes(newText);
    setIsSaved(false);

    newCursorPos = selectedText ? start + replacement.length : start + prefix.length + contentToWrap.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Save notes to project and log history activity
  const handleSave = () => {
    const trimmedNotes = notes.trim();
    const updatedHistory: ProjectActivity[] = [
      {
        id: `act-${Date.now()}-notes`,
        timestamp: new Date().toISOString(),
        type: 'project_edited',
        message: 'Updated project scratchpad notes',
        details: `${trimmedNotes.length} characters written in Markdown`
      },
      ...(project.history || [])
    ];

    onUpdateProject({
      ...project,
      notes: trimmedNotes,
      history: updatedHistory
    });

    setIsSaved(true);
    setSaveToast('Scratchpad saved successfully!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Copy notes to clipboard
  const handleCopyNotes = async () => {
    if (!notes.trim()) return;
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Download notes as .md file
  const handleDownloadMarkdown = () => {
    if (!notes.trim()) return;
    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-notes.md`;
    const blob = new Blob([notes], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Clear notes with confirmation
  const handleClearNotes = () => {
    if (window.confirm('Are you sure you want to clear all scratchpad notes for this project?')) {
      setNotes('');
      setIsSaved(false);
    }
  };

  // Template insert helper
  const insertTemplate = (templateContent: string) => {
    setNotes(prev => (prev.trim() ? `${prev.trim()}\n\n${templateContent}` : templateContent));
    setIsSaved(false);
    setEditorMode('write');
  };

  // Toggle interactive task in preview
  const handleToggleTaskInText = (lineIndex: number, originalLine: string) => {
    const lines = notes.split('\n');
    if (lines[lineIndex] !== undefined) {
      if (lines[lineIndex].includes('- [ ]')) {
        lines[lineIndex] = lines[lineIndex].replace('- [ ]', '- [x]');
      } else if (lines[lineIndex].includes('- [x]') || lines[lineIndex].includes('- [X]')) {
        lines[lineIndex] = lines[lineIndex].replace(/- \[[xX]\]/, '- [ ]');
      }
      const updated = lines.join('\n');
      setNotes(updated);
      setIsSaved(false);
    }
  };

  // Metrics
  const charCount = notes.length;
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const lineCount = notes ? notes.split('\n').length : 0;

  return (
    <div className="space-y-4" id={`project-notes-tab-${project.id}`}>
      {/* Header & Quick Actions Bar */}
      <div className="bg-gradient-to-br from-[#131313] to-[#0c0c0c] border border-white/[0.06] rounded-xl p-4 space-y-3.5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-200">
                Project Scratchpad & Documentation
              </span>
              <span
                className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  isSaved
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                }`}
              >
                {isSaved ? '● Saved' : '○ Unsaved Changes'}
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans">
              Write rich formatted notes, meeting minutes, architecture specs, and markdown checklists.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {notes.trim() && (
              <>
                <button
                  type="button"
                  onClick={handleCopyNotes}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-white/[0.06] text-stone-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Copy scratchpad markdown to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-white/[0.06] text-stone-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Download notes as .md file"
                >
                  <Download className="w-3.5 h-3.5 text-stone-400" />
                  <span className="hidden sm:inline">Export .md</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaved}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isSaved
                  ? 'bg-stone-800 text-stone-500 border border-white/[0.04] opacity-75'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-extrabold shadow-amber-500/20'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Notes</span>
            </button>
          </div>
        </div>

        {/* Save confirmation toast */}
        {saveToast && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-mono font-bold animate-pulse shadow-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>{saveToast}</span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-emerald-400/80">Project History Updated</span>
          </div>
        )}

        {/* Starter Templates Carousel */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" /> Insert Starter Template:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() =>
                insertTemplate(
                  `## 📋 Meeting Notes (${new Date().toLocaleDateString()})\n\n**Attendees:** \n**Goal / Objective:** \n\n### Key Discussion Points\n- \n\n### Action Items\n- [ ] Assign owner and next step\n- [ ] Follow up on timeline milestone\n\n> **Next Sync:** `
                )
              }
              className="px-2.5 py-1.5 rounded-lg bg-[#181818] hover:bg-stone-800 border border-white/[0.06] text-xs text-stone-300 hover:text-amber-400 font-sans transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              📋 Meeting Notes
            </button>

            <button
              type="button"
              onClick={() =>
                insertTemplate(
                  `## ✅ Project Deliverables & Review Checklist\n\n### Pre-Launch Verification\n- [ ] Requirements & User Stories verified\n- [ ] QA testing & cross-browser check complete\n- [ ] Security rules & API credentials audited\n- [ ] Analytics & tracking events configured\n\n### Post-Launch Signoff\n- [ ] Stakeholder review\n- [ ] Release documentation published`
                )
              }
              className="px-2.5 py-1.5 rounded-lg bg-[#181818] hover:bg-stone-800 border border-white/[0.06] text-xs text-stone-300 hover:text-amber-400 font-sans transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              ✅ Review Checklist
            </button>

            <button
              type="button"
              onClick={() =>
                insertTemplate(
                  `## 🛠️ Architecture & Tech Specs\n\n**Component Hierarchy:**\n\`\`\`\n[Client SPA] -> [API Handler] -> [State Engine]\n\`\`\`\n\n### Data Contracts & Interfaces\n- Key endpoints & schemas defined\n\n### Security & Performance\n> All sensitive operations isolated with client-side verification.`
                )
              }
              className="px-2.5 py-1.5 rounded-lg bg-[#181818] hover:bg-stone-800 border border-white/[0.06] text-xs text-stone-300 hover:text-amber-400 font-sans transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              🛠️ Tech Specs
            </button>

            <button
              type="button"
              onClick={() =>
                insertTemplate(
                  `## 💡 Brainstorming & Scratchpad\n\n### Core Ideas\n1. **Concept Alpha:** \n2. **Concept Beta:** \n\n### Pros & Cons\n| Concept | Advantages | Trade-offs |\n|---|---|---|\n| Alpha | Fast to deploy | Higher maintenance |\n| Beta | Scalable | Requires deeper planning |\n\n*Immediate Next Step:* `
                )
              }
              className="px-2.5 py-1.5 rounded-lg bg-[#181818] hover:bg-stone-800 border border-white/[0.06] text-xs text-stone-300 hover:text-amber-400 font-sans transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              💡 Brainstorming
            </button>

            <button
              type="button"
              onClick={() =>
                insertTemplate(
                  `## 🎯 Executive Project Brief\n\n**Executive Summary:** \n**Target Completion:** ${project.endDate}\n**Lead Owner:** ${project.owner}\n\n### Core Objectives\n- Primary objective 1\n- Primary objective 2\n\n### Success Metrics\n- Metric A target\n- Metric B target`
                )
              }
              className="px-2.5 py-1.5 rounded-lg bg-[#181818] hover:bg-stone-800 border border-white/[0.06] text-xs text-stone-300 hover:text-amber-400 font-sans transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              🎯 Executive Brief
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Preview Card Container */}
      <div className="bg-[#111111] rounded-xl border border-white/[0.05] p-4 space-y-3.5 shadow-lg">
        {/* Controls Toolbar: Mode switcher & Markdown formatting tools */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.05] pb-3 select-none">
          {/* Mode Switcher Pill Tabs */}
          <div className="flex items-center p-0.5 bg-[#171717] rounded-lg border border-white/[0.06] gap-0.5 self-start">
            <button
              type="button"
              onClick={() => setEditorMode('write')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                editorMode === 'write'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                editorMode === 'preview'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('split')}
              className={`hidden sm:flex px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider items-center gap-1.5 transition-all cursor-pointer ${
                editorMode === 'split'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Split View
            </button>
          </div>

          {/* Formatting Toolbar Buttons (shown in write or split mode) */}
          {(editorMode === 'write' || editorMode === 'split') && (
            <div className="flex items-center gap-1 bg-[#171717] p-1 rounded-lg border border-white/[0.06] flex-wrap">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**', 'bold text')}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Bold (**text**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*', 'italic text')}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Italic (*text*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('~~', '~~', 'strikethrough text')}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Strikethrough (~~text~~)"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-white/[0.08] mx-0.5" />

              <button
                type="button"
                onClick={() => insertFormatting('# ', '', '', true)}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Heading 1 (# Heading)"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('## ', '', '', true)}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Heading 2 (## Heading)"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('### ', '', '', true)}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Heading 3 (### Heading)"
              >
                <Heading3 className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-white/[0.08] mx-0.5" />

              <button
                type="button"
                onClick={() => insertFormatting('- [ ] ', '', '', true)}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Task Checklist (- [ ] Task)"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('- ', '', '', true)}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Bullet List (- Item)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('1. ', '', '', true)}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Numbered List (1. Item)"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ', '', '', true)}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Blockquote (> Quote)"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-white/[0.08] mx-0.5" />

              <button
                type="button"
                onClick={() => insertFormatting('`', '`', 'code')}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Inline Code (`code`)"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('```\n', '\n```', 'code block')}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Code Block (```code```)"
              >
                <Terminal className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('[', '](https://example.com)', 'Link Title')}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Hyperlink ([title](url))"
              >
                <Link className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  insertFormatting(
                    '\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| Item 1 | Item 2 | Item 3 |\n'
                  )
                }
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Insert Markdown Table"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n---\n')}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
                title="Horizontal Divider (---)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Metrics ticker */}
          <div className="text-[10px] font-mono text-stone-500 shrink-0 self-end md:self-auto">
            {charCount} chars • {wordCount} words • {lineCount} lines
          </div>
        </div>

        {/* Editor Body depending on Mode */}
        {editorMode === 'write' && (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Write Markdown or rich text scratchpad notes here...&#10;&#10;# Project Overview&#10;Key decisions and references for this initiative.&#10;&#10;### Checklist&#10;- [ ] Task A&#10;- [ ] Task B&#10;&#10;> Add links, code snippets, or notes anytime."
              rows={16}
              className="w-full bg-[#151515] border border-white/[0.06] focus:border-amber-500/60 rounded-xl p-4 text-xs font-mono text-stone-200 placeholder-stone-600 focus:outline-none resize-y leading-relaxed min-h-[280px] selection:bg-amber-500/30 selection:text-white"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 px-1">
              <span>Supports full GitHub-Flavored Markdown syntax & formatting</span>
              <span>Press Tab to indent</span>
            </div>
          </div>
        )}

        {editorMode === 'preview' && (
          <div className="min-h-[280px] max-h-[500px] overflow-y-auto p-4 bg-[#141414] border border-white/[0.05] rounded-xl font-sans text-stone-300">
            {notes.trim() ? (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-3">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-base font-bold text-white border-b border-white/[0.08] pb-1.5 mt-4 mb-2 font-serif">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-bold text-stone-100 border-b border-white/[0.05] pb-1 mt-3 mb-2 font-serif">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xs font-bold text-amber-400 mt-2.5 mb-1.5 font-mono uppercase tracking-wider">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-xs text-stone-300 leading-relaxed my-1.5 font-sans">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-2 space-y-1 list-disc pl-5 text-xs text-stone-300">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-2 space-y-1 list-decimal pl-5 text-xs text-stone-300 font-mono">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-xs text-stone-300 leading-snug">
                        {children}
                      </li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-amber-500/70 bg-amber-500/5 pl-3 py-1.5 my-2.5 text-xs italic text-stone-400 rounded-r">
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-stone-900 border border-white/[0.08] font-mono text-[10.5px] text-emerald-400"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="p-3 bg-stone-950 border border-white/[0.08] rounded-xl overflow-x-auto my-2.5 font-mono text-[11px] text-stone-300 leading-relaxed">
                        {children}
                      </pre>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 underline decoration-amber-500/40 font-medium inline-flex items-center gap-0.5 transition-colors"
                      >
                        {children}
                        <ArrowUpRight className="w-2.5 h-2.5 inline" />
                      </a>
                    ),
                    hr: () => <hr className="my-4 border-white/[0.08]" />,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3 rounded-lg border border-white/[0.08]">
                        <table className="w-full text-xs text-left border-collapse font-sans">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="bg-stone-900 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-stone-300 border-b border-white/[0.08]">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-xs text-stone-300 border-b border-white/[0.04]">
                        {children}
                      </td>
                    ),
                    input: ({ type, checked, ...props }) => {
                      if (type === 'checkbox') {
                        return (
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="mr-2 rounded accent-amber-500 align-middle"
                            {...props}
                          />
                        );
                      }
                      return <input type={type} {...props} />;
                    }
                  }}
                >
                  {notes}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <FileText className="w-8 h-8 text-stone-600 mx-auto opacity-50" />
                <p className="text-xs text-stone-500 italic">No notes written to preview yet.</p>
                <button
                  type="button"
                  onClick={() => setEditorMode('write')}
                  className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer"
                >
                  Switch to Write Mode
                </button>
              </div>
            )}
          </div>
        )}

        {editorMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-[300px]">
            {/* Editor Pane */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
                Editor (Markdown)
              </span>
              <textarea
                ref={textareaRef}
                value={notes}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Type here..."
                rows={16}
                className="w-full bg-[#151515] border border-white/[0.06] focus:border-amber-500/60 rounded-xl p-3.5 text-xs font-mono text-stone-200 placeholder-stone-600 focus:outline-none resize-none leading-relaxed h-[360px] overflow-y-auto"
              />
            </div>

            {/* Live Preview Pane */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/90 font-bold flex items-center gap-1">
                <Eye className="w-3 h-3" /> Live Rendered Output
              </span>
              <div className="h-[360px] overflow-y-auto p-3.5 bg-[#141414] border border-white/[0.05] rounded-xl font-sans text-stone-300">
                {notes.trim() ? (
                  <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-2.5">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-base font-bold text-white border-b border-white/[0.08] pb-1 mt-2 mb-1.5 font-serif">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm font-bold text-stone-100 border-b border-white/[0.05] pb-1 mt-2 mb-1 font-serif">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xs font-bold text-amber-400 mt-2 mb-1 font-mono uppercase tracking-wider">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-xs text-stone-300 leading-relaxed my-1 font-sans">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="my-1.5 space-y-0.5 list-disc pl-5 text-xs text-stone-300">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="my-1.5 space-y-0.5 list-decimal pl-5 text-xs text-stone-300 font-mono">
                            {children}
                          </ol>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-amber-500/70 bg-amber-500/5 pl-3 py-1 my-2 text-xs italic text-stone-400 rounded-r">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="px-1.5 py-0.5 rounded bg-stone-900 border border-white/[0.08] font-mono text-[10.5px] text-emerald-400">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="p-2.5 bg-stone-950 border border-white/[0.08] rounded-lg overflow-x-auto my-2 font-mono text-[10.5px] text-stone-300 leading-relaxed">
                            {children}
                          </pre>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:text-amber-300 underline font-medium"
                          >
                            {children}
                          </a>
                        )
                      }}
                    >
                      {notes}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-stone-600 italic text-xs py-8 text-center">
                    Type in the editor pane to preview formatted output in real time.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 mt-1">
          {notes.trim() ? (
            <button
              type="button"
              onClick={handleClearNotes}
              className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400/80 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Scratchpad</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNotes(project.notes || '');
                setIsSaved(true);
              }}
              disabled={isSaved}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-stone-400 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              Discard Changes
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaved}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isSaved
                  ? 'bg-stone-800 text-stone-400 border border-white/[0.04]'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
