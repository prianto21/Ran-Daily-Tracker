import { useCallback, useEffect, useState } from 'react';
import { createEmptyDayRecord, createSeedData } from '../data/seedData';
import type {
  DailyTask,
  DayRecord,
  DayVitals,
  FocusSession,
  Habit,
  HabitCategory,
  HabitType,
  TaskCategory,
  TaskPriority,
  TrackerState,
} from '../types/tracker';
import { addDays } from '../utils/date';

const STORAGE_KEY = 'cadence_daily_tracker_v1';

function loadInitialState(): TrackerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TrackerState;
      if (
        parsed &&
        Array.isArray(parsed.habits) &&
        Array.isArray(parsed.tasks) &&
        typeof parsed.days === 'object'
      ) {
        return {
          habits: parsed.habits,
          tasks: parsed.tasks,
          days: parsed.days,
          focusSessions: Array.isArray(parsed.focusSessions) ? parsed.focusSessions : [],
        };
      }
    }
  } catch {
    // Fallback to seed data on corrupted storage
  }
  return createSeedData();
}

export function useTrackerStore() {
  const [state, setState] = useState<TrackerState>(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  const getDayRecord = useCallback(
    (dateKey: string): DayRecord => {
      return state.days[dateKey] ?? createEmptyDayRecord(dateKey);
    },
    [state.days]
  );

  const addTask = useCallback(
    (
      dateKey: string,
      title: string,
      priority: TaskPriority = 'medium',
      category: TaskCategory = 'Work',
      estimateMinutes?: number
    ) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const newTask: DailyTask = {
        id: `tsk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: dateKey,
        title: trimmed,
        completed: false,
        priority,
        category,
        estimateMinutes,
        createdAt: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));
    },
    []
  );

  const toggleTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  }, []);

  const updateTask = useCallback(
    (taskId: string, patch: Partial<Pick<DailyTask, 'title' | 'priority' | 'category' | 'estimateMinutes'>>) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
      }));
    },
    []
  );

  const deleteTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  }, []);

  const rolloverYesterdayTasks = useCallback((targetDateKey: string) => {
    const yesterdayKey = addDays(targetDateKey, -1);
    setState((prev) => {
      const unfinishedYesterday = prev.tasks.filter(
        (t) => t.date === yesterdayKey && !t.completed
      );
      if (unfinishedYesterday.length === 0) return prev;
      const rolledIds = new Set(unfinishedYesterday.map((t) => t.id));
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          rolledIds.has(t.id) ? { ...t, date: targetDateKey } : t
        ),
      };
    });
  }, []);

  const setHabitValue = useCallback(
    (dateKey: string, habitId: string, value: number) => {
      const clamped = Math.max(0, value);
      setState((prev) => {
        const existingDay = prev.days[dateKey] ?? createEmptyDayRecord(dateKey);
        return {
          ...prev,
          days: {
            ...prev.days,
            [dateKey]: {
              ...existingDay,
              habitProgress: {
                ...existingDay.habitProgress,
                [habitId]: clamped,
              },
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    []
  );

  const toggleHabitOnDay = useCallback((dateKey: string, habit: Habit) => {
    setState((prev) => {
      const existingDay = prev.days[dateKey] ?? createEmptyDayRecord(dateKey);
      const currentVal = existingDay.habitProgress[habit.id] ?? 0;
      const nextVal = currentVal >= habit.target ? 0 : habit.target;
      return {
        ...prev,
        days: {
          ...prev.days,
          [dateKey]: {
            ...existingDay,
            habitProgress: {
              ...existingDay.habitProgress,
              [habit.id]: nextVal,
            },
            updatedAt: Date.now(),
          },
        },
      };
    });
  }, []);

  const addHabit = useCallback(
    (payload: {
      name: string;
      category: HabitCategory;
      type: HabitType;
      target: number;
      unit: string;
      createdAt: string;
    }) => {
      const newHabit: Habit = {
        id: `hab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: payload.name.trim(),
        category: payload.category,
        type: payload.type,
        target: payload.type === 'binary' ? 1 : Math.max(1, payload.target),
        unit: payload.type === 'binary' ? '' : payload.unit.trim(),
        archived: false,
        createdAt: payload.createdAt,
      };
      setState((prev) => ({
        ...prev,
        habits: [...prev.habits, newHabit],
      }));
    },
    []
  );

  const updateHabit = useCallback(
    (
      habitId: string,
      patch: Partial<Pick<Habit, 'name' | 'category' | 'type' | 'target' | 'unit' | 'archived'>>
    ) => {
      setState((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => (h.id === habitId ? { ...h, ...patch } : h)),
      }));
    },
    []
  );

  const deleteHabit = useCallback((habitId: string) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
    }));
  }, []);

  const updateVitals = useCallback(
    (dateKey: string, patch: Partial<DayVitals>) => {
      setState((prev) => {
        const existingDay = prev.days[dateKey] ?? createEmptyDayRecord(dateKey);
        return {
          ...prev,
          days: {
            ...prev.days,
            [dateKey]: {
              ...existingDay,
              vitals: {
                ...existingDay.vitals,
                ...patch,
              },
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    []
  );

  const updateNotes = useCallback(
    (dateKey: string, patch: { winNote?: string; reflection?: string }) => {
      setState((prev) => {
        const existingDay = prev.days[dateKey] ?? createEmptyDayRecord(dateKey);
        return {
          ...prev,
          days: {
            ...prev.days,
            [dateKey]: {
              ...existingDay,
              ...patch,
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    []
  );

  const logFocusSession = useCallback(
    (dateKey: string, minutes: number, label: string) => {
      const session: FocusSession = {
        id: `fs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: dateKey,
        minutes,
        label: label.trim() || 'Focus Session',
        completedAt: Date.now(),
      };
      setState((prev) => {
        // Also increment any numeric Focus habit automatically if it matches deep work
        const deepWorkHabit = prev.habits.find(
          (h) => !h.archived && h.type === 'numeric' && h.category === 'Focus' && h.unit.toLowerCase().includes('min')
        );
        if (!deepWorkHabit) {
          return {
            ...prev,
            focusSessions: [session, ...prev.focusSessions],
          };
        }
        const existingDay = prev.days[dateKey] ?? createEmptyDayRecord(dateKey);
        const currentVal = existingDay.habitProgress[deepWorkHabit.id] ?? 0;
        return {
          ...prev,
          focusSessions: [session, ...prev.focusSessions],
          days: {
            ...prev.days,
            [dateKey]: {
              ...existingDay,
              habitProgress: {
                ...existingDay.habitProgress,
                [deepWorkHabit.id]: currentVal + minutes,
              },
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    []
  );

  const resetToSampleData = useCallback(() => {
    setState(createSeedData());
  }, []);

  const clearAllData = useCallback(() => {
    setState({
      habits: [],
      tasks: [],
      days: {},
      focusSessions: [],
    });
  }, []);

  const importState = useCallback((nextState: TrackerState) => {
    setState(nextState);
  }, []);

  return {
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
  };
}
