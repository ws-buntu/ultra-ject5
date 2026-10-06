import React, { useState, useRef } from 'react';
import { Project } from '../types';
import { 
  X, Download, Upload, Copy, Check, FileText, FileJson, 
  AlertTriangle, CheckCircle, Database, HelpCircle, ListChecks, Target 
} from 'lucide-react';
import { normalizeGoals } from '../utils/goalUtils';

interface ExportModalProps {
  projects: Project[];
  onClose: () => void;
  onImportBackup: (importedProjects: Project[], mode: 'overwrite' | 'merge') => void;
  initialSelectedProject?: Project | null;
}

export function generateTextSummary(projects: Project[]): string {
  let text = `==================================================\n`;
  text += `   ULTRA-JECT 5 — PROJECT PORTFOLIO SUMMARY\n`;
  text += `   Generated on: ${new Date().toLocaleDateString()}\n`;
  text += `==================================================\n\n`;

  projects.forEach((proj, idx) => {
    const totalM = proj.milestones.length;
    const completedM = proj.milestones.filter(m => m.completed).length;
    
    let overallProgress = 0;
    if (proj.initiatives.length === 0) {
      overallProgress = proj.status === 'completed' ? 100 : 0;
    } else {
      overallProgress = Math.round(
        proj.initiatives.reduce((acc, i) => acc + i.progress, 0) / proj.initiatives.length
      );
    }

    const goals = normalizeGoals(proj.goals);
    const completedGoals = goals.filter(g => g.completed).length;

    text += `${idx + 1}. [${proj.category.toUpperCase()}] ${proj.name}\n`;
    text += `   --------------------------------------------------\n`;
    text += `   Owner:       ${proj.owner}\n`;
    text += `   Timeline:    ${proj.startDate} to ${proj.endDate}\n`;
    text += `   Status:      ${proj.status.toUpperCase()} (Priority: ${proj.priority.toUpperCase()})\n`;
    text += `   Progress:    ${overallProgress}% complete\n`;
    if (goals.length > 0) {
      text += `   Goals:       ${completedGoals} / ${goals.length} completed\n`;
    }
    text += `   Milestones:  ${completedM} / ${totalM} cleared\n\n`;
    
    if (proj.description) {
      text += `   Description:\n   ${proj.description.replace(/\n/g, '\n   ')}\n\n`;
    }

    if (goals.length > 0) {
      text += `   Project Goals Checklist:\n`;
      goals.forEach(g => {
        const check = g.completed ? '[✓]' : '[ ]';
        text += `     ${check} ${g.text}\n`;
      });
      text += `\n`;
    }

    if (proj.initiatives.length > 0) {
      text += `   Sub-Initiatives:\n`;
      proj.initiatives.forEach(init => {
        const check = init.completed ? '[✓]' : '[ ]';
        text += `     ${check} ${init.title} (${init.progress}%)\n`;
      });
      text += `\n`;
    }

    if (proj.milestones.length > 0) {
      text += `   Milestones Timeline:\n`;
      proj.milestones.forEach(m => {
        const check = m.completed ? '[✓] COMPLETED' : '[ ] PENDING';
        text += `     • ${m.date}: ${m.title} — ${check}\n`;
        if (m.notes) {
          text += `       Note: ${m.notes}\n`;
        }
      });
      text += `\n`;
    }

    text += `==================================================\n\n`;
  });

  return text;
}

