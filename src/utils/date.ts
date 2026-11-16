import type { DayRecord, Habit } from '../types/tracker';

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(dateKey: string, delta: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + delta);
  return toDateKey(d);
}

export function getTodayKey(): string {
  return toDateKey(new Date());
}

export function formatReadableDate(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDay(dateKey: string): { weekday: string; dayNum: string } {
  const d = parseDateKey(dateKey);
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: String(d.getDate()),
  };
}

export function getRecentDateKeys(anchorDateKey: string, count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(addDays(anchorDateKey, -i));
  }
  return keys;
}

export function getMonthCalendarDays(year: number, monthIndex: number): (string | null)[] {
  const firstDay = new Date(year, monthIndex, 1, 12, 0, 0);
  const startWeekday = firstDay.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateKey(new Date(year, monthIndex, day, 12, 0, 0)));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function isHabitCompletedOnDay(
  habit: Habit,
  dayRecord: DayRecord | undefined
): boolean {
  if (!dayRecord) return false;
  const val = dayRecord.habitProgress[habit.id] ?? 0;
  return val >= habit.target;
}

export function calculateHabitStreaks(
  habit: Habit,
  days: Record<string, DayRecord>,
  referenceDateKey: string
): { current: number; best: number } {
  let current = 0;
  let cursor = referenceDateKey;

  // If reference day isn't completed yet, allow streak to continue from yesterday
  if (!isHabitCompletedOnDay(habit, days[cursor])) {
    cursor = addDays(cursor, -1);
  }

  for (let i = 0; i < 365; i++) {
    if (isHabitCompletedOnDay(habit, days[cursor])) {
      current++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }

  // Compute best streak across all recorded days sorted ascending
  const sortedDates = Object.keys(days).sort();
  let best = current;
  let run = 0;
  let prevDate: string | null = null;

  for (const dateKey of sortedDates) {
    if (isHabitCompletedOnDay(habit, days[dateKey])) {
      if (prevDate && addDays(prevDate, 1) === dateKey) {
        run++;
      } else {
        run = 1;
      }
      if (run > best) best = run;
      prevDate = dateKey;
    } else {
      run = 0;
      prevDate = null;
    }
  }

  return { current, best };
}

export function formatDurationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
