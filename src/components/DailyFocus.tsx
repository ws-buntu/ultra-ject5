import React, { useState, useEffect } from 'react';
import { 
  Target, Check, Trash2, Edit3, Flame, Sparkles, 
  Clock, History, ChevronDown, ChevronUp, CheckCircle2, 
  RotateCcw, Trophy, ArrowRight, Zap, Calendar
} from 'lucide-react';

export interface DailyFocusItem {
  id: string;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  completedAt?: string; // ISO string or time format
  tag?: string;
  notes?: string;
}

export interface FocusHistoryRecord {
  date: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}

const STORAGE_KEY_CURRENT = 'ultra_jects5_daily_focus';
const STORAGE_KEY_HISTORY = 'ultra_jects5_focus_history';
const STORAGE_KEY_STREAK = 'ultra_jects5_focus_streak';

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format date for display
const formatDisplayDate = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  } catch {
    // Fallback
  }
  return dateStr;
};

// Format completion timestamp
const formatCompletionTime = (isoOrTime?: string): string => {
  if (!isoOrTime) return '';
  try {
    const date = new Date(isoOrTime);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return isoOrTime;
  } catch {
    return isoOrTime;
  }
};

const SUGGESTED_FOCUS_PRESETS = [
  '⚡ Unblock critical project milestone',
  '🎯 Complete priority sprint deliverable',
  '📋 Finalize client review & sign-off',
  '🔍 Audit architecture & security specs',
  '🚀 Deploy scheduled release update'
];

