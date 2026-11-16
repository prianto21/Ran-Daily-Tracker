import { useMemo, useState } from 'react';
import type { DailyTask, DayRecord, FocusSession, Habit } from '../types/tracker';
import {
  calculateHabitStreaks,
  formatDurationMinutes,
  formatReadableDate,
  getRecentDateKeys,
  isHabitCompletedOnDay,
} from '../utils/date';

interface AnalyticsViewProps {
  selectedDate: string;
  habits: Habit[];
  tasks: DailyTask[];
  days: Record<string, DayRecord>;
  focusSessions: FocusSession[];
  onSelectDateAndJump: (dateKey: string) => void;
}

export function AnalyticsView({
  selectedDate,
  habits,
  tasks,
  days,
  focusSessions,
  onSelectDateAndJump,
}: AnalyticsViewProps) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const dateKeys = useMemo(
    () => getRecentDateKeys(selectedDate, range),
    [selectedDate, range]
  );

  const heatmapKeys = useMemo(
    () => getRecentDateKeys(selectedDate, 84),
    [selectedDate]
  );

  const dailyStats = useMemo(() => {
    return dateKeys.map((dKey) => {
      const record = days[dKey];
      let habitsDone = 0;
      for (const h of activeHabits) {
        if (isHabitCompletedOnDay(h, record)) habitsDone++;
      }
      const habitPct =
        activeHabits.length > 0 ? Math.round((habitsDone / activeHabits.length) * 100) : 0;

      const dayTasks = tasks.filter((t) => t.date === dKey);
      const tasksDone = dayTasks.filter((t) => t.completed).length;
      const focusMins = focusSessions
        .filter((s) => s.date === dKey)
        .reduce((sum, s) => sum + s.minutes, 0);

      return {
        date: dKey,
        habitPct,
        habitsDone,
        habitsTotal: activeHabits.length,
        tasksDone,
        tasksTotal: dayTasks.length,
        focusMins,
        sleepHours: record?.vitals.sleepHours ?? null,
        mood: record?.vitals.mood ?? 0,
      };
    });
  }, [dateKeys, days, activeHabits, tasks, focusSessions]);

  const summary = useMemo(() => {
    const avgHabitPct =
      dailyStats.length > 0
        ? Math.round(dailyStats.reduce((s, d) => s + d.habitPct, 0) / dailyStats.length)
        : 0;
    const totalTasks = dailyStats.reduce((s, d) => s + d.tasksTotal, 0);
    const doneTasks = dailyStats.reduce((s, d) => s + d.tasksDone, 0);
    const totalFocusMins = dailyStats.reduce((s, d) => s + d.focusMins, 0);
    const sleepDays = dailyStats.filter((d) => d.sleepHours !== null && d.sleepHours > 0);
    const avgSleep =
      sleepDays.length > 0
        ? (sleepDays.reduce((s, d) => s + (d.sleepHours ?? 0), 0) / sleepDays.length).toFixed(1)
        : '—';

    return {
      avgHabitPct,
      totalTasks,
      doneTasks,
      totalFocusMins,
      avgSleep,
    };
  }, [dailyStats]);

  // SVG chart dimensions
  const chartW = 760;
  const chartH = 210;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const linePoints = useMemo(() => {
    if (dailyStats.length === 0) return '';
    return dailyStats
      .map((d, idx) => {
        const x =
          dailyStats.length === 1
            ? padL + plotW / 2
            : padL + (idx / (dailyStats.length - 1)) * plotW;
        const y = padT + plotH - (d.habitPct / 100) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [dailyStats, plotW, plotH]);

  const areaPoints = useMemo(() => {
    if (!linePoints || dailyStats.length === 0) return '';
    const firstX = dailyStats.length === 1 ? padL + plotW / 2 : padL;
    const lastX = dailyStats.length === 1 ? padL + plotW / 2 : padL + plotW;
    const baseY = padT + plotH;
    return `${firstX.toFixed(1)},${baseY} ${linePoints} ${lastX.toFixed(1)},${baseY}`;
  }, [linePoints, dailyStats.length, plotW, plotH]);

  const hoveredStat = useMemo(
    () => dailyStats.find((d) => d.date === hoveredDay) ?? dailyStats[dailyStats.length - 1],
    [dailyStats, hoveredDay]
  );

  return (
    <div className="space-y-6">
      {/* Range Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
            Consistency & Performance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rolling window ending {formatReadableDate(selectedDate)}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                range === r
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {r} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Strip */}
      <section className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Avg Habit Completion
          </p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {summary.avgHabitPct}%
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tasks Finished
          </p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {summary.doneTasks}/{summary.totalTasks}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Focus Time
          </p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {formatDurationMinutes(summary.totalFocusMins)}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Average Sleep
          </p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {summary.avgSleep}h
          </p>
        </div>
      </section>

      {/* Habit Completion Trend Chart */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Daily Habit Completion Rate
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hover any day on the curve to inspect exact counts
            </p>
          </div>
          {hoveredStat && (
            <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
              {hoveredStat.date} · {hoveredStat.habitPct}% ({hoveredStat.habitsDone}/
              {hoveredStat.habitsTotal} habits)
            </div>
          )}
        </div>

        <div className="mt-4 w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="h-56 w-full min-w-[520px]"
            role="img"
            aria-label="Habit completion percentage chart"
          >
            <defs>
              <linearGradient id="habitAreaFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = padT + plotH - (pct / 100) * plotH;
              return (
                <g key={pct}>
                  <line
                    x1={padL}
                    x2={chartW - padR}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray={pct === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 font-mono text-[10px] dark:fill-slate-500"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Area & Line */}
            {areaPoints && <polygon points={areaPoints} fill="url(#habitAreaFill)" />}
            {linePoints && (
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.25"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={linePoints}
              />
            )}

            {/* Interactive hover points */}
            {dailyStats.map((d, idx) => {
              const x =
                dailyStats.length === 1
                  ? padL + plotW / 2
                  : padL + (idx / (dailyStats.length - 1)) * plotW;
              const y = padT + plotH - (d.habitPct / 100) * plotH;
              const isHovered = hoveredStat?.date === d.date;
              const showXAxisLabel =
                idx === 0 ||
                idx === dailyStats.length - 1 ||
                (range === 30 && idx % 6 === 0) ||
                (range === 90 && idx % 15 === 0) ||
                range === 7;

              return (
                <g key={d.date}>
                  {showXAxisLabel && (
                    <text
                      x={x}
                      y={chartH - 6}
                      textAnchor="middle"
                      className="fill-slate-400 font-mono text-[10px] dark:fill-slate-500"
                    >
                      {d.date.slice(5)}
                    </text>
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : range <= 30 ? 3 : 2}
                    className={
                      isHovered
                        ? 'fill-blue-600 stroke-white stroke-2 dark:stroke-slate-900'
                        : 'fill-blue-600/80'
                    }
                  />
                  <rect
                    x={x - plotW / Math.max(dailyStats.length * 2, 2)}
                    y={padT}
                    width={plotW / Math.max(dailyStats.length, 1)}
                    height={plotH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDay(d.date)}
                    onClick={() => onSelectDateAndJump(d.date)}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* 12-Week Activity Heatmap + Per-Habit Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Heatmap */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              12-Week Consistency Grid
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Click cell to open day
            </span>
          </div>

          <div className="mt-4 grid grid-cols-12 gap-1.5">
            {heatmapKeys.map((dKey) => {
              const rec = days[dKey];
              let done = 0;
              for (const h of activeHabits) {
                if (isHabitCompletedOnDay(h, rec)) done++;
              }
              const ratio = activeHabits.length > 0 ? done / activeHabits.length : 0;

              let tone = 'bg-slate-100 dark:bg-slate-800';
              if (ratio >= 0.85) tone = 'bg-emerald-600 dark:bg-emerald-500';
              else if (ratio >= 0.55) tone = 'bg-emerald-400 dark:bg-emerald-600';
              else if (ratio > 0) tone = 'bg-emerald-200 dark:bg-emerald-900';

              return (
                <button
                  key={dKey}
                  type="button"
                  onClick={() => onSelectDateAndJump(dKey)}
                  title={`${dKey}: ${done}/${activeHabits.length} habits (${Math.round(
                    ratio * 100
                  )}%)`}
                  aria-label={`Open ${dKey}, ${done} of ${activeHabits.length} habits completed`}
                  className={`aspect-square w-full rounded-[4px] transition-transform hover:scale-110 ${tone}`}
                />
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Less</span>
            <span className="h-3 w-3 rounded-[3px] bg-slate-100 dark:bg-slate-800" />
            <span className="h-3 w-3 rounded-[3px] bg-emerald-200 dark:bg-emerald-900" />
            <span className="h-3 w-3 rounded-[3px] bg-emerald-400 dark:bg-emerald-600" />
            <span className="h-3 w-3 rounded-[3px] bg-emerald-600 dark:bg-emerald-500" />
            <span>More</span>
          </div>
        </section>

        {/* Per-Habit Performance Table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Habit Consistency Breakdown ({range} Days)
            </h3>
          </div>

          {activeHabits.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No active habits to analyze yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                    <th className="px-5 py-2.5">Habit</th>
                    <th className="px-4 py-2.5 text-right">Current</th>
                    <th className="px-4 py-2.5 text-right">Best</th>
                    <th className="px-5 py-2.5 text-right">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {activeHabits.map((habit) => {
                    const { current, best } = calculateHabitStreaks(habit, days, selectedDate);
                    let done = 0;
                    for (const dKey of dateKeys) {
                      if (isHabitCompletedOnDay(habit, days[dKey])) done++;
                    }
                    const pct = Math.round((done / dateKeys.length) * 100);
                    return (
                      <tr
                        key={habit.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-3">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {habit.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {habit.category}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {current}d
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                          {best}d
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
