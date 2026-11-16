import { useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  Grid3X3,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import type { DayRecord, Habit, ViewMode } from '../types/tracker';
import {
  getMonthCalendarDays,
  getTodayKey,
  isHabitCompletedOnDay,
  parseDateKey,
} from '../utils/date';

interface SidebarProps {
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  habits: Habit[];
  days: Record<string, DayRecord>;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenDataModal: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: ViewMode; label: string; icon: typeof CalendarDays }[] = [
  { id: 'today', label: 'Daily Log', icon: CalendarDays },
  { id: 'habits', label: 'Habit Matrix', icon: Grid3X3 },
  { id: 'analytics', label: 'Trends', icon: BarChart3 },
  { id: 'journal', label: 'Journal', icon: BookOpen },
];

export function Sidebar({
  activeView,
  onSelectView,
  selectedDate,
  onSelectDate,
  habits,
  days,
  isDark,
  onToggleTheme,
  onOpenDataModal,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const todayKey = getTodayKey();
  const parsedSelected = parseDateKey(selectedDate);
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>({
    year: parsedSelected.getFullYear(),
    month: parsedSelected.getMonth(),
  });

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const calendarCells = useMemo(
    () => getMonthCalendarDays(calendarMonth.year, calendarMonth.month),
    [calendarMonth.year, calendarMonth.month]
  );

  const monthLabel = useMemo(() => {
    const d = new Date(calendarMonth.year, calendarMonth.month, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarMonth.year, calendarMonth.month]);

  const shiftMonth = (delta: number) => {
    setCalendarMonth((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const getDayCompletionRatio = (dateKey: string): number => {
    if (activeHabits.length === 0) return 0;
    const record = days[dateKey];
    if (!record) return 0;
    let done = 0;
    for (const h of activeHabits) {
      if (isHabitCompletedOnDay(h, record)) done++;
    }
    return done / activeHabits.length;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-5 dark:bg-slate-900">
      <div>
        {/* Brand Wordmark (single text element, clean typography) */}
        <div className="mb-6 flex items-center justify-between px-2">
          <span className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
            Ran Track App
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mini Month Calendar */}
        <div className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {monthLabel}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Next month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {calendarCells.map((cellDate, idx) => {
              if (!cellDate) {
                return <div key={`empty-${idx}`} className="h-7" />;
              }
              const dayNum = Number(cellDate.split('-')[2]);
              const isSelected = cellDate === selectedDate;
              const isToday = cellDate === todayKey;
              const ratio = getDayCompletionRatio(cellDate);

              return (
                <button
                  key={cellDate}
                  type="button"
                  onClick={() => {
                    onSelectDate(cellDate);
                    if (activeView !== 'today') onSelectView('today');
                    onCloseMobile();
                  }}
                  title={`${cellDate}${ratio > 0 ? ` (${Math.round(ratio * 100)}% habits)` : ''}`}
                  className={`relative flex h-7 w-full items-center justify-center rounded-md font-mono text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600 font-semibold text-white'
                      : isToday
                        ? 'border border-blue-500/60 font-semibold text-blue-600 dark:text-blue-400'
                        : ratio >= 0.8
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                          : ratio > 0
                            ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Utility Controls */}
      <div className="space-y-1 border-t border-slate-200 pt-4 dark:border-slate-800">
        <PWAInstallButton variant="sidebar" />
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <span className="flex items-center gap-2.5">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenDataModal}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <Database className="h-4 w-4" />
          <span>Backup & Reset</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 lg:block dark:border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] border-r border-slate-200 shadow-xl dark:border-slate-800">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
