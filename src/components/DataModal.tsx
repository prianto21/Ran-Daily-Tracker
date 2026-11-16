import { useRef, useState } from 'react';
import { Download, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import type { TrackerState } from '../types/tracker';

interface DataModalProps {
  open: boolean;
  state: TrackerState;
  onClose: () => void;
  onImport: (nextState: TrackerState) => void;
  onResetSample: () => void;
  onClearAll: () => void;
}

export function DataModal({
  open,
  state,
  onClose,
  onImport,
  onResetSample,
  onClearAll,
}: DataModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [confirmMode, setConfirmMode] = useState<'none' | 'reset' | 'clear'>('none');

  if (!open) return null;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ran-track-app-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({ type: 'ok', text: 'Backup downloaded as JSON.' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as TrackerState;
        if (
          !parsed ||
          !Array.isArray(parsed.habits) ||
          !Array.isArray(parsed.tasks) ||
          typeof parsed.days !== 'object'
        ) {
          setFeedback({ type: 'err', text: 'Invalid backup file structure.' });
          return;
        }
        onImport({
          habits: parsed.habits,
          tasks: parsed.tasks,
          days: parsed.days,
          focusSessions: Array.isArray(parsed.focusSessions) ? parsed.focusSessions : [],
        });
        setFeedback({ type: 'ok', text: 'Backup imported successfully.' });
      } catch {
        setFeedback({ type: 'err', text: 'Could not parse JSON file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2
            id="data-modal-title"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50"
          >
            Backup & Workspace Data
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

        <div className="mt-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your daily logs, tasks, habits, and reflections are saved locally in your browser.
            Export a JSON snapshot anytime for portability.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Upload className="h-4 w-4" />
              <span>Import JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="space-y-2.5">
              {confirmMode === 'none' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmMode('reset')}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-slate-500" />
                      <span>Restore Sample History (45 Days)</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmMode('clear')}
                    className="flex w-full items-center justify-between rounded-lg border border-red-200 px-3.5 py-2.5 text-left text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      <span>Clear All Data (Start Empty)</span>
                    </span>
                  </button>
                </>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {confirmMode === 'reset'
                      ? 'Replace current logs with 45 days of sample history?'
                      : 'Delete all tasks, habits, and daily logs permanently?'}
                  </p>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmMode('none')}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmMode === 'reset') {
                          onResetSample();
                          setFeedback({ type: 'ok', text: 'Sample history restored.' });
                        } else {
                          onClearAll();
                          setFeedback({ type: 'ok', text: 'Workspace cleared.' });
                        }
                        setConfirmMode('none');
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${
                        confirmMode === 'clear'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {feedback && (
            <p
              className={`text-xs font-medium ${
                feedback.type === 'ok'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {feedback.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
