import { useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import type { DailyTask, DayRecord, Habit } from '../types/tracker';
import { formatReadableDate, isHabitCompletedOnDay } from '../utils/date';

interface JournalViewProps {
  habits: Habit[];
  tasks: DailyTask[];
  days: Record<string, DayRecord>;
  onSelectDateAndJump: (dateKey: string) => void;
}

export function JournalView({
  habits,
  tasks,
  days,
  onSelectDateAndJump,
}: JournalViewProps) {
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<'all' | 'high' | 'low'>('all');

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(days)
      .filter((record) => {
        const hasText = Boolean(record.winNote.trim() || record.reflection.trim());
        if (!hasText) return false;

        if (moodFilter === 'high' && record.vitals.mood < 4) return false;
        if (moodFilter === 'low' && (record.vitals.mood === 0 || record.vitals.mood > 2)) {
          return false;
        }

        if (q) {
          const matchWin = record.winNote.toLowerCase().includes(q);
          const matchRef = record.reflection.toLowerCase().includes(q);
          const matchDate = record.date.includes(q);
          if (!matchWin && !matchRef && !matchDate) return false;
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [days, query, moodFilter]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search daily wins, notes, or dates..."
            aria-label="Search journal entries"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {(
            [
              { id: 'all', label: 'All Entries' },
              { id: 'high', label: 'High Mood (4–5)' },
              { id: 'low', label: 'Low Mood (1–2)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMoodFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                moodFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Journal Feed */}
      {entries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No matching reflection entries
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Write a key win or daily observation on the Daily Log view to build your archive.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {entries.map((entry) => {
            const doneHabits = activeHabits.filter((h) =>
              isHabitCompletedOnDay(h, entry)
            ).length;
            const dayTasks = tasks.filter((t) => t.date === entry.date);
            const doneTasks = dayTasks.filter((t) => t.completed).length;

            return (
              <article key={entry.date} className="p-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                      {formatReadableDate(entry.date)}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {doneHabits}/{activeHabits.length} habits
                      </span>
                      {dayTasks.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {doneTasks}/{dayTasks.length} tasks
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{entry.vitals.sleepHours}h sleep</span>
                      {entry.vitals.mood > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Mood {entry.vitals.mood}/5</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectDateAndJump(entry.date)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    <span>Open Day</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {entry.winNote && (
                  <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    Win: {entry.winNote}
                  </p>
                )}
                {entry.reflection && (
                  <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {entry.reflection}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