export const DailyFocus: React.FC = () => {
  const todayStr = getLocalDateString();

  // Current active focus goal state with persistent localStorage loader
  const [focusData, setFocusData] = useState<DailyFocusItem>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT) || localStorage.getItem('daily_focus_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If saved item is from today, load it directly
        if (parsed && parsed.date === todayStr) {
          return {
            id: parsed.id || `focus-${todayStr}`,
            text: parsed.text || '',
            completed: Boolean(parsed.completed),
            date: todayStr,
            completedAt: parsed.completedAt,
            tag: parsed.tag || 'High Priority'
          };
        } else if (parsed && parsed.text) {
          // If from yesterday/previous day, archive it into history if not already archived
          try {
            const histRaw = localStorage.getItem(STORAGE_KEY_HISTORY);
            const historyList: FocusHistoryRecord[] = histRaw ? JSON.parse(histRaw) : [];
            const exists = historyList.some(h => h.date === parsed.date);
            if (!exists) {
              historyList.unshift({
                date: parsed.date,
                text: parsed.text,
                completed: parsed.completed,
                completedAt: parsed.completedAt
              });
              localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(historyList.slice(0, 30)));
            }
          } catch (e) {
            console.error('Failed to auto-archive previous focus goal', e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load daily focus from localStorage', e);
    }
    return {
      id: `focus-${todayStr}`,
      text: '',
      completed: false,
      date: todayStr,
      tag: 'High Priority'
    };
  });

  // Focus history list state
  const [history, setHistory] = useState<FocusHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load focus history', e);
    }
    return [];
  });

  // UI state
  const [inputVal, setInputVal] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Sync active daily focus to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(focusData));
      // Also write to legacy key for backwards compatibility
      localStorage.setItem('daily_focus_data', JSON.stringify({
        text: focusData.text,
        completed: focusData.completed,
        date: focusData.date
      }));
    } catch (e) {
      console.error('Failed to save daily focus to localStorage', e);
    }
  }, [focusData]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save focus history', e);
    }
  }, [history]);

  // Calculate current streak (days with completed focus)
  const streakCount = React.useMemo(() => {
    let count = 0;
    // Check if today is completed
    if (focusData.completed && focusData.text) {
      count++;
    }

    // Check consecutive past days in history
    const completedDates = new Set(
      history.filter(h => h.completed && h.text.trim()).map(h => h.date)
    );

    let checkDate = new Date();
    // If today is not completed, we check starting from yesterday
    if (!focusData.completed) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 30; i++) {
      const dateKey = getLocalDateString(checkDate);
      if (completedDates.has(dateKey)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
  }, [focusData.completed, focusData.text, history]);

  // Periodic day change listener
  useEffect(() => {
    const timer = setInterval(() => {
      const currentToday = getLocalDateString();
      if (focusData.date !== currentToday) {
        // Day rolled over
        if (focusData.text.trim()) {
          // Archive old day to history
          setHistory(prev => [
            {
              date: focusData.date,
              text: focusData.text,
              completed: focusData.completed,
              completedAt: focusData.completedAt
            },
            ...prev.filter(h => h.date !== focusData.date)
          ]);
        }
        setFocusData({
          id: `focus-${currentToday}`,
          text: '',
          completed: false,
          date: currentToday,
          tag: 'High Priority'
        });
        setInputVal('');
        setIsEditing(false);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [focusData]);

  // Set or update daily focus
  const handleSetFocus = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    setFocusData(prev => ({
      ...prev,
      text: trimmed,
      completed: false,
      date: todayStr,
      completedAt: undefined
    }));
    setInputVal('');
    setIsEditing(false);
  };

  // Toggle completion status
  const handleToggleComplete = () => {
    if (!focusData.text) return;

    const nextCompleted = !focusData.completed;
    const nowIso = new Date().toISOString();

    setFocusData(prev => ({
      ...prev,
      completed: nextCompleted,
      completedAt: nextCompleted ? nowIso : undefined
    }));

    if (nextCompleted) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  // Clear focus
  const handleClearFocus = () => {
    if (window.confirm("Clear today's daily focus goal?")) {
      setFocusData({
        id: `focus-${todayStr}`,
        text: '',
        completed: false,
        date: todayStr
      });
      setInputVal('');
      setIsEditing(false);
    }
  };

  // Start edit
  const handleStartEdit = () => {
    setInputVal(focusData.text);
    setIsEditing(true);
  };

  // Select a preset suggestion
  const handleSelectPreset = (preset: string) => {
    const cleanText = preset.replace(/^[^\w\s]+/, '').trim();
    setFocusData({
      id: `focus-${todayStr}`,
      text: cleanText,
      completed: false,
      date: todayStr,
      tag: 'High Priority'
    });
    setIsEditing(false);
    setInputVal('');
  };

  const totalCompletedAllTime = history.filter(h => h.completed).length + (focusData.completed ? 1 : 0);

  return (
    <div 
      id="daily-focus-container" 
      className="mx-5 my-2.5 bg-gradient-to-br from-[#141414] to-[#0d0d0d] rounded-xl p-3.5 border border-amber-500/25 shadow-xl relative overflow-hidden group/df transition-all"
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      {focusData.completed && (
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
      )}

      {/* Header Bar: Title, Streak Badge & Date */}
      <div className="flex items-center justify-between gap-2 mb-2.5 select-none">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
            <Target className="w-3.5 h-3.5" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-400 font-mono">
                Daily Focus
              </span>
              <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
                North Star
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Badges: Streak & History Drawer Toggle */}
        <div className="flex items-center gap-2">
          {streakCount > 0 && (
            <div 
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold shadow-sm"
              title={`${streakCount} consecutive day streak with completed daily focus`}
            >
              <Flame className="w-3 h-3 text-orange-400 fill-orange-400 animate-pulse" />
              <span>{streakCount}d Streak</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowHistory(prev => !prev)}
            className="p-1 text-stone-400 hover:text-amber-400 transition-colors flex items-center gap-0.5 text-[10px] font-mono font-medium rounded hover:bg-white/[0.04] cursor-pointer"
            title="Toggle focus history log"
          >
            <History className="w-3 h-3 text-stone-400" />
            <span className="hidden sm:inline text-[9px] uppercase tracking-wider text-stone-500">History</span>
            {showHistory ? (
              <ChevronUp className="w-3 h-3 text-stone-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-stone-400" />
            )}
          </button>
        </div>
      </div>

      {/* Celebration Banner when completed */}
      {showCelebration && (
        <div className="mb-2 bg-gradient-to-r from-emerald-950/80 to-stone-900 border border-emerald-500/40 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs text-emerald-300 animate-bounce shadow-md">
          <div className="flex items-center gap-1.5 font-bold font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Focus Accomplished! 🎉</span>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
            +1 Streak
          </span>
        </div>
      )}

      {/* Active Daily Focus Content */}
      {focusData.text && !isEditing ? (
        <div 
          className={`group/task relative p-2.5 rounded-xl border transition-all duration-300 ${
            focusData.completed
              ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
              : 'bg-black/50 border-white/[0.08] hover:border-amber-500/40 shadow-md'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Interactive Toggle Checkbox and Task Text */}
            <button
              type="button"
              id="toggle-daily-focus-btn"
              onClick={handleToggleComplete}
              className="flex items-start gap-2.5 flex-1 min-w-0 text-left focus:outline-none cursor-pointer select-none"
            >
              <span
                className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                  focusData.completed
                    ? 'bg-emerald-500 border-emerald-400 text-stone-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-stone-900/80 border-stone-600 hover:border-amber-400 text-transparent'
                }`}
              >
                {focusData.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </span>

              <div className="flex-1 min-w-0 space-y-1">
                <span
                  className={`text-xs font-sans font-medium leading-relaxed block break-words transition-all ${
                    focusData.completed
                      ? 'line-through text-stone-400 decoration-stone-500 font-normal'
                      : 'text-stone-100 font-semibold'
                  }`}
                >
                  {focusData.text}
                </span>

                {/* Sub-meta footer */}
                <div className="flex items-center gap-2 text-[9px] font-mono">
                  {focusData.completed ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Completed {formatCompletionTime(focusData.completedAt)}
                    </span>
                  ) : (
                    <span className="text-amber-400/90 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      Today's #1 Goal
                    </span>
                  )}
                  <span className="text-stone-500">•</span>
                  <span className="text-stone-400">
                    {formatDisplayDate(focusData.date)}
                  </span>
                </div>
              </div>
            </button>

            {/* Quick Actions (Edit / Clear) */}
            <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover/task:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleStartEdit}
                className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer"
                title="Edit today's focus goal"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClearFocus}
                className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer"
                title="Clear today's focus goal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Input Form */
        <div className="space-y-2.5">
          <form onSubmit={handleSetFocus} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                id="daily-focus-input"
                placeholder="What is your single top priority for today?"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full bg-black/60 border border-white/10 focus:border-amber-500/60 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none font-sans transition-all shadow-inner"
                autoFocus={isEditing}
              />
            </div>
            <button
              type="submit"
              id="save-daily-focus-btn"
              disabled={!inputVal.trim()}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 disabled:opacity-40 disabled:hover:from-amber-500 disabled:hover:to-amber-400 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/15 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save' : 'Set Focus'}</span>
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-2 bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 rounded-xl text-xs font-mono font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            )}
          </form>

          {/* Quick Presets Carousel when empty */}
          {!isEditing && (
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Quick Starters:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {SUGGESTED_FOCUS_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="px-2 py-1 rounded-lg bg-[#181818] hover:bg-stone-800 border border-white/[0.06] hover:border-amber-500/30 text-[10.5px] text-stone-300 hover:text-amber-300 transition-colors whitespace-nowrap cursor-pointer shrink-0 font-sans"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expandable History Drawer */}
      {showHistory && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-stone-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-amber-400" /> Past Daily Focus Goals
            </span>
            <span className="text-stone-500">
              Total Done: <strong className="text-amber-400">{totalCompletedAllTime}</strong>
            </span>
          </div>

          {history.length === 0 ? (
            <p className="text-[11px] text-stone-500 italic py-2 text-center font-sans">
              No previous daily focus goals recorded yet. Complete today's focus to begin your streak!
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {history.map((record, index) => (
                <div
                  key={`${record.date}-${index}`}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/40 border border-white/[0.04] text-xs font-sans"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 text-[10px] ${
                        record.completed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-stone-800 text-stone-500 border border-stone-700'
                      }`}
                    >
                      {record.completed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '–'}
                    </span>
                    <span
                      className={`truncate text-xs ${
                        record.completed
                          ? 'text-stone-300 line-through decoration-stone-500'
                          : 'text-stone-400'
                      }`}
                    >
                      {record.text}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-stone-500 shrink-0">
                    {formatDisplayDate(record.date)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setHistory([]);
                  try {
                    localStorage.removeItem(STORAGE_KEY_HISTORY);
                  } catch (e) {}
                }}
                className="text-[9px] font-mono text-stone-500 hover:text-rose-400 transition-colors uppercase tracking-wider cursor-pointer"
                title="Clear all saved history records"
              >
                Clear History
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyFocus;
