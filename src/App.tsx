/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Menu, Plus } from 'lucide-react';
import { AnalyticsView } from './components/AnalyticsView';
import { DataModal } from './components/DataModal';
import { HabitModal } from './components/HabitModal';
import { HabitsView } from './components/HabitsView';
import { JournalView } from './components/JournalView';
import { Sidebar } from './components/Sidebar';
import { TodayView } from './components/TodayView';
import { useTrackerStore } from './hooks/useTrackerStore';
import type { Habit, ViewMode } from './types/tracker';
import { addDays, formatReadableDate, getTodayKey } from './utils/date';

const VIEW_LABELS: Record<ViewMode, string> = {
  today: 'Daily Log',
  habits: 'Habit Matrix',
  analytics: 'Trends',
  journal: 'Journal',
};

export default function App() {
  const {
    state,
    getDayRecord,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    rolloverYesterdayTasks,
    setHabitValue,
    toggleHabitOnDay,
    addHabit,
    updateHabit,
    deleteHabit,
    updateVitals,
    updateNotes,
    logFocusSession,
    resetToSampleData,
    clearAllData,
    importState,
  } = useTrackerStore();

  const [activeView, setActiveView] = useState<ViewMode>('today');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [dataModalOpen, setDataModalOpen] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cadence_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('cadence_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage failures
    }
  }, [isDark]);

  const todayKey = getTodayKey();
  const dayRecord = getDayRecord(selectedDate);

  const openCreateHabit = () => {
    setEditingHabit(null);
    setHabitModalOpen(true);
  };

  const openEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitModalOpen(true);
  };

  const handleJumpToDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setActiveView('today');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        habits={state.habits}
        days={state.days}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onOpenDataModal={() => setDataModalOpen(true)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur-xs sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-slate-400 sm:inline dark:text-slate-500">
                Workspace
              </span>
              <span className="hidden text-slate-300 sm:inline dark:text-slate-700">
                /
              </span>
              <h1 className="font-display truncate text-base font-semibold text-slate-900 dark:text-slate-50">
                {VIEW_LABELS[activeView]}
              </h1>
              {activeView === 'today' && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                    {formatReadableDate(selectedDate)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Date Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setSelectedDate((d) => addDays(d, -1))}
                aria-label="Previous day"
                className="rounded-l-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(todayKey)}
                disabled={selectedDate === todayKey}
                className={`border-x border-slate-200 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors dark:border-slate-700 ${
                  selectedDate === todayKey
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate((d) => addDays(d, 1))}
                aria-label="Next day"
                className="rounded-r-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={openCreateHabit}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Habit</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {activeView === 'today' && (
            <TodayView
              selectedDate={selectedDate}
              habits={state.habits}
              tasks={state.tasks}
              days={state.days}
              dayRecord={dayRecord}
              focusSessions={state.focusSessions}
              onAddTask={addTask}
              onToggleTask={toggleTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onRolloverYesterday={rolloverYesterdayTasks}
              onToggleHabit={toggleHabitOnDay}
              onSetHabitValue={setHabitValue}
              onUpdateVitals={updateVitals}
              onUpdateNotes={updateNotes}
              onLogFocusSession={logFocusSession}
              onOpenNewHabit={openCreateHabit}
            />
          )}

          {activeView === 'habits' && (
            <HabitsView
              selectedDate={selectedDate}
              habits={state.habits}
              days={state.days}
              onToggleHabit={toggleHabitOnDay}
              onOpenNewHabit={openCreateHabit}
              onEditHabit={openEditHabit}
              onToggleArchiveHabit={(id, archived) => updateHabit(id, { archived })}
              onDeleteHabit={deleteHabit}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsView
              selectedDate={selectedDate}
              habits={state.habits}
              tasks={state.tasks}
              days={state.days}
              focusSessions={state.focusSessions}
              onSelectDateAndJump={handleJumpToDate}
            />
          )}

          {activeView === 'journal' && (
            <JournalView
              habits={state.habits}
              tasks={state.tasks}
              days={state.days}
              onSelectDateAndJump={handleJumpToDate}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <HabitModal
        open={habitModalOpen}
        editingHabit={editingHabit}
        onClose={() => {
          setHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={(payload) => {
          if (editingHabit) {
            updateHabit(editingHabit.id, {
              name: payload.name,
              category: payload.category,
              type: payload.type,
              target: payload.target,
              unit: payload.unit,
            });
          } else {
            addHabit(payload);
          }
        }}
      />

      <DataModal
        open={dataModalOpen}
        state={state}
        onClose={() => setDataModalOpen(false)}
        onImport={importState}
        onResetSample={resetToSampleData}
        onClearAll={clearAllData}
      />
    </div>
  );
}
