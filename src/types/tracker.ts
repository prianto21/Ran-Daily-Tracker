export type ViewMode = 'today' | 'habits' | 'analytics' | 'journal';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskCategory = 'Work' | 'Personal' | 'Health' | 'Learning';

export interface DailyTask {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  completed: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  estimateMinutes?: number;
  createdAt: number;
}

export type HabitType = 'binary' | 'numeric';

export type HabitCategory = 'Health' | 'Focus' | 'Mindfulness' | 'Routine';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  type: HabitType;
  target: number; // 1 for binary, >1 for numeric (e.g. 8 glasses, 30 min)
  unit: string; // '' for binary, 'glasses', 'min', 'pages', etc.
  archived: boolean;
  createdAt: string; // YYYY-MM-DD
}

export interface DayVitals {
  water: number; // glasses
  sleepHours: number; // hours
  mood: number; // 1-5 (0 = unset)
  energy: number; // 1-5 (0 = unset)
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  label: string;
  completedAt: number;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  habitProgress: Record<string, number>; // habitId -> count (0 or 1 for binary, 0..N for numeric)
  vitals: DayVitals;
  winNote: string;
  reflection: string;
  updatedAt?: number;
}

export interface TrackerState {
  habits: Habit[];
  tasks: DailyTask[];
  days: Record<string, DayRecord>;
  focusSessions: FocusSession[];
}