export function generateSingleProjectSummary(proj: Project): string {
  const totalM = proj.milestones.length;
  const completedM = proj.milestones.filter(m => m.completed).length;
  
  let overallProgress = 0;
  if (proj.initiatives.length === 0) {
    overallProgress = proj.status === 'completed' ? 100 : 0;
  } else {
    overallProgress = Math.round(
      proj.initiatives.reduce((acc, i) => acc + i.progress, 0) / proj.initiatives.length
    );
  }

  const goals = normalizeGoals(proj.goals);
  const completedGoals = goals.filter(g => g.completed).length;

  let text = `==================================================\n`;
  text += `   ULTRA-JECT 5 — INITIATIVE BRIEF\n`;
  text += `   Generated on: ${new Date().toLocaleDateString()}\n`;
  text += `==================================================\n\n`;
  text += `Project Name:   ${proj.name}\n`;
  text += `Category:       ${proj.category}\n`;
  text += `Lead Owner:     ${proj.owner}\n`;
  text += `Timeline:       ${proj.startDate} to ${proj.endDate}\n`;
  text += `Status:         ${proj.status.toUpperCase()} (Priority: ${proj.priority.toUpperCase()})\n`;
  text += `Progress:       ${overallProgress}% complete\n`;
  if (goals.length > 0) {
    text += `Goals Status:   ${completedGoals} / ${goals.length} completed\n`;
  }
  text += `Milestones:     ${completedM} / ${totalM} cleared\n\n`;

  text += `Overview:\n${proj.description}\n\n`;

  if (goals.length > 0) {
    text += `Project Goals Checklist:\n`;
    goals.forEach(g => {
      const check = g.completed ? '[✓]' : '[ ]';
      text += `   ${check} ${g.text}\n`;
    });
    text += `\n`;
  }

  if (proj.initiatives.length > 0) {
    text += `Sub-Initiatives Checklist:\n`;
    proj.initiatives.forEach(init => {
      const check = init.completed ? '[✓]' : '[ ]';
      text += `   ${check} ${init.title} (${init.progress}%)\n`;
    });
    text += `\n`;
  }

  if (proj.milestones.length > 0) {
    text += `Milestones Chronological Timeline:\n`;
    proj.milestones.forEach(m => {
      const check = m.completed ? '[✓] COMPLETED' : '[ ] PENDING';
      text += `   • ${m.date}: ${m.title} — ${check}\n`;
      if (m.notes) {
        text += `     Note: ${m.notes}\n`;
      }
    });
    text += `\n`;
  }

  text += `==================================================\n`;
  return text;
}

export function generateGoalsChecklistText(projects: Project[], selectedProjectId: string): string {
  const targetProjects = selectedProjectId === 'all'
    ? projects
    : projects.filter(p => p.id === selectedProjectId);

  if (targetProjects.length === 0) return 'No projects found for the selected scope.';

  let text = `==================================================\n`;
  text += `   PROJECT GOALS & REQUIREMENTS CHECKLIST\n`;
  text += `   Generated on: ${new Date().toLocaleDateString()}\n`;
  text += `==================================================\n\n`;

  targetProjects.forEach((proj, idx) => {
    const goals = normalizeGoals(proj.goals);
    const completedGoals = goals.filter(g => g.completed).length;
    const percent = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

    text += `${idx + 1}. [${proj.category.toUpperCase()}] ${proj.name}\n`;
    text += `   Lead Owner: ${proj.owner} | Status: ${proj.status.toUpperCase()}\n`;
    text += `   Goals Summary: ${completedGoals}/${goals.length} Completed (${percent}%)\n`;
    text += `   --------------------------------------------------\n`;

    if (goals.length === 0) {
      text += `   (No project goals defined)\n\n`;
    } else {
      goals.forEach(g => {
        const check = g.completed ? '[✓]' : '[ ]';
        text += `   ${check} ${g.text}\n`;
      });
      text += `\n`;
    }
  });

  text += `==================================================\n`;
  return text;
}

