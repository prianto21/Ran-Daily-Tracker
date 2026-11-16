import type { DayRecord, DailyTask, FocusSession, Habit, TrackerState } from '../types/tracker';
import { addDays, getTodayKey } from '../utils/date';

export function createEmptyDayRecord(date: string): DayRecord {
  return {
    date,
    habitProgress: {},
    vitals: {
      water: 0,
      sleepHours: 7,
      mood: 0,
      energy: 0,
    },
    winNote: '',
    reflection: '',
  };
}

export function createSeedData(): TrackerState {
  const today = getTodayKey();
  const yesterday = addDays(today, -1);

  const habits: Habit[] = [
    {
      id: 'hab-deep-work',
      name: 'Morning Deep Work',
      category: 'Focus',
      type: 'numeric',
      target: 90,
      unit: 'min',
      archived: false,
      createdAt: addDays(today, -60),
    },
    {
      id: 'hab-movement',
      name: 'Strength or Run',
      category: 'Health',
      type: 'binary',
      target: 1,
      unit: '',
      archived: false,
      createdAt: addDays(today, -60),
    },
    {
      id: 'hab-reading',
      name: 'Read Non-Fiction',
      category: 'Mindfulness',
      type: 'numeric',
      target: 20,
      unit: 'pages',
      archived: false,
      createdAt: addDays(today, -60),
    },
    {
      id: 'hab-hydration',
      name: 'Hydration Target',
      category: 'Health',
      type: 'numeric',
      target: 8,
      unit: 'glasses',
      archived: false,
      createdAt: addDays(today, -60),
    },
    {
      id: 'hab-inbox-zero',
      name: 'Clear Inbox & Triage',
      category: 'Routine',
      type: 'binary',
      target: 1,
      unit: '',
      archived: false,
      createdAt: addDays(today, -60),
    },
    {
      id: 'hab-meditation',
      name: 'Evening Breathwork',
      category: 'Mindfulness',
      type: 'binary',
      target: 1,
      unit: '',
      archived: false,
      createdAt: addDays(today, -60),
    },
  ];

  const days: Record<string, DayRecord> = {};
  const focusSessions: FocusSession[] = [];

  const reflectionNotes = [
    {
      win: 'Shipped the Q4 architecture spec ahead of schedule.',
      note: 'Protecting the first 90 minutes before checking messages made a clear difference in focus quality.',
    },
    {
      win: 'Completed interval run despite cool morning weather.',
      note: 'Energy dipped briefly around 3 PM; stepping away for a 15-minute walk restored clarity.',
    },
    {
      win: 'Cleared 38 backlog items and closed weekly sprint.',
      note: 'Batching code reviews right after lunch kept the afternoon open for deep writing.',
    },
    {
      win: 'Finished two chapters on systems thinking.',
      note: 'Keeping phone out of the bedroom improved sleep onset and morning alertness.',
    },
    {
      win: 'Led crisp 25-minute design critique with zero overrun.',
      note: 'Writing agenda bullets beforehand eliminated circular discussion.',
    },
  ];

  // Populate past 45 days with realistic non-uniform consistency
  for (let offset = 45; offset >= 1; offset--) {
    const dateKey = addDays(today, -offset);
    const seed = offset * 17 + 7;

    const deepWorkVal = offset <= 6 ? 90 : seed % 5 !== 0 ? 90 : 45;
    const movementVal = offset <= 3 ? 1 : seed % 3 !== 0 ? 1 : 0;
    const readingVal = offset <= 5 ? 20 : seed % 4 !== 0 ? 20 : 10;
    const hydrationVal = offset <= 4 ? 8 : 5 + (seed % 4);
    const inboxVal = seed % 4 !== 0 ? 1 : 0;
    const meditationVal = offset <= 8 ? 1 : seed % 3 !== 0 ? 1 : 0;

    const noteSample = reflectionNotes[offset % reflectionNotes.length];
    const hasNote = offset <= 10 || offset % 2 === 0;

    days[dateKey] = {
      date: dateKey,
      habitProgress: {
        'hab-deep-work': deepWorkVal,
        'hab-movement': movementVal,
        'hab-reading': readingVal,
        'hab-hydration': hydrationVal,
        'hab-inbox-zero': inboxVal,
        'hab-meditation': meditationVal,
      },
      vitals: {
        water: hydrationVal,
        sleepHours: Number((6.5 + (seed % 5) * 0.5).toFixed(1)),
        mood: 3 + (seed % 3),
        energy: 3 + ((seed + 1) % 3),
      },
      winNote: hasNote ? noteSample.win : '',
      reflection: hasNote ? noteSample.note : '',
      updatedAt: Date.now() - offset * 86400000,
    };

    if (deepWorkVal >= 60) {
      focusSessions.push({
        id: `fs-${dateKey}-1`,
        date: dateKey,
        minutes: deepWorkVal >= 90 ? 50 : 25,
        label: 'Morning Deep Work',
        completedAt: Date.now() - offset * 86400000,
      });
      if (deepWorkVal >= 90) {
        focusSessions.push({
          id: `fs-${dateKey}-2`,
          date: dateKey,
          minutes: 40,
          label: 'Project Execution',
          completedAt: Date.now() - offset * 86400000 + 3600000,
        });
      }
    }
  }

  // Today's active state (partially completed so user can interact immediately)
  days[today] = {
    date: today,
    habitProgress: {
      'hab-deep-work': 50,
      'hab-movement': 1,
      'hab-reading': 12,
      'hab-hydration': 5,
      'hab-inbox-zero': 1,
      'hab-meditation': 0,
    },
    vitals: {
      water: 5,
      sleepHours: 7.5,
      mood: 4,
      energy: 4,
    },
    winNote: 'Completed morning workout and cleared inbox before 9 AM.',
    reflection: 'Focusing on finishing the product roadmap draft before afternoon sync.',
    updatedAt: Date.now(),
  };

  focusSessions.push({
    id: `fs-${today}-1`,
    date: today,
    minutes: 50,
    label: 'Roadmap Architecture Draft',
    completedAt: Date.now() - 5400000,
  });

  const tasks: DailyTask[] = [
    {
      id: 'tsk-1',
      date: today,
      title: 'Finalize Q4 product roadmap milestones',
      completed: true,
      priority: 'high',
      category: 'Work',
      estimateMinutes: 50,
      createdAt: Date.now() - 100000,
    },
    {
      id: 'tsk-2',
      date: today,
      title: 'Review pull requests for analytics pipeline',
      completed: true,
      priority: 'medium',
      category: 'Work',
      estimateMinutes: 30,
      createdAt: Date.now() - 90000,
    },
    {
      id: 'tsk-3',
      date: today,
      title: 'Prepare concise weekly status summary',
      completed: false,
      priority: 'high',
      category: 'Work',
      estimateMinutes: 25,
      createdAt: Date.now() - 80000,
    },
    {
      id: 'tsk-4',
      date: today,
      title: 'Book dental checkup & pick up groceries',
      completed: false,
      priority: 'low',
      category: 'Personal',
      estimateMinutes: 20,
      createdAt: Date.now() - 70000,
    },
    {
      id: 'tsk-5',
      date: today,
      title: 'Read chapter 6 of Designing Data-Intensive Apps',
      completed: false,
      priority: 'medium',
      category: 'Learning',
      estimateMinutes: 30,
      createdAt: Date.now() - 60000,
    },
    // Yesterday's tasks (including one incomplete task to demonstrate rollover!)
    {
      id: 'tsk-y1',
      date: yesterday,
      title: 'Send revised onboarding checklist to team',
      completed: true,
      priority: 'high',
      category: 'Work',
      estimateMinutes: 25,
      createdAt: Date.now() - 90000000,
    },
    {
      id: 'tsk-y2',
      date: yesterday,
      title: 'Organize tax receipts folder for accountant',
      completed: false,
      priority: 'medium',
      category: 'Personal',
      estimateMinutes: 20,
      createdAt: Date.now() - 89000000,
    },
  ];

  return {
    habits,
    tasks,
    days,
    focusSessions,
  };
}
