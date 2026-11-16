import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Edit2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type {
  DailyTask,
  DayRecord,
  DayVitals,
  FocusSession,
  Habit,
  TaskCategory,
  TaskPriority,
} from '../types/tracker';
import {
  addDays,
  calculateHabitStreaks,
  formatDurationMinutes,
  getRecentDateKeys,
  isHabitCompletedOnDay,
} from '../utils/date';

interface TodayViewProps {
  selectedDate: string;
  habits: Habit[];
  tasks: DailyTask[];
  days: Record<string, DayRecord>;
  dayRecord: DayRecord;
  focusSessions: FocusSession[];
  onAddTask: (
    dateKey: string,
    title: string,
    priority: TaskPriority,
    category: TaskCategory,
    estimateMinutes?: number
  ) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (
    taskId: string,
    patch: Partial<Pick<DailyTask, 'title' | 'priority' | 'category' | 'estimateMinutes'>>
  ) => void;
  onDeleteTask: (taskId: string) => void;
  onRolloverYesterday: (dateKey: string) => void;
  onToggleHabit: (dateKey: string, habit: Habit) => void;
  onSetHabitValue: (dateKey: string, habitId: string, value: number) => void;
  onUpdateVitals: (dateKey: string, patch: Partial<DayVitals>) => void;
  onUpdateNotes: (dateKey: string, patch: { winNote?: string; reflection?: string }) => void;
  onLogFocusSession: (dateKey: string, minutes: number, label: string) => void;
  onOpenNewHabit: () => void;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const CATEGORIES: TaskCategory[] = ['Work', 'Personal', 'Health', 'Learning'];

export function TodayView({
  selectedDate,
  habits,
  tasks,
  days,
  dayRecord,
  focusSessions,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onRolloverYesterday,
  onToggleHabit,
  onSetHabitValue,
  onUpdateVitals,
  onUpdateNotes,
  onLogFocusSession,
  onOpenNewHabit,
}: TodayViewProps) {
  // Task quick-add state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('Work');
  const [newTaskEstimate, setNewTaskEstimate] = useState('25');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'done'>('all');

  // Inline task editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Focus timer state
  const [presetMinutes, setPresetMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusLabel, setFocusLabel] = useState('Deep Work Block');

  // Countdown effect
  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          onLogFocusSession(selectedDate, presetMinutes, focusLabel);
          return presetMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, presetMinutes, focusLabel, selectedDate, onLogFocusSession]);

  const selectPreset = (mins: number) => {
    setTimerRunning(false);
    setPresetMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const dayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === selectedDate)
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          const rank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
          return rank[a.priority] - rank[b.priority];
        }),
    [tasks, selectedDate]
  );

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'pending') return dayTasks.filter((t) => !t.completed);
    if (taskFilter === 'done') return dayTasks.filter((t) => t.completed);
    return dayTasks;
  }, [dayTasks, taskFilter]);

  const yesterdayKey = useMemo(() => addDays(selectedDate, -1), [selectedDate]);
  const unfinishedYesterdayCount = useMemo(
    () => tasks.filter((t) => t.date === yesterdayKey && !t.completed).length,
    [tasks, yesterdayKey]
  );

  const dayFocusSessions = useMemo(
    () => focusSessions.filter((s) => s.date === selectedDate),
    [focusSessions, selectedDate]
  );

  const totalFocusMinutes = useMemo(
    () => dayFocusSessions.reduce((sum, s) => sum + s.minutes, 0),
    [dayFocusSessions]
  );

  const completedTasksCount = dayTasks.filter((t) => t.completed).length;
  const completedHabitsCount = activeHabits.filter((h) =>
    isHabitCompletedOnDay(h, dayRecord)
  ).length;

  const recent7Days = useMemo(() => getRecentDateKeys(selectedDate, 7), [selectedDate]);

  const longestActiveStreak = useMemo(() => {
    let maxStreak = 0;
    for (const h of activeHabits) {
      const { current } = calculateHabitStreaks(h, days, selectedDate);
      if (current > maxStreak) maxStreak = current;
    }
    return maxStreak;
  }, [activeHabits, days, selectedDate]);

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const est = Number(newTaskEstimate);
    onAddTask(
      selectedDate,
      newTaskTitle,
      newTaskPriority,
      newTaskCategory,
      Number.isFinite(est) && est > 0 ? est : undefined
    );
    setNewTaskTitle('');
  };

  const commitTaskEdit = (taskId: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      onUpdateTask(taskId, { title: trimmed });
    }
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="space-y-6">
      {/* Daily Summary KPI Strip — Single flat container with hairline dividers */}
      <section
        aria-label="Daily overview metrics"
        className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800"
      >
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tasks Completed
          </p>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {completedTasksCount}/{dayTasks.length}
            </span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {dayTasks.length > 0
                ? `${Math.round((completedTasksCount / dayTasks.length) * 100)}%`
                : 'No tasks'}
            </span>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Habits Checked
          </p>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {completedHabitsCount}/{activeHabits.length}
            </span>
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
              {longestActiveStreak > 0 ? `Top streak ${longestActiveStreak}d` : 'Start today'}
            </span>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Focus Logged
          </p>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {formatDurationMinutes(totalFocusMinutes)}
            </span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {dayFocusSessions.length} {dayFocusSessions.length === 1 ? 'session' : 'sessions'}
            </span>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Vitals Snapshot
          </p>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {dayRecord.vitals.water}/8
            </span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              glasses · {dayRecord.vitals.sleepHours}h sleep
            </span>
          </div>
        </div>
      </section>

      {/* Main Two-Column Daily Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Daily Priorities + Habit Check-ins */}
        <div className="space-y-6 lg:col-span-7">
          {/* Priorities / Tasks Section */}
          <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                  Daily Priorities
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {completedTasksCount} of {dayTasks.length} completed
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {(['all', 'pending', 'done'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTaskFilter(tab)}
                    className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                      taskFilter === tab
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Quick-Add Task Form */}
            <form
              onSubmit={handleTaskSubmit}
              className="border-b border-slate-200 bg-slate-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a priority task for this day..."
                  aria-label="New task title"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    aria-label="Task priority"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                    aria-label="Task category"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={newTaskEstimate}
                    onChange={(e) => setNewTaskEstimate(e.target.value)}
                    aria-label="Estimated minutes"
                    title="Estimated minutes"
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-2 font-mono text-xs text-slate-700 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Unfinished Rollover Prompt */}
            {unfinishedYesterdayCount > 0 && (
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-amber-50/60 px-5 py-2.5 text-xs dark:border-slate-800 dark:bg-amber-950/20">
                <span className="text-slate-700 dark:text-slate-300">
                  {unfinishedYesterdayCount} unfinished{' '}
                  {unfinishedYesterdayCount === 1 ? 'task' : 'tasks'} from yesterday
                </span>
                <button
                  type="button"
                  onClick={() => onRolloverYesterday(selectedDate)}
                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap shrink-0"
                >
                  <span>Move to this day</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {dayTasks.length === 0
                    ? 'No tasks logged for this day yet'
                    : 'No tasks match this filter'}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {dayTasks.length === 0
                    ? 'Use the quick-add bar above to set your top priorities.'
                    : 'Switch filter tabs to view other tasks.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredTasks.map((task) => {
                  const isEditing = editingTaskId === task.id;
                  return (
                    <li
                      key={task.id}
                      className="group flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                            task.completed
                              ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                              : 'border-slate-300 bg-white hover:border-blue-500 dark:border-slate-600 dark:bg-slate-900'
                          }`}
                        >
                          {task.completed && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => commitTaskEdit(task.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitTaskEdit(task.id);
                                if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                              autoFocus
                              className="w-full rounded border border-blue-500 bg-white px-2 py-0.5 text-sm text-slate-900 focus:outline-none dark:bg-slate-950 dark:text-slate-100"
                            />
                          ) : (
                            <p
                              className={`text-sm leading-snug ${
                                task.completed
                                  ? 'text-slate-400 line-through dark:text-slate-500'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {task.title}
                            </p>
                          )}

                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span>{task.category}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                task.priority === 'high' && !task.completed
                                  ? 'font-medium text-amber-700 dark:text-amber-400'
                                  : ''
                              }
                            >
                              {PRIORITY_LABELS[task.priority]} priority
                            </span>
                            {task.estimateMinutes && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono">{task.estimateMinutes}m</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setEditingTitle(task.title);
                          }}
                          aria-label={`Edit "${task.title}"`}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label={`Delete "${task.title}"`}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Daily Habits Check-ins Section */}
          <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                  Habit Check-ins
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {completedHabitsCount} of {activeHabits.length} targets met
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenNewHabit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Habit</span>
              </button>
            </div>

            {activeHabits.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No active habits configured
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Create your first daily habit to begin tracking streaks.
                </p>
                <button
                  type="button"
                  onClick={onOpenNewHabit}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create First Habit</span>
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeHabits.map((habit) => {
                  const val = dayRecord.habitProgress[habit.id] ?? 0;
                  const completed = val >= habit.target;
                  const { current } = calculateHabitStreaks(habit, days, selectedDate);
                  const step = habit.target >= 30 ? 10 : habit.target >= 15 ? 5 : 1;

                  return (
                    <li
                      key={habit.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {habit.type === 'binary' ? (
                          <button
                            type="button"
                            onClick={() => onToggleHabit(selectedDate, habit)}
                            aria-label={`Toggle ${habit.name}`}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                              completed
                                ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                                : 'border-slate-300 bg-white hover:border-blue-500 dark:border-slate-600 dark:bg-slate-900'
                            }`}
                          >
                            {completed && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onSetHabitValue(selectedDate, habit.id, val - step)}
                              aria-label={`Decrease ${habit.name}`}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetHabitValue(selectedDate, habit.id, val + step)}
                              aria-label={`Increase ${habit.name}`}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-medium ${
                              completed
                                ? 'text-slate-900 dark:text-slate-100'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {habit.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span>{habit.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">
                              {habit.type === 'binary'
                                ? completed
                                  ? 'Done'
                                  : 'Pending'
                                : `${val}/${habit.target} ${habit.unit}`}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-mono ${
                                current > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''
                              }`}
                            >
                              {current}d streak
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 7-day compact consistency cells */}
                      <div className="flex items-center gap-1" aria-label="Past 7 days">
                        {recent7Days.map((dKey) => {
                          const done = isHabitCompletedOnDay(habit, days[dKey]);
                          return (
                            <button
                              key={dKey}
                              type="button"
                              onClick={() => onToggleHabit(dKey, habit)}
                              title={`${dKey}: ${done ? 'Completed' : 'Missed'}`}
                              className={`h-3.5 w-3.5 rounded-[3px] transition-colors ${
                                done
                                  ? 'bg-emerald-500 dark:bg-emerald-500'
                                  : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700'
                              }`}
                              aria-label={`${habit.name} on ${dKey}: ${done ? 'completed' : 'not completed'}`}
                            />
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Right Column: Focus Timer + Daily Vitals + Reflection */}
        <div className="space-y-6 lg:col-span-5">
          {/* Focus Timer Widget */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                Focus Timer
              </h2>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {[15, 25, 50].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => selectPreset(mins)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                      presetMinutes === mins
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center border-y border-slate-200 py-5 dark:border-slate-800">
              <div className="font-mono text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {mm}:{ss}
              </div>

              <input
                type="text"
                value={focusLabel}
                onChange={(e) => setFocusLabel(e.target.value)}
                aria-label="Focus session label"
                placeholder="Session label..."
                className="mt-3 w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{timerRunning ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setSecondsLeft(presetMinutes * 60);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogFocusSession(selectedDate, presetMinutes, focusLabel);
                    setTimerRunning(false);
                    setSecondsLeft(presetMinutes * 60);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Log {presetMinutes}m
                </button>
              </div>
            </div>

            <div className="mt-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Logged on this day</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {formatDurationMinutes(totalFocusMinutes)}
                </span>
              </div>
              {dayFocusSessions.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {dayFocusSessions.slice(0, 3).map((session) => (
                    <li
                      key={session.id}
                      className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400"
                    >
                      <span className="truncate">{session.label}</span>
                      <span className="ml-2 shrink-0 font-mono text-slate-800 dark:text-slate-200">
                        {session.minutes}m
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Daily Vitals & Quick Metrics */}
          <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                Daily Vitals
              </h2>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {/* Water Intake */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Water Intake
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target 8 glasses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateVitals(selectedDate, {
                        water: Math.max(0, dayRecord.vitals.water - 1),
                      })
                    }
                    aria-label="Decrease water glasses"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-12 text-center font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {dayRecord.vitals.water}/8
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateVitals(selectedDate, {
                        water: Math.min(20, dayRecord.vitals.water + 1),
                      })
                    }
                    aria-label="Increase water glasses"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Sleep Duration */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Sleep Duration
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Previous night
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateVitals(selectedDate, {
                        sleepHours: Math.max(0, Number((dayRecord.vitals.sleepHours - 0.5).toFixed(1))),
                      })
                    }
                    aria-label="Decrease sleep hours"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-12 text-center font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {dayRecord.vitals.sleepHours}h
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateVitals(selectedDate, {
                        sleepHours: Math.min(16, Number((dayRecord.vitals.sleepHours + 0.5).toFixed(1))),
                      })
                    }
                    aria-label="Increase sleep hours"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Mood Selector */}
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Mood
                </span>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => onUpdateVitals(selectedDate, { mood: score })}
                      aria-label={`Set mood ${score} out of 5`}
                      className={`h-7 w-7 rounded-md font-mono text-xs font-medium transition-colors ${
                        dayRecord.vitals.mood === score
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Selector */}
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Energy
                </span>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => onUpdateVitals(selectedDate, { energy: score })}
                      aria-label={`Set energy ${score} out of 5`}
                      className={`h-7 w-7 rounded-md font-mono text-xs font-medium transition-colors ${
                        dayRecord.vitals.energy === score
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Daily Reflection */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                Daily Reflection
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Auto-saved
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label
                  htmlFor="daily-win-input"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Key Win Today
                </label>
                <input
                  id="daily-win-input"
                  type="text"
                  value={dayRecord.winNote}
                  onChange={(e) => onUpdateNotes(selectedDate, { winNote: e.target.value })}
                  placeholder="What went well today?"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="daily-reflection-textarea"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Notes & Observations
                </label>
                <textarea
                  id="daily-reflection-textarea"
                  rows={4}
                  value={dayRecord.reflection}
                  onChange={(e) => onUpdateNotes(selectedDate, { reflection: e.target.value })}
                  placeholder="Capture lessons, blockers, or thoughts for tomorrow..."
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
