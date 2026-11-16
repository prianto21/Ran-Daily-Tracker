import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar';
}

export function PWAInstallButton({ variant = 'header' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleClick}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
        >
          <Smartphone className="h-4 w-4 shrink-0" />
          <span>Install Phone App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          title="Install Ran Track App on Android or iPhone"
        >
          <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden xs:inline sm:inline">Install App</span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2
                id="install-guide-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50"
              >
                Install Ran Track App on Phone
              </h2>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Close install instructions"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              {isIOS ? (
                <div className="space-y-2">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    iPhone / iPad (Safari):
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-5 text-xs leading-relaxed">
                    <li>Open this page in Safari on your iPhone or iPad.</li>
                    <li>
                      Tap the <strong>Share</strong> icon in the bottom Safari toolbar.
                    </li>
                    <li>
                      Scroll down and tap <strong>Add to Home Screen</strong>.
                    </li>
                    <li>
                      Tap <strong>Add</strong> to launch Ran Track App fullscreen like a native app.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      Android (Google Chrome):
                    </p>
                    <ol className="mt-1.5 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed">
                      <li>Open the app URL in Google Chrome on your Android phone.</li>
                      <li>
                        Tap the three-dot menu (<strong>⋮</strong>) at the top-right corner of Chrome.
                      </li>
                      <li>
                        Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).
                      </li>
                      <li>
                        Confirm <strong>Install</strong> — the Ran Track icon will appear on your Android home screen and open fullscreen offline.
                      </li>
                    </ol>
                  </div>

                  <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tip: Your tasks, habits, and daily logs are stored locally on your device and remain available even without internet access.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