export default function ExportModal({ 
  projects, 
  onClose, 
  onImportBackup,
  initialSelectedProject = null
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'backup'>('text');
  
  // Selection state for which project to export in text mode
  // "all" means export the complete portfolio summary
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialSelectedProject ? initialSelectedProject.id : 'all'
  );

  // Format mode: full brief or project goals checklist only
  const [exportFormatMode, setExportFormatMode] = useState<'brief' | 'goals'>('brief');

  // Clipboard copies
  const [copied, setCopied] = useState(false);

  // Backup files states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedImportData, setParsedImportData] = useState<Project[] | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Find target project for export
  const targetProject = projects.find(p => p.id === selectedProjectId);

  // Generate current text representation
  const summaryText = exportFormatMode === 'goals'
    ? generateGoalsChecklistText(projects, selectedProjectId)
    : (selectedProjectId === 'all' 
        ? generateTextSummary(projects) 
        : (targetProject ? generateSingleProjectSummary(targetProject) : ''));

  // Handle trigger text download
  const handleDownloadText = () => {
    const formatSuffix = exportFormatMode === 'goals' ? 'goals_checklist' : 'brief';
    const scopeSuffix = selectedProjectId === 'all' ? 'portfolio' : (targetProject?.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'initiative');
    const fileName = `ultra_ject5_${formatSuffix}_${scopeSuffix}.txt`;
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle JSON backup download
  const handleDownloadBackup = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ultra_ject5_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle Clipboard Copy
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  // Handle JSON file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setParsedImportData(null);
    setImportSuccessMsg(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Validate parsed object schema basically
        if (Array.isArray(json)) {
          const isValid = json.every(p => {
            return p && typeof p === 'object' && 'id' in p && 'name' in p && 'initiatives' in p && 'milestones' in p;
          });

          if (isValid) {
            setParsedImportData(json as Project[]);
          } else {
            setImportError('Invalid format. File must contain schema-compliant Project items.');
          }
        } else if (json && typeof json === 'object' && 'id' in json && 'name' in json) {
          // Single project import supported as well! Pack it into an array
          setParsedImportData([json as Project]);
        } else {
          setImportError('Invalid backup file. The JSON must represent a valid project portfolio array.');
        }
      } catch (err) {
        setImportError('Parsing failed. Ensure this file is a valid JSON document.');
      }
    };
    reader.readAsText(file);
  };

  // Run the backup import callback
  const handleExecuteImport = (mode: 'overwrite' | 'merge') => {
    if (!parsedImportData) return;
    onImportBackup(parsedImportData, mode);
    setImportSuccessMsg(`Successfully imported ${parsedImportData.length} initiative(s) with local state!`);
    setParsedImportData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div id="export-modal" className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end transition-all duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Bottom Sheet Box */}
      <div className="relative bg-[#0c0c0c] border-t border-white/[0.06] rounded-t-3xl max-h-[92%] flex flex-col shadow-2xl z-10">
        
        {/* Notch click handle */}
        <div className="w-12 h-1 bg-stone-800 rounded-full mx-auto my-3" onClick={onClose} />

        {/* Modal Header */}
        <div className="px-6 pb-4 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex flex-col gap-0.5 select-none">
            <span className="text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold font-sans">
              Data Portability
            </span>
            <h2 className="font-serif font-light text-xl text-white">
              Export & Backup Hub
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-[#121212] hover:bg-stone-800 border border-white/[0.05] text-stone-500 hover:text-stone-300 transition-all focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="px-6 pt-4">
          <div className="flex p-0.5 bg-[#121212] rounded-lg border border-white/[0.06]">
            <button
              onClick={() => {
                setActiveTab('text');
                setImportSuccessMsg(null);
                setImportError(null);
              }}
              className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'text' 
                  ? 'bg-stone-800 text-white shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Text Summaries
            </button>
            <button
              onClick={() => {
                setActiveTab('backup');
              }}
              className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'backup' 
                  ? 'bg-stone-800 text-white shadow-sm' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" /> JSON Backup & Restore
            </button>
          </div>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
          
          {/* TAB 1: TEXT SUMMARIES */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              
              {/* Project Scope Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
                  Export Scope Source
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-[#121212] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-stone-500 font-sans"
                >
                  <option value="all">Complete Portfolio Summary ({projects.length} initiatives)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.category}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export Text Format Selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
                  Export Text Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormatMode('brief')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      exportFormatMode === 'brief'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                        : 'bg-[#121212] border-white/[0.06] text-stone-400 hover:text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Full Executive Brief</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormatMode('goals')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      exportFormatMode === 'goals'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                        : 'bg-[#121212] border-white/[0.06] text-stone-400 hover:text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>Project Goals Checklist</span>
                  </button>
                </div>
              </div>

              {/* Text Area Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                    Text-Based Raw Preview
                  </label>
                  <span className="text-[9px] text-stone-600 font-mono">Format: ASCII / Plain Text</span>
                </div>
                <div className="relative group">
                  <pre className="w-full h-48 bg-stone-950/80 border border-white/[0.04] rounded-lg p-3 text-[10px] text-stone-400 font-mono overflow-y-auto select-all no-scrollbar whitespace-pre-wrap leading-relaxed">
                    {summaryText}
                  </pre>
                  
                  {/* Copy overlay helper */}
                  <button
                    onClick={handleCopyToClipboard}
                    className="absolute right-2 top-2 bg-stone-900 hover:bg-stone-800 border border-white/[0.06] text-stone-400 hover:text-white p-1.5 rounded-md transition-all active:scale-95 flex items-center gap-1 text-[10px]"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={handleDownloadText}
                  className="w-full bg-white hover:bg-stone-200 active:scale-95 text-stone-950 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  {exportFormatMode === 'goals' ? 'Download Goals Checklist (.txt)' : 'Download Text Brief (.txt)'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: JSON BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              
              {/* Project Source Code Zip Download Section */}
              <div className="space-y-2 bg-[#111111] border border-amber-500/20 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      Complete Project Archive (.zip)
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold uppercase">
                        Source Code
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
                      Download the complete project source bundle (React, Vite, TypeScript, and Firebase configuration) directly to your Downloads folder.
                    </p>
                  </div>
                </div>
                
                <a
                  href="/ultra-ject5-project.zip"
                  download="ultra-ject5-project.zip"
                  className="w-full bg-amber-400 hover:bg-amber-300 active:scale-98 text-stone-950 font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" /> Download Project (.zip) to Downloads
                </a>
              </div>

              {/* Back Up Section */}
              <div className="space-y-2 bg-[#111111] border border-white/[0.04] p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-stone-400 shrink-0">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Export Full JSON Backup
                    </h3>
                    <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                      Download a structured JSON backup containing all project parameters, custom notes, milestones, and status tags to keep offline or restore on other sessions.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleDownloadBackup}
                  className="w-full bg-[#161616] hover:bg-[#202020] border border-white/[0.06] text-stone-200 py-2.5 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 focus:outline-none"
                >
                  <Download className="w-3.5 h-3.5 text-stone-400" /> Download Full JSON Backup
                </button>
              </div>

              {/* Restore Section */}
              <div className="space-y-3 bg-[#111111] border border-white/[0.04] p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-stone-400 shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Restore / Import Backup
                    </h3>
                    <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                      Select a valid `.json` portfolio file to restore or merge back.
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-white/[0.08] hover:border-white/[0.2] bg-black/20 hover:bg-black/40 py-5 rounded-lg text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-6 h-6 text-stone-600 mx-auto mb-2" />
                  <span className="text-xs text-stone-400 block font-semibold">
                    Choose Backup File
                  </span>
                  <span className="text-[9px] text-stone-600 font-mono mt-1 block">
                    Supported: .json backups
                  </span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                  />
                </div>

                {/* Import Status Messages */}
                {importError && (
                  <div className="p-3 bg-red-950/20 border border-red-900/20 rounded-lg flex items-start gap-2 select-none">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-400 font-mono leading-tight">{importError}</p>
                  </div>
                )}

                {importSuccessMsg && (
                  <div className="p-3 bg-emerald-950/10 border border-emerald-900/10 rounded-lg flex items-start gap-2 select-none">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-400 font-mono leading-tight">{importSuccessMsg}</p>
                  </div>
                )}

                {/* Preview import choices */}
                {parsedImportData && (
                  <div className="p-3.5 bg-[#090909] border border-white/[0.04] rounded-lg space-y-3">
                    <div className="space-y-1 select-none">
                      <p className="text-xs font-semibold text-white">
                        Backup Found: <span className="text-stone-400 font-mono font-bold">({parsedImportData.length} initiatives)</span>
                      </p>
                      <div className="max-h-24 overflow-y-auto pl-2 border-l border-stone-800 space-y-1">
                        {parsedImportData.slice(0, 3).map((p, idx) => (
                          <p key={idx} className="text-[10px] text-stone-500 font-mono truncate">
                            • [{p.category}] {p.name}
                          </p>
                        ))}
                        {parsedImportData.length > 3 && (
                          <p className="text-[9px] text-stone-600 font-mono pl-2">
                            ... and {parsedImportData.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        onClick={() => handleExecuteImport('merge')}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold py-2 rounded transition-all flex flex-col items-center justify-center"
                        title="Merge data based on unique IDs"
                      >
                        <span>Append & Merge</span>
                        <span className="text-[8px] text-stone-500 font-normal mt-0.5">Deduplicates IDs</span>
                      </button>
                      <button
                        onClick={() => handleExecuteImport('overwrite')}
                        className="bg-white hover:bg-stone-200 text-stone-950 text-[10px] font-bold py-2 rounded transition-all flex flex-col items-center justify-center"
                        title="DANGER: Will delete all existing local projects and replace with backup"
                      >
                        <span>Overwrite Local</span>
                        <span className="text-[8px] text-stone-500 font-normal mt-0.5 font-sans">Full Reset</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* Footer info helper */}
        <div className="p-3 bg-[#0a0a0a] border-t border-white/[0.04] text-center select-none">
          <p className="text-[9px] text-stone-600 font-mono flex items-center justify-center gap-1">
            <HelpCircle className="w-3 h-3" /> Offline storage synced locally on active browser sandbox
          </p>
        </div>

      </div>
    </div>
  );
}
