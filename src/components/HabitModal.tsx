import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Habit, HabitCategory, HabitType } from '../types/tracker';
import { getTodayKey } from '../utils/date';

interface HabitModalProps {
  open: boolean;
  editingHabit: Habit | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    category: HabitCategory;
    type: HabitType;
    target: number;
    unit: string;
    createdAt: string;
  }) => void;
}

const CATEGORIES: HabitCategory[] = ['Health', 'Focus', 'Mindfulness', 'Routine'];

export function HabitModal({ open, editingHabit, onClose, onSave }: HabitModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Health');
  const [type, setType] = useState<HabitType>('binary');
  const [target, setTarget] = useState('30');
  const [unit, setUnit] = useState('min');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingHabit) {
      setName(editingHabit.name);
      setCategory(editingHabit.category);
      setType(editingHabit.type);
      setTarget(String(editingHabit.target));
      setUnit(editingHabit.unit || 'min');
    } else {
      setName('');
      setCategory('Health');
      setType('binary');
      setTarget('30');
      setUnit('min');
    }
    setError('');
  }, [open, editingHabit]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a habit name.');
      return;
    }
    const parsedTarget = Number(target);
    if (type === 'numeric' && (!Number.isFinite(parsedTarget) || parsedTarget < 1)) {
      setError('Enter a numeric target of at least 1.');
      return;
    }
    onSave({
      name: trimmed,
      category,
      type,
      target: type === 'binary' ? 1 : Math.round(parsedTarget),
      unit: type === 'binary' ? '' : unit.trim() || 'units',
      createdAt: editingHabit?.createdAt ?? getTodayKey(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2
            id="habit-modal-title"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50"
          >
            {editingHabit ? 'Edit Habit' : 'Create Habit'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="habit-name-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Habit Name
            </label>
            <input
              id="habit-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Mobility, Read 20 pages"
              autoFocus
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="habit-category-select"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Category
              </label>
              <select
                id="habit-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Tracking Mode
              </span>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setType('binary')}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                    type === 'binary'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  Check-off
                </button>
                <button
                  type="button"
                  onClick={() => setType('numeric')}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                    type === 'numeric'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  Target
                </button>
              </div>
            </div>
          </div>

          {type === 'numeric' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="habit-target-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Daily Target
                </label>
                <input
                  id="habit-target-input"
                  type="number"
                  min={1}
                  max={10000}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="habit-unit-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Unit
                </label>
                <input
                  id="habit-unit-input"
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="min, pages, glasses"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              {editingHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
