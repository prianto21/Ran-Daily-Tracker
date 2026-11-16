import { useMemo, useState } from 'react';
import { Archive, Check, Edit2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { DayRecord, Habit, HabitCategory } from '../types/tracker';
import {
  calculateHabitStreaks,
  formatShortDay,
  getRecentDateKeys,
  isHabitCompletedOnDay,
} from '../utils/date';

interface HabitsViewProps {
  selectedDate: string;
  habits: Habit[];
  days: Record<string, DayRecord>;
  onToggleHabit: (dateKey: string, habit: Habit) => void;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onToggleArchiveHabit: (habitId: string, archived: boolean) => void;
  onDeleteHabit: (habitId: string) => void;
}

const CATEGORIES: ('All' | HabitCategory)[] = [
  'All',
  'Health',
  'Focus',
  'Mindfulness',
  'Routine',
];

export function HabitsView({
  selectedDate,
  habits,
  days,
  onToggleHabit,
  onOpenNewHabit,
  onEditHabit,
  onToggleArchiveHabit,
  onDeleteHabit,
}: HabitsViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<'All' | HabitCategory>('All');
  const [windowDays, setWindowDays] = useState<7 | 14>(14);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const dateKeys = useMemo(
    () => getRecentDateKeys(selectedDate, windowDays),
    [selectedDate, windowDays]
  );

  const visibleHabits = useMemo(() => {
    return habits.filter((h) => {
      if (showArchived ? !h.archived : h.archived) return false;
      if (categoryFilter !== 'All' && h.category !== categoryFilter) return false;
      return true;
    });
  }, [habits, showArchived, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {([7, 14] as const).map((daysCount) => (
              <button
                key={daysCount}
                type="button"
                onClick={() => setWindowDays(daysCount)}
                className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  windowDays === daysCount
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {daysCount}d
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowArchived((s) => !s)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          <button
            type="button"
            onClick={onOpenNewHabit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {visibleHabits.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {showArchived
                ? 'No archived habits'
                : 'No habits match this filter'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {showArchived
                ? 'Archived habits appear here when you retire them from your daily checklist.'
                : 'Create a new habit or switch the category filter to see your matrix.'}
            </p>
            {!showArchived && (
              <button
                type="button"
                onClick={onOpenNewHabit}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Habit</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
                  <th className="min-w-[220px] px-5 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Habit
                  </th>
                  {dateKeys.map((dKey) => {
                    const { weekday, dayNum } = formatShortDay(dKey);
                    const isSelected = dKey === selectedDate;
                    return (
                      <th
                        key={dKey}
                        className="px-1.5 py-2.5 text-center font-normal"
                      >
                        <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          {weekday.slice(0, 2)}
                        </div>
                        <div
                          className={`mt-0.5 font-mono text-xs ${
                            isSelected
                              ? 'font-semibold text-blue-600 dark:text-blue-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {dayNum}
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Streak
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {visibleHabits.map((habit) => {
                  const { current } = calculateHabitStreaks(habit, days, selectedDate);
                  let doneCount = 0;
                  for (const dKey of dateKeys) {
                    if (isHabitCompletedOnDay(habit, days[dKey])) doneCount++;
                  }
                  const rate = Math.round((doneCount / dateKeys.length) * 100);

                  return (
                    <tr
                      key={habit.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {habit.name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {habit.category}
                          {habit.type === 'numeric' && (
                            <>
                              {' '}
                              · Target{' '}
                              <span className="font-mono">
                                {habit.target} {habit.unit}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {dateKeys.map((dKey) => {
                        const val = days[dKey]?.habitProgress[habit.id] ?? 0;
                        const done = val >= habit.target;
                        const partial = !done && val > 0;
                        return (
                          <td key={dKey} className="px-1 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => onToggleHabit(dKey, habit)}
                              title={`${habit.name} on ${dKey}: ${val}/${habit.target}${
                                habit.unit ? ` ${habit.unit}` : ''
                              }`}
                              aria-label={`Toggle ${habit.name} on ${dKey}`}
                              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                                done
                                  ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                                  : partial
                                    ? 'border-amber-400 bg-amber-100 text-amber-800 dark:border-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'border-slate-200 bg-slate-50 text-transparent hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
                              }`}
                            >
                              {done ? (
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              ) : partial ? (
                                <span className="font-mono text-[10px] font-semibold">·</span>
                              ) : null}
                            </button>
                          </td>
                        );
                      })}

                      <td className="px-4 py-3 text-right font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                        {current}d
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {rate}%
                      </td>

                      <td className="px-4 py-3 text-right">
                        {confirmDeleteId === habit.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteHabit(habit.id);
                                setConfirmDeleteId(null);
                              }}
                              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditHabit(habit)}
                              aria-label={`Edit ${habit.name}`}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleArchiveHabit(habit.id, !habit.archived)}
                              aria-label={
                                habit.archived ? `Restore ${habit.name}` : `Archive ${habit.name}`
                              }
                              title={habit.archived ? 'Restore habit' : 'Archive habit'}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                              {habit.archived ? (
                                <RotateCcw className="h-3.5 w-3.5" />
                              ) : (
                                <Archive className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(habit.id)}
                              aria-label={`Delete ${habit.name}`}
                              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
